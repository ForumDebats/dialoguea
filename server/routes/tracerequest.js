/**
 * Dialoguea
 * tracereques.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
 * Released under the AGPL license
 *
 *
 * log request
 *
 */

var log = require('../log')

export function getIp(req) {
	return req.header('x-forwarded-for') || req.connection.remoteAddress;
}

export function traceReq(req) {
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	/*var D = new Date();
	var d = (D.getMonth() + 1) + "-" + D.getDate() + " " + +D.getHours() + ":" + D.getMinutes() + ":" + D.getSeconds()
	*/
	log.dbg(
		/*ip, "user:", (req.user ? req.user.nom : 'anonymous'),
		req.headers['user-agent'],
		req.headers['referer'],*/
		req.method,
		req.url,req.params,req.query
		)

	// todo put this in profile or bugreport
}
