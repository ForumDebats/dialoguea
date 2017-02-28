/**
 * Dialoguea
 * utils.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
 * Released under the AGPL license
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

let reEmailValidator = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

exports.validateEmail = function validateEmail(email) {
	return reEmailValidator.test(email);
}

exports.reEmailValidator = reEmailValidator

