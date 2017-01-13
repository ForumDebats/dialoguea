/**
 * Dialoguea
 * login.js
 *
 * copyright 2014-2017 Intactile design, Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Dual licensed under the MIT and GPLv3 licenses.
 *
 * login process
 */
	
var DB = require('../db')
	, log = require('../log')
	, jwtoken = require('jsonwebtoken')
	, traceRequest = require('./tracerequest')
	, publicKey = require('../key').pub

/** à déplacer */
var AdminMenu =
	"<ul id='adminmenunav' class='nav nav-pills admin-nav'>"
	+ "<li id='opendebat'>"
	+ "<a href='#/opendebat' onClick=\"selectMenu('opendebat')\"> Ouvrir un débat</a></li>"
	+ "<li id='groups'>"
	+ "<a href='#/groupes' onClick=\"selectMenu('groups')\"> Groupes</a></li>"
	+ "<li id='documents'>"
	+ "<a href='#/categories' onClick=\"selectMenu('documents')\"> Documents</a></li>"
	+ "<li id='debats'>"
	+ "<a href='#/admdebats' onClick=\"selectMenu('debats')\"> Débats</a></li>"
	+ "</ul>"

var HypostasisBtns = "<div class='HypostaseBtns'><div id='hypostaseBtn' class='button-content'>Hypostase</div></div>"

var login = exports.login = function(user, password, res, ok) {
	if ((user && password )) {
		// TODO : maintain the tokens/hash/user connected DB

		DB.login(user, password, function (u, e) {
			if (e) log.dbg(e)
			else if (!u) {
				log.warn("authentication failure for user ", user)
				res.status(401).send('Échec de connexion : nom d’utilisateur ou mot de passe incorrect');
				// TODO : DB.loginAttempt(user)
			}
			else {
				if(u.status==0) {
					return res.status(401).send('Vous devez d\'abord activer votre compte. ' +
						'Un email vous a été envoyé sur votre messagerie lors de votre inscription.');
				}
				var profile = {
					nom: u.nom,
					prenom: u.prenom,
					gid: u.gid, // must enforce access to /u/id
					uid: u._id,
					indicator: ''
				};
				var token = jwtoken.sign(profile, publicKey, {expiresInMinutes: 60 * 24 * 31});

				if (u.level > 499) {
					log.dbg("admin login")
					profile.indicator = "api/adm.js"
					profile.panel = AdminMenu
				}
				if(u.canHypostase)
					profile.extra = { hypostase : HypostasisBtns }
				log.dbg("Logged IN :" + u.login)

				ok(token, profile)
			}
		})
	} else {
		log.dbg("missing user or password", user, password)
		return res.status(401).send("les données de connexions n'ont pas été émises correctement")
	}
}


exports.reqlogin = function (req, res) {
	return login(req.body.username, req.body.password, res,
		function (token, profile) {
			res.status(200).json({
				token: token, uid: profile.uid,
				nom: profile.nom, prenom: profile.prenom,
				indicator: profile.indicator, panel: profile.panel, extra: profile.extra
			})
		})
}

exports.hello = function (req, res) {
	if (req.user) {
		log.dbgAr(req.user)
		log.dbg(req.user.nom, req.user.uid, "logged in")
		res.status(200).send('HI');
	}
	else {
		traceRequest(req)
		//log.dbg("anonymous user") // sign the token and return anonymous
		res.status(200).send('');
	}
}
