/**
 * Dialoguea
 * acl.js
 *
 * copyright 2014-2017 Intactile design, Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Dual licensed under the MIT and GPLv3 licenses.
 *
 * access control layer
 */

var DB = require('../db')

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
}
