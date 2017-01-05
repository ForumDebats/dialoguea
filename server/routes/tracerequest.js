/**
 * Dialoguea
 * tracereques.js
 *
 * copyright 2014-2017 Intactile design, Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Dual licensed under the MIT and GPLv3 licenses.
 *
 *
 * log request
 *
 */

var log = require('../log')

module.exports = function(req) {
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	/*var D = new Date();
	var d = (D.getMonth() + 1) + "-" + D.getDate() + " " + +D.getHours() + ":" + D.getMinutes() + ":" + D.getSeconds()
	*/
	log.dbgAr(ip, "user:", (req.user ? req.user.nom : 'anonymous'), req.headers['user-agent'], req.headers['referer'],
		req.method, req.url,req.params,req.query
		)

	// todo put this in profile or bugreport
}