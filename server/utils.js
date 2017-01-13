/**
 * Dialoguea
 * utils.js
 *
 * copyright 2014-2017 Intactile design, Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Dual licensed under the MIT and GPLv3 licenses.
 *
 */

var log = require('./log')

var urlValid = function (url) {
	var re=/^^http(s)?:\/\/([a-zA-Z0-9-]+.)?([a-zA-Z0-9-]+.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,4}(:[0-9]+)?\/([a-zA-Z0-9_\-#?/]*|\/[a-zA-Z0-9\-?_]+\.[a-zA-Z]{1,4})?$/
	//var re=/^^http(s)?:\/\/([a-zA-Z0-9-]+.)?([a-zA-Z0-9-]+.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,4}(:[0-9]+)?(\/[\w_]*\/?|\/[a-zA-Z0-9_]+\.[a-zA-Z]{1,4})?$/
	return re.test(url)
}

exports.urlValid = urlValid
exports.validUrlImg = function validUrlImg(url) {
	log.dbg(typeof(url))
	if (urlValid(url)
			&& (url.indexOf('.png')!=-1
			|| url.indexOf('.jpg')!=-1
			|| url.indexOf('.gif')!=-1
			|| url.indexOf('.svg')!=-1)) {
		return url
	}
	else {
		return false;
	}
}

exports.validateEmail = function validateEmail(email) {
	var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(email);
}

