/**
 * Dialoguea
 * genpasswd.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * author : Philippe Estival -- phil.estival @ free.fr
 * Dual licensed under the MIT and AGPL licenses.
 *
 * generate a random password
 *
 */

module.exports = function(length, special) {
	var iteration = 0;
	var psw = "";
	var randomNumber;
	if (special == undefined) {
		special = false;
	}
	while (iteration < length) {
		randomNumber = (Math.floor((Math.random() * 100)) % 94) + 33;
		if (!special) {
			if ((randomNumber >= 33) && (randomNumber <= 47)) continue;
			if ((randomNumber >= 58) && (randomNumber <= 64)) continue;
			if ((randomNumber >= 91) && (randomNumber <= 96)) continue;
			if ((randomNumber >= 123) && (randomNumber <= 126)) continue;
		}
		iteration++;
		psw += String.fromCharCode(randomNumber);
	}

	return psw;
}