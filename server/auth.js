/**
 * Dialoguea
 * auth.js
 *
 * copyright 2014-2017 Intactile design, Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Dual licensed under the MIT and GPLv3 licenses.
 *
 *
 * TODO: next layer of authentication
 */

(function (exports) {

	var userRoles = {
		public: 0x1,
		user: 0x2,
		leader: 0x4,
		admin: 0x8
	};

	exports.userRoles = userRoles;
	exports.accessLevels = {
		anon: userRoles.public,  // 001
		public: userRoles.public | // 111
		userRoles.user |
		userRoles.admin,

		user: userRoles.user |   // 110
		userRoles.admin,
		admin: userRoles.admin    // 100
	};

})(typeof exports === 'undefined' ? this['routingConfig'] = {} : exports);

var expressJwt = require('express-jwt');

app.use('/api', expressJwt({secret: "d037d958ba7937cab6caedd10863c7dddf788e9c"}));

module.exports = function (app) {
	app.get('/admin', function (req, res) {

	});


	app.post('/login', function (req, res) {
		//TODO validate req.body.username and req.body.password

		if (!(req.body.username === 'john' && req.body.password === 'foo')) {
			res.send(401, 'Wrong user or password');
			return;
		}
		var profile = {
			first_name: 'John',
			last_name: 'Doe',
			email: 'john@doe.com',
			id: 123
		};

		// We are sending the profile inside the token
		var token = jwt.sign(profile, secret, {expiresInMinutes: 60 * 5});

		res.json({token: token});
	});
};
