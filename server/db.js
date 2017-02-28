/**
 * Dialoguea
 * DB.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * author : Philippe Estival -- phil.estival @ free.fr
 * Dual licensed under the MIT and AGPL licenses.
 *
 *
 * Database queries façade
 */


import utils from './utils'
import dl from './dl'
import log from './log'
import settings from '../settings'
import schema from './db/schemas'

var
	mongoose = require('mongoose'),
	bcrypt = require("bcryptjs"),
	_ = require('underscore'),
	async = require('async'),
	ObjectId = mongoose.Schema.ObjectId
	;

mongoose.Promise = require('bluebird');

//require('./db/middleware')


//// USER methods

schema.User.methods.post = function (entity) {
	log.dbg("user post")
	entity.password = require('./genpasswd')(9)
};

schema.User.pre('save', function (next) {
	//log.dbg("user pre saved")
	var user = this;
	if (this.isNew)
		this.creation_date = Date.now()
	else
		this.last_login = Date.now()
	if (this.isModified('password') || this.isNew) {
		var salt = bcrypt.genSaltSync(4);
		user.hash = bcrypt.hashSync(user.password, salt);
	}
	this.wasNew = this.isNew;
	next();
})

schema.User.post('save', function () {
	//log.dbg('user saved')
})


//// GROUP methods
/*
schema.Group.methods.delete = function (g) { // delete all users in the group
	log.dbg("deleting group", g._id)
	//DB.User.find({gid: g._id}).remove(function (e, o) {}) // todo test against
	DB.User.remove({gid: g._id}) // todo test against
};
*/

schema.Group.post('remove',  g => { // delete all users in the group
	log.dbg("deleted group", g._id)
	//DB.User.find({gid: g._id}).remove(function (e, o) {}) // todo test against
	DB.User.remove({gid: g._id}, (e,u)=>{
		if(e) log.dbg(e)
		else log.dbg(u.result.n, 'users removed')
	}) // todo test against
})

//// DOCUMENT methods

schema.Document.pre('save', function (next) {
	if (this.isNew) {
		this.date = Date.now()
	}
	this.wasNew = this.isNew
	next()
})

/**
 * ajout / suppresions de documents.
 * mise à jour du compteur dans la catégorie
 * TODO : pourrait être membre virtuel de la catégorie
 */
schema.Document.post('save', function () {
	if (this.wasNew) {
		var cat = this.categorie
		DB.Document.count({categorie: cat}, function (e, c) {
			//DB.Category.findOneAndUpdate({ _id : cat}, {nbDocs: c}, {new: true}, function(err, d) {});
			DB.Category.update({_id: cat}, {nbDocs: c}, function (e, c) {});
		})
	}
})

schema.Document.methods.delete = function (doc) {
	log.dbg("deletion of", doc.titre1, doc.titre2);
	DB.Document.count({categorie: doc.categorie}, function (e, c) {
		DB.Category.update({_id: doc.categorie}, {nbDocs: c}, function (e, c) {
		});
	})
};


//// CATEGORIE methods

/**
 * sauve une catégorie. Télécharge l'image si c'est une url
 * TODO : fix https et certaine formation d'url avec une query
 */
schema.Categorie.pre('save', function (next) {
	var self = this
	if (utils.validUrlImg(this.img)) {
		// then proceed to dl and conversion
		dl.dl(this.img, function (res_data, file) {
			log.dbg(file)
			self.img = settings.UPLOAD_DIR + file
			sharp(settings.ABS_UPLOAD_DIR + file)
				.resize(settings.THUMB.WIDTH, settings.THUMB.HEIGHT)
				.toFile(settings.ABS_UPLOAD_DIR + file + ".png", function (err) {
					// output.jpg is a 200 pixels wide and 200 pixels high image
					// containing a scaled and cropped version of input.jpg
					self.img = settings.UPLOAD_DIR + file + ".png"
					next()
				});
		})
	}
	else {
		//log.dbg(this)
		next()
	}
})


schema.Categorie.methods.delete = function (c) {
	log.dbg("deleting categorie", c.name)
	DB.Document.find({categorie: c._id}).remove(function (e, d) {})
};



//// COMMENTAIRES methods


schema.Commentaire.methods.put = function (cmt) {
	log.dbg("PUT COMMENT!")
	if (this.temp) { log.dbg('a temp comment') }
}

schema.Commentaire.post('save', function (next) {})

/** autodate and parent to comment.parentId
 * !! dont try a 'pre' save call, as the tree plugin as precedence
 */
schema.Commentaire.methods.post = function (cmt,next) {
	// todo : vérifier que le débat est ouvert
	// todo : déclarer date.now dans la valeur par défat
	if(!cmt.date) cmt.date = Date.now()
	if(cmt.parentId) {// c'est un commentaire de débat
		DB.Comment.findById(cmt.parentId, function (e, p) {
			if (p) { //double check
				cmt.parent = p
				cmt.temp = true
				cmt.save({})
				DB.Comment.findOneAndUpdate(
					{_id:cmt.debat},
					{lastpostDate:cmt.date},
					{upsert: false},
					(e,d) =>{
						log.dbg('new comment', cmt)
						//log.dbg("dbt updated", d, cmt.date)
					})
				if(next) next()
			}
		})
	}else{ if(next) next() }
}


//// DEBAT methods


schema.Debat.pre('save', function (next) {
	this.dateOuverture = Date.now();
	this.wasNew = this.isNew
	next();
})


schema.Debat.post('save', function (/*next*/) {
	var D = this;
	log.dbg("New debate open (", D.titre, D._id,')', 'gid=(', D.gids,')','cat=(', D.categorie, 'rootcmt=(',D.rootCmt,')')
	DB.Group.update({_id: {$in: this.gids}}, {$inc: {openDebates: D.status ? 0 : 1}}, {multi: true}, function (e, G) {})
	DB.Category.findOneAndUpdate(
		{_id: this.categorie},
		{$push: {debats: this._id}},
		{safe: true, upsert: false},
		function(err, c) {
			if(err) log.dbg(err)
			else log.dbg("Categorie updated", c.name, c._id, 'debats=[', c.debats,']');
		}
	);
})


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
		DB.User.findById(id, (e, u) => {
			if (e) log.error(e)
			if (next) next(u)
		});
	},

	findUser: function (field, next) {
		DB.User.findOne(field, (e, u) => {
			if (e) log.error(e)
			if (next) next(u)
		});
	},


   // for restrictions on Users
   getUsers : function (req, res) {
      var gid=req.query.gid
      log.dbg('asking users of',gid)
      isLevel(req.user, 600,
         function () { findUsrs({gid: gid}, function(U) { res.status(200).send(U) }) },
         function () { // else
            isLevel(req.user, 500,
               function() {
                  if ( !isAdminGroup (gid) )
                     findUsrs({gid: gid}, function (U) {
                        res.status(200).send(U)
                     })
                  else findUsersPasswordMasked({gid: gid}, function (U) {
                     log.dbg('requested admin group')
                     res.status(200).send(U)
                  })
               }, //else
               function() { res.status(401).send('unauthorized') }
            )
         }
      )
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
			DB.Comment.findById(id).exec((err, c) => {
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
		DB.Comment.find().exec( (err, c)=>{
			log.dbg(c)
			if (err) return res.json(500, err);
			else res.json(c);
		});
	},


	debatStats : function (id, next) {
		DB.Comment.findById(id, (err, c)=>{
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
	cDbts : function (data, uid, ok, ko) {

		if (uid) {
			DB.findUserById(uid, u => {
				if (u) {
					if (u.level > 499)
						findCats(ok, true )
					else /** request pub and private cats */
						findCats(ok, false, u.gid)
				}
			})
		}
		else {
			// anon user request public debates
			findCats(ok, false, false) // + public //todo
		}
	},


	grpCatDbts : function (req, res) {

		let cat = req.catId

		if (req.user) // request public + private groups
			DB.findUserById(req.user.uid, u=>{
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
			DB.Debat.find(filter)
				.populate('rootCmt', {_id: 1, citation: 1, reformulation: 1, path: 1})
				.populate('gids', {name: 1, _id: 0})
				.exec( (err, D) => { // don't filter the groups
					if(!D) return
					var L = D.length;
					var n = 0;
					var R = []
					var args = {recursive: true, fields: {_id: 1, children: 1, avis: 1}};
					D.forEach( Dx => {
						DB.Comment.findById(
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
										for (var attrname in d) {
												r[attrname] = d[attrname];
											}
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
			//log.dbg("group ?", grfilter)

			DB.Debat.find(grfilter)
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
							DB.Comment.findById(
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
											for (var attrname in d) {
												r[attrname] = d[attrname];
											}
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
		DB.Debat.find({})
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
				DB.Comment.findById(
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
								for (var attrname in d) {
									r[attrname] = d[attrname];
								}
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
		DB.Debat.findOneAndUpdate(query, update, options, function (err, d) {
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

		DB.Debat.findOneAndRemove({_id:id}, (e,d)=>{
			log.dbg("debat DELETED :", d.titre,d._id)
			DB.Group.update({_id: {$in: d.gids}}, {
				$inc: {
					openDebates: d.status ? 0 : -1,
					closedDebates: d.status ? -1 : 0
				}
			}, {multi: true}, ()=>{ //(e,G)=>{ // todo fix. computed value ^
				log.dbg('open/close dbt updated after deletion')
			})
			DB.Category.findOneAndUpdate(
				{_id: d.categorie},
				{$pull: {debats: d._id}},
				{safe: true, upsert: false},
				(err, c)=>{
					if(err) log.dbg(err)
					else log.dbg("Categorie UPDATED", c.name);
				}
			);
			next()
		})
		/*
		DB.Debat.findById(id, (e, d)=>{

		}).remove((e,r)=>{ // n=number of deleted occurences
			if(e) log.dbg(e)
			else log.dbg(r.result.n,'debates deleted')
			next()
		})*/
	},

	login : function (login, password, cbk) {
		DB.User.findOne({login: login}, (err, u)=>{
			if (err) log.dbg(err)
			else {
				if (!u) {
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



function findCats(reply, all, gid) {

	var groupFilter = all ? {}
		: gid ? {gids:{$in:[gid, DB.GPublic._id]}}
		: {gids: DB.GPublic._id}
	//log.dbg(groupFilter)
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
				//log.dbg(d)
				T.push(d.categories)
				R.push({_id:String(d.categories), count:d.count})
			})
			//log.dbg(R)
			if(T.length) {
				DB.Category.find({_id: {$in: T}}, (e, C)=>{
					//log.dbg(C)
					_.each(C, c=>{
						c= c.toObject()
						c.count = _.find(R, r => { return (r._id == String(c._id))}).count
						A.push(c)
					})
					//log.dbg(A[0])

					reply(A)
				})
			}
			else reply('')
		})
}


function digAvis(args, R, Dx, c, length, next) {
	c.getChildrenTree(args, (e, Ch) => {
		let r = c.toObject(),
			d = Dx.toObject(),
			N = {n: 0, 0: 0, 1: 0, 2: 0, 3:0}
		CountAvis(N, Ch)
		r.count = N
		for (var attrname in d) {
			r[attrname] = d[attrname];
		}

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
 check every 20 seconds for messages to update
 */
var CronJob = require('cron').CronJob;
new CronJob('*/20 * * * * *', ()=>{ postTempComment()
}, null, true, 'Europe/Paris');


/*
 update temporary messages
 */
var postTempComment = function(){
	//log.dbg('updating temp posts '+ Date.now())
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


// masked pass
var GAdmins;
var GAdminsIds = []
function isAdminGroup(gid) {
   //log.dbg(gid,GAdminsIds, GAdminsIds.indexOf(gid))
   return GAdminsIds.indexOf(gid) != -1
}

DB.Group.find({name: {$in: settings.ADMIN_GROUP} }, function (e, G) {
   //log.dbg("groupe PUBLIC:", G.name, "/", G.membres.length, "inscrits")
   exports.GAdmins = GAdmins = G;
   log.info("Groupes Admins :")
   if(G) {
      _.each(G,function(g) { log.dbg(g.name, g._id) ; GAdminsIds.push(String(g._id))  } )
      if(G.length==0) { log.warn('aucun!')}
      exports.GAdminsIds = GAdminsIds;
   }
})
