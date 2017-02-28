/**
 * Dialoguea
 * login.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
 * Released under the AGPL license
 *
 * login process
 */

var DB = require('../db')
	, log = require('../log')
	, jwtoken = require('jsonwebtoken')
	, getIp = require('./tracerequest').getIp
	, publicKey = require('../key').pub
	, ACL = require('./acl')

import {kencode} from '../sxor'

/** à déplacer */
var AdminMenu = "\
<ul id='adminmenunav' class='nav nav-pills admin-nav'>\
<li id='opendebat'><a href='#/opendebat' onClick=\"selectMenu('opendebat')\">Ouvrir un débat</a></li>\
<li id='groups'><a href='#/groupes' onClick=\"selectMenu('groups')\">Groupes</a></li>\
<li id='documents'><a href='#/categories' onClick=\"selectMenu('documents')\">Documents</a></li>\
<li id='debats'><a href='#/admdebats' onClick=\"selectMenu('debats')\">Débats</a></li></ul>"

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
            if(u.status==-1) {
               log.dbg("banned user", u.login)
				   return res.status(401).send('Échec de connexion : nom d’utilisateur ou mot de passe incorrect');
				}
			else
            if(u.status==0) {
					return res.status(401).send('Vous devez d\'abord activer votre compte. ' +
						'Un email vous a été envoyé sur votre messagerie lors de votre inscription.');
				}

				let uid=u._id.toString()
				//let uib=kencode(uids).toString('base64')
				var profile = {
					nom: u.nom,
					prenom: u.prenom,
					gids: u.gids, // must enforce access to /u/id
					uid:  uid  // send a hash + housemade hash
				}

				var token = jwtoken.sign(profile, publicKey, {expiresIn: 24*2*60*60});

				if (u.level > 499) {
					log.dbg("admin login", u.login)
					profile.indicator = "api/adm.js"
					profile.panel = AdminMenu
				}
				if (u.canHypostase) {
					profile.extra = HypostasisBtns
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
	log.dbg(getIp(req),req.user || 'anonymous', 'hello')

	if(req.user) {
		ACL.getUser(req.user.uid,
	            (u)=> {
	            	if(u.status!=-1) {
	            		log.info(req.Ip,u.login, "logged in")
						res.status(200).send('HI') // generate a key here
					}
	            },
				()=>{
					log.dbg(getIp(req), 'anon but token')
					res.status(401).send()
				})
	}
	else {
		log.dbg(getIp(req), 'anon')
		res.status(401).send();
	}
	/*
	if (req.user) {
		log.info(req.user.prenom,req.user.nom, "logged in")
		res.status(200).send('HI');
	}
	else {
		traceRequest(req)
		res.status(400).send('');
	}*/
}
