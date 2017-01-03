/**
 * Dialoguea
 * update.js
 *
 * copyright 2014-2017 Intactile design, Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Dual licensed under the MIT and GPLv3 licenses.
 *
 * database patch
 */

var mongoose = require('mongoose'),
		prompt = require('prompt'),
		settings = require('../settings').configuration,
		//User = require("./db.js").User,
		//Debat = require("./db.js").Debat,
		Document = require("./db.js").Document,
		_=require("underscore"),
		DB = require("./db.js"),
		log = require('./log')
//mongoose_uri = process.env.MONGOOSE_URI || settings.DB;

process.on('uncaughtException', function (err) {
	log.error(err.stack)
	process.exit(1)
})


function onErr(err) {
	console.log(err);
	return 1;
}


mongoose.set('debug', settings.DEBUG);
mongoose.connect(settings.MONGO + settings.DB)
mongoose.connection.on('error', function (e) {log.dbg('Mongoose connection error',e);});
mongoose.connection.once('open', function callback() {
	console.log("connexion open / " + settings.MONGO + settings.DB)
	DB.Debat.count({})
			.populate('rootCmt', {_id: 0, citation: 1, reformulation:1, argumentation:1})
			.populate('categorie',{name:1,_id:1})
			.exec(function (err, D) { // don't filter the groups
				console.log(D+" debates")
			})
	update()
})

/*prompt.message = "> ".green;
prompt.delimiter = ""; */
function update() {
	prompt.get([{
		name: 'update',
		message: 'update ?: '.red
	}], function (err, input) {
		if (err) {
			return onErr(err);
		}
		console.log("...");
		console.log('...connecting')

		var j=0
		DB.Debat.find({})
				.populate('rootCmt', {_id: 0, citation: 1, reformulation:1, argumentation:1})
				.populate('categorie',{name:1,_id:1})
				.exec(function (err, D) { // don't filter the groups
					//console.log(err,D)
					_.each(D,function(d) {
						var r= d.rootCmt
						//console.log('\n',d)
						//var doc=
						//console.log(doc.titre1,doc.titre2,)
						//console.log(doc)
						var docu = new Document(
								{titre1: r.citation,titre2: r.reformulation, texte: r.argumentation, categorie: d.categorie[0]._id})

						docu.save(function(err) {
							if(err) console.log(err)
							else j++
							console.log(j,"documents inserted")
						})
					})

					//mongoose.connection.close()

				})
	});
}