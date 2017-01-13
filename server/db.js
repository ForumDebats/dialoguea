/**
 * Dialoguea
 * DB.js
 *
 * copyright 2014-2017 Intactile design, Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Dual licensed under the MIT and GPLv3 licenses.
 *
 *
 * Database queries façade
 */

import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import _ from 'underscore'

import schema from './db/schemas'
import utils from './utils'
import dl from './dl'
import log from './log'
import { configuration as settings } from '../settings'

require('./db/middleware')

/* TODO
loginACLpolicy = {
	attempt_lock: 6,
	auto_unlock: false,
	auto_unlocktime: 24 * 60
} */

function proceed(error, value, next) {
	if(error) log.error(error)
	if (next) next(value)
}

var DB = {
	User: mongoose.model('User', schema.User),
	Document: mongoose.model('Document', schema.Document),
	Group: mongoose.model('Group', schema.Group),
	Comment: mongoose.model('Commentaire', schema.Commentaire),
	Category: mongoose.model('Categorie', schema.Categorie),
	Debat: mongoose.model('Debat', schema.Debat),

	GPublic: undefined,

	findUserById: function (id, next) {
		User.findById(id, (e, u) => {
			if (e) log.error(e)
			if (next) next(u)
		});
	},

	findUser: function (field, next) {
		User.findOne(field, (e, u) => {
			if (e) log.error(e)
			if (next) next(u)
		});
	},

	getGroups: function (req, res /*, next*/) {
		DB.Group.find((e, g)=>{
			res.send(g)
		})
	},

	/*
	 * retourne l'arbre des commentaires = le débat
	 */
	cmtTree: function (req, res, next, id) {

		try {
			Comment.findById(id).exec((err, c) => {
				if (err) {
					log.error("(no such comment)")
					return res.status(404).json('no such comment');
				}
				if (!c) {
					log.dbg('!c')
					return res.status(404).json('no such comment');
				} else {
					//c.argumentation='' // flush out the root argumentation, it's already sent individually
					var tempMessagefilter = [{temp: {$ne: true}}]
					if (req.user) // le propriétaire du messsage temporaire peut le voir
						tempMessagefilter.push({uid: req.user.uid})
					var args = {
						recursive: true,
						filters: {
							moderated: {$ne: 1},
							$or: tempMessagefilter // return temp comment only of user itself
						}
						//options: {populate: 'hypostases'}
					}
					c.getChildrenTree(args, (e, ch)=>{
						var r = c.toObject()
						r.children = ch
						res.send(r);
					})
				}
			})
		}
		catch (err) {
			log.dbg(err)
		}
	},


	// dump des commentaires // todo à degager
	cmtQuery : function (req, res) {
		log.dbg("query Commentaire")
		Comment.find().exec( (err, c)=>{
			log.dbg(c)
			if (err) return res.json(500, err);
			else res.json(c);
		});
	},




	debatStats : function (id, next) {
		Comment.findById(id, (err, c)=>{
			if (err) {
				log.error(err)
			}
			var args = {recursive: true};
			c.getChildrenTree(args, (e, Ch)=>{
				var N = {n:0, 0:0, 1:0, 2:0, 3:0}
				CountAvis(N, Ch, 0)
				c.count = N
				next(c)
			})
		})
	},


	catId : function (req, res, next, id) {
		log.dbg('asking catid')
		req.catId = id
		next()
	},



	/**
	 * TODO : modifier le modèle, ajouter la liste des débats présents dans une catégorie
	 * créer la page admin pour modifier les catégories (ajout d'étiquette)
	 * pour chaque catégorie : peupler avec la liste des debats
	 * au post du commentaire : faire le calcul des stats du débats (ok,ko,pc, nbre de post)
	 * retourne la liste des catégories, peuplée avec les intitulés des débats
	 * créer un tableau avec les débats dans la catégorie
	 */
	listeDebats : function (req, res) {
		DB.Category.find({},{_id:1,name:1,debats:1,img:1})
			.populate('debats',
			{_id: 1,titre: 1,posts:1, daccords:1,pasdaccords:1,pascompris:1,lastpostDate:1})
			.exec( (err, C) => res.send(C) )

	},

	/** "jointure" : les catégories pour lesquelles ce groupe mène un débat */
	cDbts : function (req, res) {
		if (req.user) {
			DB.findUser(req.user.uid, function (u) {
				if (u) {
					if (u.level > 499)
						findCats(res, true )
					else // request pub + private cats
						findCats(res, false, u.gid)
				}
			})
		}
		else {
			//log.dbg('anon user request public debates')
			findCats(res, false, false) // + public //todo
		}

	},



	grpCatDbts : function (req, res) {

		let cat = req.catId

		if (req.user) // request public + private groups
			DB.findUser(req.user.uid, u=>{
				if (u)
					if (u.level > 499)
						findDbts(res, cat, true)
					else findDbts(res, cat, false, u.gid)
			})
		else findDbts(res, cat, false, false)

		function findDbts(res, cat, all, gid) {
			var filter = all ? {categorie: cat}
				             : gid ? {gids:{$in:[gid,DB.GPublic._id]}, categorie: cat}
				                   : {gids:DB.GPublic._id, categorie: cat}
			Debat.find(filter)
				.populate('rootCmt', {_id: 1, citation: 1, reformulation: 1, path: 1})
				.populate('gids', {name: 1, _id: 0})
				.exec( (err, D) => { // don't filter the groups
					if(!D) return
					var L = D.length;
					var n = 0;
					var R = []
					var args = {recursive: true, fields: {_id: 1, children: 1, avis: 1}};
					D.forEach( Dx => {
						Comment.findById(
							{_id: Dx.rootCmt._id},
							{_id: 1, citation: 1, reformulation: 1, path: 1},
							(e, C) => {
								function digAvis(c, length) {
									c.getChildrenTree(args, (e, Ch)=> {
										var r = c.toObject()
										var d = Dx.toObject()
										var N = {n: 0, 0: 0, 1: 0, 2: 0, 3: 0}
										CountAvis(N, Ch)
										r.count = N
										_.each(d, attrname=> r[attrname] = d[attrname] )
										R.push(r)
										if (++n == length) {
											res.json(R);
										}
									})
								}

								//log.dbg(Dx)
								digAvis(C, L)
							}
						)
					})
				})
		}
	},


	grpDbts : function (req, res) {

		/*
		 TODO:lookup in admin table if req.user.uid present
		 Usr.findOne({id:req.user.uid}, function(e,u) {
		 log.dbg(u)
		 })*/

		DB.findUser(req.user.uid, (u)=> {
			var grfilter = u.gid ? {gid: u.gid} : {}
			//log.dbgAr("group ?", grfilter)

			Debat.find(grfilter)
				.populate('rootCmt', {_id: 1, citation: 1, reformulation: 1, path: 1})
				.populate('gids', {name: 1, _id: 0})
				.exec( (err, D)=>{ // don't filter the groups
					var L = D.length;
					var n = 0;
					var R = []
					var args = {recursive: true, fields: {_id: 1, children: 1, avis: 1}};
					D.forEach( (Dx)=>{
						if (Dx.rootCmt == null)
							log.dbg(Dx._id, Dx.rootCmt)
						else
							Comment.findById(
								{_id: Dx.rootCmt._id},
								{_id: 1, citation: 1, reformulation: 1, path: 1},
								(e, C) => {
									function digAvis(c, length) {
										c.getChildrenTree(args, (e, Ch)=> {
											var r = c.toObject()
											var d = Dx.toObject()
											var N = {n: 0, 0: 0, 1: 0, 2: 0, 3:0}
											CountAvis(N, Ch)
											r.count = N
											_.each(d, attrname=> r[attrname] = d[attrname] )
											R.push(r)
											if (++n == length) {
												res.json(R);
											}
										})
									}

									//log.dbg(Dx)
									digAvis(C, L)
								}
							)
					})
				})
			}
		)
	},


	AllDebates : function (req, res) {

		Debat.find({})
		.populate('rootCmt', {_id: 1, citation: 1, reformulation: 1, path: 1})
		.populate('gids', {name: 1, _id: 1})
		.populate('categorie',{_id:1,name:1})
		.exec((err, D)=>{ // don't filter the groups

			var L = D.length;
			var n = 0;
			var R = []
			var args = {recursive: true, fields: {_id: 1, children: 1, avis: 1}};
			D.forEach( Dx => {
				//log.dbg(Dx)
				Comment.findById(
					{_id: Dx.rootCmt._id},
					{_id: 1, citation: 1, reformulation: 1, path: 1},
					(e, C)=>{
						digAvis(C, L)

						function digAvis(c, length) {
							c.getChildrenTree(args, function (e, Ch) {
								var r = c.toObject()
								var d = Dx.toObject()
								var N = {n: 0, 0: 0, 1: 0, 2: 0, 3:0}
								CountAvis(N, Ch)
								r.count = N
								_.each(d, attrname=> r[attrname] = d[attrname] )
								R.push(r)
								if (++n == length) {
									res.json(R);
								}
							})
						}
						//log.dbg(Dx)
					}
				)
			})
		})
	},


	openCloseDebate : function (id, date, next) {
		var query = {_id: id},
			update = {status: date ? -1 : 0, dateFermeture: date},
			options = {new: true};
		Debat.findOneAndUpdate(query, update, options, function (err, d) {
			if (err) {
				log.dbg('Error on open/close debate', err);
			} else {
				DB.Group.update({_id: {$in: d.gids}}, {
					$inc: {
						openDebates: d.status ? -1 : 1,
						closedDebates: d.status ? 1 : -1
					}
				}, {multi: true}, ()=>{ //(e,G){
				})
				next(d)
			}
		});
	},

	delDebate : function (id, next) {
		Debat.findById(id, (e, d)=>{
			log.dbg("debat DELETED : (", d.titre, d._id, ") root:",d.rootCmt)
			DB.Group.update({_id: {$in: d.gids}}, {
				$inc: {
					openDebates: d.status ? 0 : -1,
					closedDebates: d.status ? -1 : 0
				}
			}, {multi: true}, ()=>{ //(e,G)=>{ // todo fix. computed value ^
				log.dbg('open/close dbt UPDATED after deletion')
			})
			DB.Category.findOneAndUpdate(
				{_id: d.categorie},
				{$pull: {debats: d._id}},
				{safe: true, upsert: false},
				(err, c)=>{
					if(err) log.dbg(err)
					else log.dbg("Categorie UPDATED [", c.name,'] dbts=', c.debats);
				}
			);
		}).remove((e,n)=>{ // n=number of deleted occurences
			if(e) log.dbg(e)
			else log.dbg(n,'debates deleted')
			next()
		})
	},

	login : function (login, password, cbk) {
		User.findOne({login: login}, (err, u)=>{
			if (err) log.dbg(err)
			else {
				if (!u) {
					log.info(login, "not found");
					cbk(null)
				}
				else {
					if (bcrypt.compareSync(password, u.hash)) { // true
						u.loggedin = true
						u.save()
						cbk(u);
					} else {
						cbk(null)
					}
				}
			}
		});
	},

	newUser : function (user, next) {
		log.dbg(user)
		var U = new User(user);
		U.save((err,u)=>{
			if (err) {
				log.error(err);
				next(err)
			} else {
				log.dbg(u,'created')
				next()
			}
		});
	}
}
/** --- DB --- */

module.exports = DB



function findCats(res, all, gid) {

	var groupFilter = all ? {}
		: gid ? {gids:{$in:[gid, DB.GPublic._id]}}
		: {gids: DB.GPublic._id}
	//log.dbgAr(groupFilter)
	//headache starts here
	//Debat.aggregate([{$match: groupFilter}, {$unwind: "$categorie"},
	//	{"$group": {count: {$sum: 1}, _id: null, categories: {"$addToSet": "$categorie"}}}],
	// les débats pour lesquels l'utilisateur est enregistré

	DB.Debat.aggregate( [
			{$match:groupFilter},
			{$unwind:"$categorie"},
			{"$group":{
				count:{$sum:1},
				_id:'$categorie',
				categories:{"$addToSet":"$categorie"}
			}}],
		//Debat.aggregate( [{$match:groupFilter},{$unwind:"$categorie"},{"$group":{ count:{$sum:1},_id:"$_id", categories:{"$addToSet":"$categorie"} }}],
		//Debat.aggregate( [{$match:{}},{$unwind:"$categorie"},{"$group":{ count:{$sum:1},_id:null, categories:{"$addToSet":"$categorie"} }}],
		(e, D)=>{
			let T=[],R=[],A=[]
			_.each(D, d => {
				//log.dbgAr(d)
				T.push(d.categories)
				R.push({_id:String(d.categories), count:d.count})
			})
			//log.dbgAr(R)
			if(T.length) {
				DB.Category.find({_id: {$in: T}}, (e, C)=>{
					//log.dbg(C)
					_.each(C, c=>{
						c= c.toObject()
						c.count = _.find(R, r => { return (r._id == String(c._id))}).count
						A.push(c)
					})
					//log.dbgAr(A[0])
					res.send(A)
				})
			}
			else res.send('')
		})
}


function digAvis(args, R, Dx, c, length, next) {
	c.getChildrenTree(args, (e, Ch) => {
		let r = c.toObject(),
			d = Dx.toObject(),
			N = {n: 0, 0: 0, 1: 0, 2: 0, 3:0}
		CountAvis(N, Ch)
		r.count = N
		_.each(d,attrname => {
			r[attrname] = d[attrname];
		})

		R.push(r)
		if (++n == length) {
			next(R);
		}
	})
}




/**
 * Décompte des avis dans le débat
 * N : nombre de vote dans chaque catégorie
 * C : noeud courant dans l'arbre de commentaires
 * l : décompte récursif
 */
function CountAvis(N, C, l) {
	for (var _l = 0, _len = C.length; _l < _len; _l++) {
		// count avis 0,1,2 (+,-,dk)
		if (C[_l].avis != 3) {// pas une hypostase
			N[(C[_l].avis)]++;
			N.n++; // count all avis
			if (C[_l].children && C[_l].children.length > 0) // dig
				CountAvis(N, C[_l].children, l++)
		}
	}
}






/**
 @refd : the referenced schema
 refdModel : referenced Schema
 refdField : field of reference to container schema
 container : container schema
 containerField : field of container for referenced
 containerModel
 PB : if multiple post(save)
function linkRefArray( refd, modelRefd, refdField, container, containerModel, containerField, next) {
	var update={}

	refd.post('save', function() {
		l
		var R = this
		update[containerField] = R._id
		if (this.wasNew && this.gid ) {  // et si le groupe est précisé
			container.update({_id: R[refdField]}, {$addToSet: update})
		}})

	refd.methods.delete = function (R) {
		var query={}
		query[containerField] = R._id
		containerModel.update({ _id: R[refdField]}, { $pull: query } ).exec();
	};

	container.methods.delete = function(c) {
		modelRefd.find({refContainer: c._id}).remove(function (e, o) {	})
	}
}

linkRefArray(User,Usr,"gid",Group,Grp,"membres")
/*
User.methods.delete = function (user) {
	Grp.findById(user.gid, function (e, g) {
		if (g) {
			log.dbg(user.login + ' removed from ', g.name, '. ', g.membres.length, 'members left in group')
			g.membres.splice(g.membres.indexOf(user.gid), 1) // todo : vérifie si c'est sauvé
		}
	});
};
*/





function initialUser(nom, login, password) {
	var user = new User();
	user.nom = nom;
	user.login = login;
	user.password = password;
	user.save(function (err) {
		if (err) {
			log.error(err);
		} else {
			log.info(user);
		}
	});
}

function saveDoc(titre1, titre2, texte, cat) {
	var docu = new DB.Document(
		{   titre1: titre1,
			titre2: titre2,
			texte: texte,
			categorie: cat
		}
	)

	docu.save(function (err) {
		if (err) {
			log.error(err);
		} else {
			log.info(docu);
		}
	});
}


/**
 check every 10 seconds for messages to upadte
 */
var CronJob = require('cron').CronJob;
new CronJob('*/10 * * * * *', ()=>{ postTempComment()
}, null, true, 'Europe/Paris');


/*
 update temporary messages
 */
var postTempComment = function(){
	log.silly('updating temp posts '+ Date.now())
	DB.Comment.find(
		{
			$and: [
				{temp: true},
				{avis: {$lt :3}},
				{date: {$lt: Date.now() - 1000 * settings.TEMPPOSTTIME }}
			]
		},
		{debat:1,_id:0,avis:1},
		function (err, debats) {
			var D={}
			debats.forEach( function(d) {
				var k = d['debat']
				if(!D[k]) { D[k] = {posts:0, avis:[0,0,0] } }
				D[k].posts++
				D[k].avis[d['avis']]++
			})

			_.map(D, function (v,k) {
				DB.Debat.findOneAndUpdate({_id:k},
					{$inc: {
						posts: v.posts,
						daccords: v.avis[0],
						pasdaccords: v.avis[1],
						pascompris: v.avis[2]
					}},{safe: true, upsert: false},
					function(err, dd) {
						if(err) log.dbg(err)
					})
			})
			//if(debat)
			//	log.dbg(count, "temp message posted")
		});

	DB.Comment.update(
		{
			$and: [
				{temp: true},
				{date: {$lt: Date.now() - 1000 * settings.TEMPPOSTTIME }}
			]
		},
		{temp: false},
		{multi: true},
		(err, count) => {
			log._silly(count['nModified'], "temp message posted")
		})
}


/**
 vérifie si le groupe publique existe au lancement de la db
 */
DB.Group.findOne( {name: settings.GROUP_PUBLIC },
	(e, G)=>{
		//log.dbg("groupe PUBLIC:", G.name, "/", G.membres.length, "inscrits")
		DB.GPublic = G;
		if(!G) log.warn ('Groupe publique',settings.GROUP_PUBLIC,
			' absent de la db. Connectez vous au panneau d\'admin')
	}
)
