/**
 * Dialoguea
 * acl.js
 *
 * copyright 2014-2017 Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Dual licensed under the MIT and AGPL licenses.
 *
 * access control layer
 */

var DB = require('../db')
import log from '../log'
import {kdecodeb64} from '../sxor'

/*
exports.isAdmin = function (user, yes, no) {
	if (!user || !user.uid) {
		log.warn("admin privileges asked when no uid or user", user);
		return no();
	}
	else {
		DB.User.findOne({_id: user.uid}, function (e, u) {
			if (u && u.level > 499) {
				yes(u)
			} else {
				no(e)
			}
		})
	}
}*/


export function isAdmin(user, yes, no) {
	if (!user || !user.uid) {
		log.warn("Admin privileges asked when no uid or user", user);
		return no();
	}
	else {
		log.debug('getting user')
		getUser(user.uid,
				u => u && u.level > 499 ?
				yes(u) : no(e)
		)
	}
}

function UNAUTHORIZED(res){
	res.status(400).send('UNAUTHORIZED')
}


export function getUser(duid, oknext, konext) {
	//var duid = kdecodeb64(bkuid).toString()

	DB.User.findOne({_id:duid},
		(e,u)=> {
			if (e) { log.error(e); konext(e) }
			else { /*log.dbg(u);*/ oknext(u) }
		}
	)
}
