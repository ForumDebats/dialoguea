/**
 * Date: <2014-12-01 16:29:44>
 * DialogueA
 * estival@enov-formation.com
 *
 * server/routes.js
 * HTTP get & post routes

 TODO : user U has access only to /api/debats(i) if U in G & G in D(id)
 * D(i).G[ U(G) ] exists
 *
 * 18.11.15 major update : bridge revu et corrigé
 */

import DB from './db'
import * as ACL from './routes/acl'

var   settings = require('../settings')
	, _   = require('underscore')
	, log = require('./log')
	, io  = require('./messaging')
	, utils = require('./utils')
	, MongoRest = require('./mongorest')
	, publicKey  = require('./key').pub
	, jwt = require('express-jwt')
	, uploadHandlerImg = require('./upload').uploadHandlerImg
	, uploadHandlerDbtImg = require('./upload').uploadHandlerDbtImg
	, uploadHandlerDebatMedia = require('./upload').uploadHandlerDebatMedia
	, uploadHandlerXls = require('./upload').uploadHandlerXls
	, invitationHandler = require('./routes/invitation')
	, login = require('./routes/login')
	, getIp = require('./routes/tracerequest').getIp
	, userListing = require('./routes/userlisting')

	//, methodOverride = require('method-override');


module.exports = function (app) {

	app.login = login.login

	// for CORS middleware
	// app.use(methodOverride());
	app.use(function(req, res, next) {
		//traceRequest(req)
		//log.debug(req.method, req.url,req.params,req.query)
		//res.header("Access-Control-Allow-Origin", "*");
		//res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		next();
	});

	app.use('/api/*', jwt({secret: publicKey}))
	app.use('/apiadm/*', jwt({secret: publicKey}))

	app.use(function (err, req, res, next) {
		if (err.name === 'UnauthorizedError') {
			log.dbg(getIp(req),"anon access", req.url) //, req.headers ['user-agent']);

			if (( settings.MODE_PUBLIC || req.user )
			// simply ask for a user to proceed
			   && req.header('app') == 'dialoguea'
			)
			{
				next()
			}
			else {
				log.dbg("missing header or user(", req.user,")")
				//res.status(404).send()
				//res.status(404).send({ error: 'Something failed!' });
				//res.render('404', { error: err });
				res.status(404).send('404')
			}
		}
		else {
			log.dbg("IN:", req.user)
			log.dbg("route error", err)
		}
	});

	function restricted(req,res,next) {
		try {
			log.dbg(getIp(req),'accessing restricted')
			ACL.isAdmin(req.user, ()=>next(), ()=>{ unauthorized(req, res)})
		}
		catch(err) {
			log.dbg(err)
			res.send('server error')
		}
	}

	function unauthorized(req,res) {
		log.warn(getIp(req),"unauthorized access to",req.url,'user:',req.user);
		return res.status(401).send();
	}

	app.get('/api/hi', login.hello )

	app.get("/api/adm.js", function (req, res, next) {
		log.dbg(getIp(req),'admin module reqby', req.user)
		restricted(req,res, ()=>{
			res.sendFile( settings.ADMIN_MODULE )
		})
		//res.sendFile(__dirname + '/views/adminmodule.min.js')
	});
	app.post('/api/invite', invitationHandler )
	app.post('/login', login.reqlogin );
	app.post('/api/newuserlist', userListing )
	app.get('/api/date', function (req, res) {// return server date
		res.status(200).send(String(Date.now()))
	})

	/**
	 * only admin are allowed to post debates, groups, docs and cats
	 */
	const adminPostOnly = ['groups','cat','docs','debat','hypostase']

	adminPostOnly.forEach(function(url) {
		app.post('/api/'+url, function (req, res, next) {
			log.dbg("posting to",url)
			ACL.isAdmin(req.user,
				()=>next(),
				()=>{log.dbg("restricted access")})
		});
	})


	var bridgeGuard = function(req,res,next) {
		log.dbg(getIp(req), req.user && req.user.nom || 'anon', req.url)
		next()
	}

	var CmtPutPrehandler = function(req,res,next) {
		DB.Commentaire.findById(req.params.id, function(err,c) {
			if(err) res.status(400).send(err)

			/*  les commentaires racines sont irrévocables et n'ont pas de parentId
				le commentaire ne peut être modifié que par son auteur */
			if( c && c.parentId && c.temp && c.uid==req.user.uid) {
				DB.Commentaire.findById(c.parentId, function(err,cp) {
					if(err) res.status(400).send(err)
					if(!cp.temp && !cp.moderated) // ensure parent isn't temporary or moderated
						next()
				})
			}
			else {
				res.status(400).send()
			}
		})
	}

	// Mount all the resource on /api prefix
	//var bridge = new MongoRest(app, {urlPrefix: '/api/', requestPrehandler: bridgeGuard, force: 'user'});
	var bridge = new (require('./mongorest'))(app, { urlPrefix : '/api/', requestPrehandler: bridgeGuard});

	// Expose the collections via REST
	// TODO  : specific RULES

	bridge.addResource('groups', DB.Group);
	bridge.addResource('cat', DB.Category, {
		query: { _id:0 },
		hide : ['__v']
	}); // todo:remove. must enforce cat/grp combo
	bridge.addResource('docs', DB.Document);
	bridge.addResource('debat', DB.Debat);
	bridge.addResource('commentaires', DB.Comment, {
			putPrehandler: CmtPutPrehandler, //update
			//readOnly:['_id','uid','date','prenom','parentId','moderated','parent','temp'],
			hide : ['__v']
		}
	)

	function Route(method, route, func) {
		app[method](
			route,
			(req,res)=>{
				if(req.user && req.user.uid) {
					ACL.getUser(
						req.user.uid,
						u => func(
							req.body,
							u._id,
							ok => { res.status(200).send(ok) },
							ko => { log.dbg(ko); res.status(400).send(ko) }
						)
					)
				}
				else {
					log.dbg('missing user or uid')
					res.status(400).send('unauthorized')
				}
			})
	}

	function RoutePublic(method, route, func) {
		app[method](
			route,
			(req,res)=>{
				if(req.user && req.user.uid) {
					ACL.getUser(
						req.user.uid,
						u => func(
							req.body,
							u._id,
							ok => { res.status(200).send(ok) },
							ko => { log.dbg(ko); res.status(400).send(ko) }
						)
					)
				}
				else {
					func(
							req.body,
							null,
							ok => { res.status(200).send(ok) },
							ko => { log.dbg(ko); res.status(400).send(ko) }
						)
				}
			})
	}


	// TODO authorisations
	var adminBridge = new MongoRest( app,
		{
			urlPrefix: '/apiadm/',
			requestPrehandler: restricted
		});

	adminBridge.addResource('users', DB.User, {hide : ['__v','hash']});
	adminBridge.addResource('cat', DB.Category, {
		query: { _id:0 }
	});

	RoutePublic('get','/api/cdebats', DB.cDbts)

	app.param('cmtId', DB.cmtTree);
	app.param('catId', DB.catId);
	app.get('/api/cmt/:cmtId', DB.cmtTree); // isolate one comment, or create a new debate around it
	app.get('/api/1cmt/:cmtId', DB.cmtQuery);

	//app.get('/api/cdebats', DB.cDbts);//with req.user.gid

	app.get('/api/listedebats', DB.listeDebats);//with req.user.gid

	app.get('/api/opendebats', DB.grpDbts);//with req.user.gid
	app.get('/api/grpcatdbts/:catId', DB.grpCatDbts);//with req.user.gid
	app.get('/apiadm/debats', DB.AllDebates);//with req.user.gid

	// nom prenom login password groupe
	app.post('/apiadm/openclosedebate', function (req, res) {
		restricted ( req,res, function () {
			if (req.body.id) {
				var date = req.body.close ? Date.now() : null;
				DB.openCloseDebate(req.body.id, date, function (d) {
					res.status(200).send(d)
				});
			}
		})
	})

	app.post('/apiadm/deldebate', function(req,res) {
		restricted ( req, res, function () {
			log.dbg("deleting",req.body)
			if (req.body.id) {
				DB.delDebate(req.body.id, function (d) {
					res.status(200).send('')
				});
			}else {
				res.status(404).send('')
			}
		})
	})

	app.post('/upimgcategory',  function (req, res) { log.dbg(req.user, 'upload img cat') ; uploadHandlerImg.receiveUpload(req, res); });
	app.post('/updbtimg',       function (req, res) { log.dbg(req.user, 'upload dbt img') ; uploadHandlerDbtImg.receiveUpload(req, res); });
	app.post('/uploadXls',      function (req, res) { log.dbg(req.user, 'upload user listing') ; uploadHandlerXls.receiveUpload(req, res); });
	app.post('/updebatmedia',   function (req, res) { uploadHandlerDebatMedia.receiveUpload(req, res); });
	app.get('/progressDbtImg',  function (req, res) { uploadHandlerDbtImg.progress(req, res); });
	app.get('/progress',        function (req, res) { uploadHandler.progress(req, res); });

	/*app.get('*', function(req,res) {res.render('404');})*/

};

