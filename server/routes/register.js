/**
 * Dialoguea
 * register.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
 * Dual licensed under the MIT and AGPL licenses.
 *
 *
 * Les comptes crées par ce module ne sont pas activés par défauts.
 *
 */

var log = require('../log')
		, DB = require('../db')
		, mailer = require('../mailer')
		, utils = require('../utils')
		, crypto = require("crypto")
		, app = require("../route")


exports.routes = function (app) {

	app.get('/register', function (req, res) {
		res.render('nouveau');
	});

	app.post('/newaccount', function (req, res) {
		var user = {prenom: req.body.prenom, nom: req.body.nom, email: req.body.email, password: req.body.password}
		log.dbg("NEW ACCOUNT REGISTRATION:", user)

		var goodpassword = 1;
		if (user.password && user.password.length > 7) {
			// relax max
			/*var _l, _len, s = true;
			 for (_l = 0, _len = PASSWORD_FORMATS.length; _l < _len; _l++) {
			 //log.dbg("pass format checked", PASSWORD_FORMATS[_l])
			 goodpassword = goodpassword & PASSWORD_FORMATS[_l].test(user.password)
			 if (!goodpassword) {
			 log.warn('password validation failed')
			 return res.status(401).json('Erreur de validation du mot de passe')
			 }
			 }*/
		} else {
			return res.status(401).json('Erreur de validation du mot de passe')
		}
		if (goodpassword && user.prenom && user.prenom.length > 2 && user.email && utils.validateEmail(user.email)) {
			DB.User.findOne({login: user.email}, function (e, u) {
				//log.dbg(e,u)
				if (e) {
					log.warn("new account validation failed")
					return res.status(401).json('Une erreur est survenue à l\'enregistrement du compte')
				}
				else if (u) {
					log.dbg(user.email, "already registred", u)
					res.status(401).json("L'addresse email " + user.email
							+ " est déjà associée à un compte dialoguea");
				} else {
					var md5 = crypto.createHash('md5').update(user.email + Math.random()).digest("hex");
					var newUsr = new DB.User(
							{
								login: user.email,
								prenom: user.prenom,
								nom: user.nom,
								password: user.password,
								email: user.email,
								activation: md5,
								status: 0 // not activated yet
							})
					log.debug("new user", user)

					log.info("new activation code :", md5)

					var confirmMail = mailer.activationMail(md5)
					var mail = mailer.WELCOMEMAIL;
					mail.to = user.email
					mail.html = confirmMail.html
					mail.text = confirmMail.text;
					log.dbg("to:", user.email, confirmMail.text)
					return mailer.send(mail, function (e) {
						if (e) return res.status(401).json('Un problème est survenu à l\'enregistrement du compte')
						else {
							newUsr.save()
							res.status(200).json("OK");
						}
					})
					//console.log(md5(user.email+Math.random()))
				}
			})
		} else {
			return res.status(401).json('Problème à l\'enregistrement du compte')
		}
	})

	app.post('/activer',
		function (req, res) {
			log.dbg("ACCOUNT ACTIVATION", req.body.id)
			DB.User.findOne({activation: req.body.id}, function (e, u) {
				if (u) {
					if (u.activation == 1) {
						log.warn('compte déjà activé')
						//return res.redirect('error.html?e=1')
						return res.status(401).send("alreadyactivated")
					}
					else {
						var _l, _len;
						for (_l = 0, _len = DB.GPublic.membres.length; _l < _len; _l++) {
							if (DB.GPublic.membres[_l] == u._id) {
								log.warn(u._id, "Already stored in this group!")
								return;
							}
						}
					}
					DB.GPublic.membres.push(u._id)
					log.dbg(DB.GPublic)
					DB.GPublic.save(function (e) {
						if (e) { log.dbg(e) }
						else log.dbg("Group ", DB.GPublic._id, "updated with ", u._id)
					})

					u.status = 1;
					u.activation = 1;
					u.gid= DB.GPublic._id;

					u.save(function (e) {
						if (e) {
							log.dbg(e);
							return res.status(401).send("Error")
						}
						else {
							return app.login(u.login, u.password, res,
									function (token, profile) {
										res.status(200).json({
											token: token, uid: profile.uid,
											nom: profile.nom, prenom: profile.prenom, status: profile.status,
											indicator: profile.indicator
										})
									})
						}
					})
					//res.redirect('/?active=1')
					// TODO : return login(..)
				}
				else {
					log.warn('invalid activation code')
					return res.status(401).send('invalid-token')
				}
			});
		}
	);

// TODO: attempts and lock
	app.post('/requestnewp', function (req, res) {

		var email = req.body.email
		log.dbg('reinit mdp asked for : ' + email)
		if (email && utils.validateEmail(email)) {
			DB.User.findOne({login: email}, function (e, u) {
				if (u) {
					var md5 = crypto.createHash('md5').update(email + Math.random()).digest("hex");
					var resetMail = mailer.resetMdpMail(md5)
					var mail = mailer.RESETPASSMAIL;
					mail.to = email
					mail.html = resetMail.html
					mail.text = resetMail.text;
					log.dbg("to:", email, resetMail.text)
					return mailer.send(mail, function (e) {
						if (e) {
							return res.status(401).json(-10) //'Un problème est survenu à l\'envoi du message')
						}
						else {
							u.activation = md5;
							u.save();
							res.status(200).json(1);
							//"Les instructions pour réinitialiser le mot de passe vous ont été envoyées.";
						}
					})
				}
				else {
					log.warn('no account associated with ' + email)
					res.status(404).json(-1) //json("Aucun compte Dialoguea n'est enregistré avec cet email");
				}
			})
		} else {
			log.warn('invalid email received: [', email, ']')
		}
	})

	/* ensure the activation key was valid */
// todo : attempt / ip, restrict
	app.post('/reinitmdpcheck', function (req, res) {
		var key = req.body.key
		if (key && key.length == 32) {
			DB.User.findOne({activation: key}, function (e, u) {
				if (u) {
					log.warn("new mp  request for key:", key)
					res.status(200).json();
				}
				else {
					log.warn("invalid activation key", req.query.id)
					res.status(401).json("invalid_token")
					//res.redirect('/activer?id=4')
				}
			})
		} else {
			log.warn("invalid activation key", key)
			res.status(401).json("invalid_token")
		}
	})

	app.post('/newmdp', function (req, res) {
		var password = req.body.newmp
		var id = req.body.id
		log.dbg("reinit mdp:", id)
		// duplicate code. Todo : to function
		var goodpassword = 1;
		if (password && password.length > 7) {
			/*var _l, _len, s = true;
			 for (_l = 0, _len = PASSWORD_FORMATS.length; _l < _len; _l++) {
			 goodpassword = goodpassword & PASSWORD_FORMATS[_l].test(password)
			 if (!goodpassword) {
			 log.warn('password validation failed')
			 return res.status(401).json('Erreur de validation du mot de passe')
			 }
			 }*/
		} else {
			log.dbg("pass validation failed")
			return res.status(401).json('Erreur de validation du mot de passe')
		}

		if (goodpassword && id) {
			DB.User.findOne({activation: id}, function (e, u) {
				if (e) {
					log.error("new account validation failed")
					// TODO : I18n or return codes
					return res.status(401).json(-2)
				}
				else if (u) {
					// TODO : hash only
					u.password = password;
					u.activation = 2; // 2=retrieval occured
					u.save(function (e) {
						if (e) {
							log.dbg(e, "saving failed!");
							return res.status(401).send("Error")
						}
						else {
							log.dbg("login ok");
							app.login(u.login, u.password, res,
									function (token, profile) {
										res.status(200).json({
											token: token, uid: profile.uid,
											nom: profile.nom, prenom: profile.prenom, status: profile.status,
											indicator: profile.indicator
										})
									})
						}
					})
				} else {
					log.error("Activation key [", id, "] not found. not supposed to happen.")
					return res.status(401).json(-1);
				}
			})
		} else {
			return res.status(401).json('Erreur à l\'enregistrement')
		}
	})

}