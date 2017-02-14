/**
 * Dialoguea
 * login.js
 *
 * copyright 2014-2017 Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Dual licensed under the MIT and AGPL licenses.
 *
 * login process
 */
	
var DB = require('../db')
	, log = require('../log')
	, jwtoken = require('jsonwebtoken')
	, traceRequest = require('./tracerequest')
	, publicKey = require('../key').pub

import {kencode} from '../sxor'

/** à déplacer */
var AdminMenu = "\
<ul id='adminmenunav' class='nav nav-pills admin-nav'>\
<li id='opendebat'><a href='#/opendebat' onClick=\"selectMenu('opendebat')\"> Ouvrir un débat</a></li>\
<li id='groups'><a href='#/groupes' onClick=\"selectMenu('groups')\"> Groupes</a></li>\
<li id='documents'><a href='#/categories' onClick=\"selectMenu('documents')\"> Documents</a></li>\
<li id='debats'><a href='#/admdebats' onClick=\"selectMenu('debats')\"> Débats</a></li></ul>"

var HypostasisBtns = "<div class='HypostaseBtns'><div id='hypostaseBtn' class='button-content'>Hypostase</div></div>"


export function login(user, password, res, ok) {
	if ((user && password )) {
		// TODO : maintain the tokens/hash/user connected DB

		DB.login(user, password, (u,e) => {
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

				//var uids=u._id.toString()
				//let uib=kencode(uids).toString('base64')

				var profile = {
					nom: u.nom,
					prenom: u.prenom,
					gids: u.gids, // must enforce access to /u/id
					uid:  u._id  // send a hash + housemade hash
				}

				var token = jwtoken.sign(profile, publicKey /*, {expiresInMinutes: 60 * 24 * 31}*/);

				if (u.level > 499) {
					log.dbg("admin login")
					profile.indicator = "api/adm.js"
					profile.panel = AdminMenu
				}

				log.dbg("Logged IN :" + u.login)

				ok(token, profile)
			}
		})
	} else {
		log.dbg("missing user or password", user, password)
		return res.status(401).send("les données de connexions n'ont pas été émises correctement")
	}
}

export function reqlogin  (req, res) {
	return login(req.body.username, req.body.password, res,
		(token, profile) => {
			res.status(200).json({
				token: token,
				uid: profile.uid,
				nom: profile.nom,
				prenom: profile.prenom,
				indicator: profile.indicator,
				panel: profile.panel,
				extra: profile.extra
			})
		})
}

export function hello (req, res) {
	if (req.user) {
		log.info(req.user.prenom,req.user.nom, "logged in")
		res.status(200).send('HI');
	}
	else {
		traceRequest(req)
		res.status(200).send('');
	}
}
