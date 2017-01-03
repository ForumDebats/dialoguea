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


var   //sharp = require('sharp')
	log = require('./log')
	, bcrypt = require("bcryptjs")
	, mongoose = require('mongoose')
	, schema = require ('./db/schemas')
	, utils = require('./utils')
	, dl = require('./dl')
	, settings = require('../settings').configuration
	, _ = require('underscore') ;

var   User = schema.User
	, Group = schema.Group
	, Debat = schema.Debat
	, Categorie = schema.Categorie
	, Document = schema.Document
	, Commentaire  = schema.Commentaire ;


/* TODO
loginACLpolicy = {
	attempt_lock: 6,
	auto_unlock: false,
	auto_unlocktime: 24 * 60
} */


// local + exports
var   Usr  = exports.User = mongoose.model('User', User)
	, Docu = exports.Document = mongoose.model('Document', Document)
	, Grp  = exports.Group = mongoose.model('Group', Group)
	, Cmt  = exports.Commentaire = mongoose.model('Commentaire', Commentaire)
	, Cat  = exports.Categorie = mongoose.model('Categorie', Categorie)
	, Dbt  = exports.Debat = mongoose.model('Debat', Debat)


Debat.pre('save', function (next) {
	this.dateOuverture = Date.now();
	this.wasNew = this.isNew
	next();
})


Debat.post('save', function (/*next*/) {
	var D = this;
	log.dbg("New debate open (", D.titre, D._id,')', 'gid=(', D.gids,')','cat=(', D.categorie, 'rootcmt=(',D.rootCmt,')')
	Grp.update({_id: {$in: this.gids}}, {$inc: {openDebates: D.status ? 0 : 1}}, {multi: true}, function (e, G) {})
	Cat.findOneAndUpdate(
		{_id: this.categorie},
		{$push: {debats: this._id}},
		{safe: true, upsert: false},
		function(err, c) {
			if(err) log.dbg(err)
			else log.dbg("Categorie updated", c.name, c._id, 'debats=[', c.debats,']');
		}
	);
})


exports.findUserById = findUsr = function (id, next) {
	Usr.findById(id, function (e, u) {
		if(e) log.error(e)
		if (next) next(u)
	});
}


exports.findUser = function (field, next) {
	Usr.findOne(field, function (e, u) {
		if(e) log.error(e)
		if (next) next(u)
	});
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


/** nouvel utilisateur. Lui génèrer un mot de passe
 * !=  de l'enregistrement par mail
 * */
User.methods.post = function (entity) {
	log.dbg("user post")
	entity.password = require('./genpasswd')(9)
};

User.pre('save', function (next) {
	log.dbg("user pre saved")
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

Group.methods.delete = function (g) { // delete all users in the group
	log.dbg("deleting group", g._id)
	Usr.find({gid: g._id}).remove(function (e, o) {})
};

Document.pre('save', function (next) {
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
Document.post('save', function () {
	if (this.wasNew) {
		var cat = this.categorie
		Docu.count({categorie: cat}, function (e, c) {
			//Cat.findOneAndUpdate({ _id : cat}, {nbDocs: c}, {new: true}, function(err, d) {});
			Cat.update({_id: cat}, {nbDocs: c}, function (e, c) {});
		})
	}
})

Document.methods.delete = function (doc) {
	log.dbg("deletion of", doc.titre1, doc.titre2);
	Docu.count({categorie: doc.categorie}, function (e, c) {
		Cat.update({_id: doc.categorie}, {nbDocs: c}, function (e, c) {
		});
	})
};

/**
 * sauve une catégorie. Télécharge l'image si c'est une url
 * TODO : fix https et certaine formation d'url avec une query
 */
Categorie.pre('save', function (next) {
	var C = this
	if (utils.validUrlImg(this.img)) {
		// then proceed to dl and conversion
		dl.dl(this.img, function (res_data, file) {
			log.dbg(file)
			C.img = settings.UPLOAD_DIR + file
			sharp(settings.ABS_UPLOAD_DIR + file)
					.resize(settings.THUMB.WIDTH, settings.THUMB.HEIGHT)
					.toFile(settings.ABS_UPLOAD_DIR + file + ".png", function (err) {
						// output.jpg is a 200 pixels wide and 200 pixels high image
						// containing a scaled and cropped version of input.jpg
						C.img = settings.UPLOAD_DIR + file + ".png"
						next()
					});
		})
	}
	else {
		log.dbg(this)
		next()
	}
})


Categorie.methods.delete = function (c) {
	log.dbg("deleting categorie", c.name)
	Docu.find({categorie: c._id}).remove(function (e, d) {})
};

exports.getGroups = function ( req, res /*, next*/) {
	Grp.find(function (e, g) { res.send(g) })
}

/** autodate and parent to comment.parentId
 * !! dont try a 'pre' save call, as the tree plugin as precedence
 */
Commentaire.methods.post = function (cmt,next) {
	// todo : vérifier que le débat est ouvert
	// todo : déclarer date.now dans la valeur par défat
	if(!cmt.date) cmt.date = Date.now()
	if(cmt.parentId) {// c'est un commentaire de débat
		Cmt.findById(cmt.parentId, function (e, p) {
			if (p) { //double check
				cmt.parent = p
				cmt.temp = true
				cmt.save({})
				Dbt.findOneAndUpdate({_id:cmt.debat},{lastpostDate:cmt.date},{upsert: false}, function(err,d) {
					log.dbg('new comment', d.posts)
					//log.dbg("dbt updated", d, cmt.date)
				})
				if(next) next()
			}
		})
	}else{ if(next) next() }
}

Commentaire.methods.put = function (cmt) {
	log.dbg("PUT COMMENT!")
	if (this.temp) { log.dbg('a temp comment') }
}

Commentaire.post('save', function (next) {})

// post save : new cron job
// post saved and temp validaed : send mail au referer
/* attention le moongoose path tree lui attribue déjà un middle ware */



/*
 * retourne l'arbre des commentaires = le débat
 */
exports.cmtTree = function (req, res, next, id) {

	try{
		Cmt.findById(id).exec ( function (err, c) {
			if (err) {
				log.dbg("(no such comment)")
				return res.status(404).json('no such comment');
			}
			if (!c) {
				log.dbg('!c')
				return res.status(404).json('no such comment');
			} else {
				//c.argumentation='' // flush out the root argumentation, it's already sent individually
				var tempMessagefilter =  [ { temp:{$ne:true} } ]
				if(req.user) // le propriétaire du messsage temporaire peut le voir
					tempMessagefilter.push ({ uid: req.user.uid } )
				var args = {
					recursive: true,
					filters: {
						moderated: {$ne: 1},
						$or: tempMessagefilter // return temp comment only of user itself
					}
					//options: {populate: 'hypostases'}
				}
				c.getChildrenTree(args, function (e, ch) {
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
};


// dump des commentaires // todo à degager
exports.cmtQuery = function (req, res) {
	log.dbg("query Commentaire")
	Cmt.find().exec(function (err, c) {
		log.dbg(c)
		if (err) return res.json(500, err);
		else res.json(c);
	});
};


/**
 * Décompte des avis dans le débat
 * @param N : nombre de vote dans chaque catégorie
 * @param C : noeud courant dans l'arbre de commentaires
 * @param l : décompte récursif
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

exports.debatStats = function (id, next) {
	Cmt.findById(id, function (err, c) {
		if (err) {
			log.error(err)
		}
		var args = {recursive: true};
		c.getChildrenTree(args, function (e, Ch) {
			var N = {n:0, 0:0, 1:0, 2:0, 3:0}
			CountAvis(N, Ch)
			c.count = N
			next(c)
		})
	})
};


exports.catId = function (req, res, next, id) {
	req.catId = id
	next()
}

exports.cats = function(req,res) {

}


/**
 * TODO : modifier le modèle, ajouter la liste des débats présents dans une catégorie
 * créer la page admin pour modifier les catégories (ajout d'étiquette)
 * pour chaque catégorie : peupler avec la liste des debats
 * au post du commentaire : faire le calcul des stats du débats (ok,ko,pc, nbre de post)
 * retourne la liste des catégories, peuplée avec les intitulés des débats
 * créer un tableau avec les débats dans la catégorie
 */
exports.listeDebats = function (req, res) {
	Cat.find({},{_id:1,name:1,debats:1,img:1})
		.populate('debats',
		{_id: 1,titre: 1,posts:1, daccords:1,pasdaccords:1,pascompris:1,lastpostDate:1})
		.exec(function (err, C) {
			res.send(C)
		})

}

/* "jointure" : les catégories pour lesquelles ce groupe mène un débat */
exports.cDbts = function (req, res) {
	if (req.user) {
		//log.dbg('user request debates')
		findUsr(req.user.uid, function (u) {
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

	function findCats(res, all, gid) {
		var R = []

		var groupFilter = all ? {}
				: gid ? {gids:{$in:[gid,GPublic._id]}}
				: {gids:GPublic._id}
		//log.dbgAr(groupFilter)
		//headache starts here
		//Dbt.aggregate([{$match: groupFilter}, {$unwind: "$categorie"},
		//	{"$group": {count: {$sum: 1}, _id: null, categories: {"$addToSet": "$categorie"}}}],
		// les débats pour lesquels l'utilisateur est enregistré

		Dbt.aggregate( [{$match:groupFilter},{$unwind:"$categorie"},{"$group":{ count:{$sum:1},_id:'$categorie', categories:{"$addToSet":"$categorie"} }}],
				//Dbt.aggregate( [{$match:groupFilter},{$unwind:"$categorie"},{"$group":{ count:{$sum:1},_id:"$_id", categories:{"$addToSet":"$categorie"} }}],
				//Dbt.aggregate( [{$match:{}},{$unwind:"$categorie"},{"$group":{ count:{$sum:1},_id:null, categories:{"$addToSet":"$categorie"} }}],
				function (e, D) {
					var T=[],R=[],A=[]
					_.each(D,function(d) {
						//log.dbgAr(d)
						T.push(d.categories)
						R.push({_id:String(d.categories), count:d.count})
					})
					//log.dbgAr(R)
					if(T.length) {
						Cat.find({_id: {$in: T}}, function (e, C) {
							//log.dbg(C)
							_.each(C,function(c) {
								c= c.toObject()
								c.count = _.find(R,function(r) { return (r._id == String(c._id))}).count
								A.push(c)
							})
							//log.dbgAr(A[0])
							res.send(A)
						})
					}
					else res.send('')
				})
			}
		}
		///*

		// N débats et m categories
		//db.debats.aggregate( [{$match:{}},{$unwind:"$categorie"},{"$group":{ count:{$sum:1},_id:null, categories:{"$addToSet":"$categorie"} }}])

		/*suivre cette piste s'il y a un perf bottleneck. /!\ early optim=evil
		Dbt.aggregate(
				[{$match: groupFilter},
					{$unwind: "$categorie"},
					{
						"$group": {
							_id: null,
							categories: {"$addToSet": "$categorie"}
						}
					}], function(e,r) {
					Cat.find({_id:{$in:r[0].categories}},function(e,c) {
						log.dbg(c)
					})
					log.dbgAr(r[0].categories)
				})*/

exports.grpCatDbts = function (req, res) {

	var cat = req.catId

	if (req.user) // request public + private groups
		findUsr(req.user.uid, function (u) {
			if (u)
				if (u.level > 499)
					findDbts(res, cat, true)
			else findDbts(res, cat, false, u.gid)
		})
	else findDbts(res, cat, false, false)

	function findDbts(res, cat, all, gid) {
		var filter = all ? {categorie: cat}
				: gid ? {gids:{$in:[gid,GPublic._id]}, categorie: cat}
				: {gids:GPublic._id, categorie: cat}
		Dbt.find(filter)
				.populate('rootCmt', {_id: 1, citation: 1, reformulation: 1, path: 1})
				.populate('gids', {name: 1, _id: 0})
				.exec(function (err, D) { // don't filter the groups
					if(!D) return
					var L = D.length;
					var n = 0;
					var R = []
					var args = {recursive: true, fields: {_id: 1, children: 1, avis: 1}};
					D.forEach(function (Dx) {
						Cmt.findById({_id: Dx.rootCmt._id}, {_id: 1, citation: 1, reformulation: 1, path: 1}, function (e, C) {
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
							digAvis(C, L)
						})
					})
				})
	}
}


exports.grpDbts = function (req, res) {

	/*
	 TODO:lookup in admin table if req.user.uid present
	 Usr.findOne({id:req.user.uid}, function(e,u) {
	 log.dbg(u)
	 })*/

	var debats = []
	var grp = []

	findUsr(req.user.uid, function (u) {
		var grfilter = u.gid ? {gid: u.gid} : {}
		//log.dbgAr("group ?", grfilter)

		Dbt.find(grfilter)
				.populate('rootCmt', {_id: 1, citation: 1, reformulation: 1, path: 1})
				.populate('gids', {name: 1, _id: 0})
				.exec(function (err, D) { // don't filter the groups
					var L = D.length;
					var n = 0;
					var R = []
					var args = {recursive: true, fields: {_id: 1, children: 1, avis: 1}};
					D.forEach(function (Dx) {
						if (Dx.rootCmt == null)
							log.dbg(Dx._id, Dx.rootCmt)
						else
							Cmt.findById({_id: Dx.rootCmt._id}, {_id: 1, citation: 1, reformulation: 1, path: 1}, function (e, C) {

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
								digAvis(C, L)
							})
					})
				})
	})
}

exports.AllDebates = function (req, res) {

	/*
	 TODO:lookup in admin table if req.user.uid present
	 Usr.findOne({id:req.user.ui}, function(e,u) {
	 log.dbg(u)
	 })*/

	var debats = []
	var grp = []

	Dbt.find({})
			.populate('rootCmt', {_id: 1, citation: 1, reformulation: 1, path: 1})
			.populate('gids', {name: 1, _id: 1})
			.populate('categorie',{_id:1,name:1})
			.exec(function (err, D) { // don't filter the groups

				var L = D.length;
				var n = 0;
				var R = []
				var args = {recursive: true, fields: {_id: 1, children: 1, avis: 1}};
				D.forEach(function (Dx) {
					//log.dbg(Dx)
					Cmt.findById({_id: Dx.rootCmt._id}, {_id: 1, citation: 1, reformulation: 1, path: 1}, function (e, C) {
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
						digAvis(C, L)
					})
				})
			})
}

exports.openCloseDebate = function (id, date, next) {
	var query = {_id: id},
			update = {status: date ? -1 : 0, dateFermeture: date},
			options = {new: true};
	Dbt.findOneAndUpdate(query, update, options, function (err, d) {
		if (err) {
			log.dbg('Error on open/close debate', err);
		} else {
			Grp.update({_id: {$in: d.gids}}, {
				$inc: {
					openDebates: d.status ? -1 : 1,
					closedDebates: d.status ? 1 : -1
				}
			}, {multi: true}, function (e, G) {
			})
			next(d)
		}
	});
}

exports.delDebate = function (id, next) {
	Dbt.findById(id, function (e, d) {
		log.dbg("debat DELETED : (", d.titre, d._id, ") root:",d.rootCmt)
		Grp.update({_id: {$in: d.gids}}, {
			$inc: {
				openDebates: d.status ? 0 : -1,
				closedDebates: d.status ? -1 : 0
			}
		}, {multi: true}, function (e, G) {
			log.dbg('open/close dbt UPDATED after deletion')
		})
		Cat.findOneAndUpdate(
				{_id: d.categorie},
				{$pull: {debats: d._id}},
				{safe: true, upsert: false},
				function(err, c) {
					if(err) log.dbg(err)
					else
						log.dbg("Categorie UPDATED [", c.name,'] dbts=', c.debats);

				}
		);
	}).remove(function (e, n) { // n=number of deleted occurences
		//log.dbg(e,d)
		if(e) log.dbg(e)
		next()
	})
}

exports.login = function (login, password, cbk) {
	Usr.findOne({login: login}, function (err, u) {
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
}

exports.newUser = function (user, next) {
	log.dbg(user)
	var usr = new Usr(user);
	usr.save(function (err, u) {
		if (err) {
			log.error(err);
			next(err)
		} else {
			next()
		}
	});

}

/*
 update temporary messages
*/
var postTempComment = function(){
	//log.dbg('updating temp posts '+ Date.now())

	Cmt.find(
		{
			$and: [
				{temp: true},
				{avis: {$lt :3}},
				//{avis: {$ne :4}}, //should'nt happen
				{date: {$lt: Date.now() - 1000 * settings.TEMPPOSTTIME }}
			]
		},
		{debat:1,_id:0,avis:1},
		function (err, debats) {
			var D={}
			//log.dbg(debats)
			debats.forEach( function(d) {
				//log.dbg(d['debat'])
				var k = d['debat']
				if(!D[k]) { D[k] = {posts:0, avis:[0,0,0] } }
				D[k].posts++
				D[k].avis[d['avis']]++
			})

			_.map(D, function (v,k) {
				//log.dbg(k,v)
				Dbt.findOneAndUpdate({_id:k},
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

	Cmt.update(
		{
			$and: [
				{temp: true},
				{date: {$lt: Date.now() - 1000 * settings.TEMPPOSTTIME }}
			]
		},
		{temp: false},
		{multi: true},
		function (err, count) {
			if(count)
				log.dbg(count, "temp message posted")
		});

}


/**
check every 10 seconds for messages to upadte
*/
var CronJob = require('cron').CronJob;
new CronJob('*/10 * * * * *', function () { postTempComment()
}, null, true, 'Europe/Paris');


function initialUser(nom, prenom, login, password) {
	var user = new Usr();
	user.nom = name;
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
	var docu = new Docu(
			{titre1: titre1, titre2: titre2, texte: texte, categorie: cat}
	)
	docu.save(function (err) {
		if (err) {
			log.error(err);
		} else {
			log.info(docu);
		}
	});
}



var GPublic;
Grp.findOne({name: settings.GROUP_PUBLIC }, function (e, G) {
	//log.dbg("groupe PUBLIC:", G.name, "/", G.membres.length, "inscrits")
	exports.GPublic = GPublic = G;
	if(!G) log.warn ('Groupe publique',settings.GROUP_PUBLIC,
		' absent de la db. Connectez vous au panneau d\'admin')
})
