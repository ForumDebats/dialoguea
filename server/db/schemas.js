/**
 * Dialoguea
 * schema.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * author : Philippe Estival -- phil.estival @ free.fr
 * Dual licensed under the MIT and AGPL licenses.
 *
 * BDD définition des schémas Mongoose
 * User, Group, Debat, Categorie, Document, Commentaire
 */

import mongoose from 'mongoose'
import log from '../log'

var   Schema = mongoose.Schema
	, ObjectId = Schema.ObjectId

var Tree = require('mongoose-path-tree');

const OptionalString = {type: String, required: false}

var schema = {

	Group : new Schema({
		name: String,
		membres: [{ref: 'User', type: ObjectId}],
		/*todo: makes this a computed property  please */
		openDebates: {type: Number, 'default': 0},
		closedDebates: {type: Number, 'default': 0},
		admin: [{ref: 'User', type: ObjectId}]
	}),

	User : new Schema({
		nom: String,
		prenom: String,
		login: {type: String, unique: true},

		//gids: [{ref:'Group',type:ObjectId /*,required:true*/}], //
		// TODO: a user can be in several groups
		gid: {ref: 'Group', type: ObjectId /*,required:true*/}, //
		hash: OptionalString,
		email: OptionalString,
		password: String,
		loggedin: {type: Boolean, 'default': false},
		activation: {type: String},
		// activés par défaut (crées via le panneau de gestion des utilisateurs)
		status: {type: Number, 'default': 1}, // 0 created //other:activated //-1:suspended
		level: Number, // 500 is admin so far
		auth_failure: Number,
		last_login: Date,
		canHypostase: {type: Boolean, 'default': false},
		// todo correct cration date : was/went and gone back from pre()
		creation_date: {type: Date, 'default': Date.now(), required: false},
		votes: [{ref: 'Commentaires', type: ObjectId}], // list of up/downvoted items (once)
		lang: String

		//todo
		/*report: {type: Boolean, 'default': true},//wants to receieve reports or not
		 newMgReport: [{ref: 'Commentaires', type: ObjectId, required: false}], //follows-up
		 activityReport: [{ // nouveaux messages depuis le dernier rapport
		 debate: {ref: 'Debat', type: ObjectId}, // débat actif où l'utilisateur est présent
		 numMsg: Number, // nombre de nouveau messages
		 cmts: [{ref: 'Commentaires', type: ObjectId, required: false}] // liste des commentaires dans ce débat
		 }],
		 sessionscope: {type: Boolean, required: false} // is the login data saved in session/local storage
		 */
	}),

	Document : new Schema({
		titre1: String,
		titre2: String,
		texte: String,
		categorie: {type: ObjectId, ref: 'Categorie'},
		version: {type: Number, required: false},
		revisionOf: {type: ObjectId, required: false, ref: 'Document'}, //for future versioning
		creation_date: {type: Date, required: false},
		isPublic: {type: Boolean, 'default': true},
		//owner: {type: ObjectId, ref: 'User'}
	}),

	Categorie : new Schema({
		img: OptionalString,
		name: String,
		nbDocs: {type: Number, 'default': 0, min: 0},
		debats: [{ref: 'Debat', type: ObjectId, required: false}], // débat de référence
		order: {type:Number, 'default':0, required:false}
	}),

	Debat : new Schema({
		titre: String,
		rootCmt: {ref: 'Commentaire', type: ObjectId},
		dateOuverture: {type: Date, required: false},
		dateFermeture: {type: Date, required: false, 'default': null},
		status: {type: Number, 'default': 0, min: -1, max: 1}, // O ouvert, 1=clos
		categorie: [{ref: 'Categorie', type: ObjectId}],
		gids: [{ref: 'Group', type: ObjectId}],
		synthese: [{ref: 'Document', type: ObjectId, required: false}],
		responsable: {type: ObjectId, ref: 'User'},

		posts: {type: Number, required: true, 'default': 0},
		daccords: {type: Number, required: true, 'default': 0},
		pasdaccords: {type: Number, required: true, 'default': 0},
		pascompris: {type: Number, required: true, 'default': 0},
		lastpostDate: {type: Date, required: false}
	}),

	Commentaire : new Schema({
		parentId: {type: ObjectId, required: false},
		prenom: OptionalString,
		uid: {ref: 'User', type: ObjectId},
		date: {type: Date},
		temp: {type: Boolean, required: false}, // ou req true et 'default':no
		citation: {type: String},
		reformulation: {type: String},
		argumentation: {type: String},
		avis: {type: Number, min: 0, max: 4}, //green:0,red:1,blue:2, hypos:3, rootCmt=4
		selection: {type: Object},
		rootCmt: {ref: 'Commentaire', type: ObjectId, required: false},
		// débat de référence, non requis pour les commentaires racines
		debat: {ref: 'Debat', type: ObjectId, required: false}, // débat de référence
		moderated: {type: Number, 'default': 0} // 1:hide, 2:flagged
	}).plugin(Tree, {
			pathSeparator: '#',     // 'default' path separator
			onDelete: 'REPARENT',   // Can be set to 'DELETE' or 'REPARENT'. 'default': 'REPARENT'
			numWorkers: 5,          // Number of stream workers
			idType: ObjectId
		})
	}


/*
let schemasWithOwner = [
	schema.Debat
]

schemasWithOwner.forEach(function(schema) {
	schema.add( { user: {ref: 'User', type: ObjectId } })
})
*/

function setFieldsRequiredByDefautlt(schema) {
	var schs;
	if (!schema.length)
		schs = [schema]
	else schs = schema;

	schs.forEach(schema => {
		var keys = Object.keys(schema.paths);
		keys.forEach( k => {
			let attr = schema.paths[k]
			if (attr.isRequired == undefined && attr.instance != 'Array') {
				attr.required(true);
			}
		})
	})
}

let default_required_collections = [
	schema.Group,
	schema.Debat,
	schema.Categorie,
	schema.Document,
];

setFieldsRequiredByDefautlt(default_required_collections);


function setCreateOrUpdateDate(next) {
	if(this.isNew)
		this.creation_date = Date.now()
	else {
		this.updated_date = Date.now()
	}
	next()
}

let autodate_collections = [
	schema.Group,
	schema.Debat,
	schema.Categorie,
	schema.Document,
	schema.Commentaire,
	schema.Group
]


autodate_collections.forEach(function(schema) {
	schema.add({ creation_date: Date, required:false })
	schema.add({ updated_date: Date, required:false })
})

autodate_collections.forEach( c => c.pre('save', setCreateOrUpdateDate) )

module.exports = schema
