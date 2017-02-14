/**
 * Dialoguea
 * userlisting.js
 *
 * copyright 2014-2016 Forum des débats
 *
 * author : Philippe Estival -- phil.estival @ free.fr
 * Dual licensed under the MIT and AGPL licenses.
 */


import schema from './schemas'
import DB from '../db'
import log from '../log'

/** nouvel utilisateur. Lui génèrer un mot de passe
 * !=  de l'enregistrement par mail
 * */
schema.User.methods.post = function (entity) {
	log.dbg("user post")
	entity.password = require('./genpasswd')(9)
};

schema.User.pre('save', function (next) {
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

schema.Group.methods.delete = function (g) { // delete all users in the group
	log.dbg("deleting group", g._id)
	//DB.User.find({gid: g._id}).remove(function (e, o) {}) // todo test against
	DB.User.find({gid: g._id}).remove() // todo test against
};

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
		log.dbg(this)
		next()
	}
})


schema.Categorie.methods.delete = function (c) {
	log.dbg("deleting categorie", c.name)
	DB.Document.find({categorie: c._id}).remove(function (e, d) {})
};



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
						log.dbg(e,d)
						log.dbg('new comment', d.posts)
						//log.dbg("dbt updated", d, cmt.date)
					})
				if(next) next()
			}
		})
	}else{ if(next) next() }
}


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
