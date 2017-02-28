/**
 * Dialoguea
 * userlisting.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
 * Released under the AGPL license
 *
 *
 * impott a user list
 *
 */

var DB = require('../db')
	, isAdmin = require('./acl').isAdmin
	, log = require('../log')
	, genpw = require('../genpasswd')

// nom prenom login password groupe
module.exports = function (req, res) {
	isAdmin(req.user, function () {
			var u, users = [],
				msg = '',
				userlist = req.body.userlist,
				gid = req.body.gid;

			//log.dbg(req.body.gid)
			if (userlist.length == 0) {
				return res.status(401).send('la liste est vide')
			}

			for (var i in userlist) {
				u = userlist[i]
				if(u[0].trim!='' && u[1].trim!='')
					users.push({
						nom: u[0],
						prenom: u[1],
						login: u[2] ? u[2] : u[1][0] +'.'+[0],
						password: u[3] || genpw(8),
						gid: gid, //gname actually. this is ovewritten by gid below
						email: u[4]
					})
				//grps.push(u[4])
			}

			DB.Group.findOne({_id:gid}, function (e, g) {
				if(e) log.dbg(e)
				else {
					//log.dbg(g)
					gid = g._id;
					checkExistingUsers()
				}
			})


			var checkExistingUsers = function () {
				var already = []
				var existing = false
				var checked = 0
				for (var i = 0, _l = users.length; i < _l; i++) {
					DB.findUser({login: users[i].login}, function (u) {
						checked++
						if (u) {
							existing = true
							already.push(u.login)
						}
						if (checked == users.length) {
							if (existing) {
								log.dbg("existing users",already);
								already.sort()
								var existingUsers = ""
								for(var x in already) {
									existingUsers  += already[x] +" "
								}
								return res.status(400).send("La liste n'a pas importée. Les identfiants suivants existent déjà : " + existingUsers)

							}
							else {
								createUsers()
							}
						}
					})
				}
			}

			var createUsers = function() {
				var usaved = 0;
				var Error = false
				for (var i = 0, _l = users.length; i < _l; i++) {
					var newUsr = new DB.User(users[i])
					log.dbg("new user", users[i])

					newUsr.save(function (err, u) {
						usaved++;
						if (err) {
							Error = true;
							err = err.toString()
							log.dbg(err)
							msg += err + " "
						}
						if (usaved == users.length) {
							if (Error) return res.status(400).send(msg )
							else return res.status(200).send(users.length + " utilisateurs crées")
						}
					})
				}
			}
		},

		function () {
			log.warn("unauth access to /api/newuserlist");
			return res.status(401).send('unauthorized');
		})
}
