/**
 * Dialoguea
 * invitation.js
 *
 * copyright 2014-2017 Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Dual licensed under the MIT and AGPL licenses.
 *
 * invitation/mailer
 */

var mailer = require('../mailer'),
	DB = require('../db'),
	settings = require('../../settings')


module.exports = function (req, res) {
	log.dbg(req.user)
	DB.findUserById(req.user.uid, function (u) {
		if(u) {
			log.dbg("invitation à ", req.body.inviteEmail, "de:", u.prenom, " debat:", req.body.auteur, req.body.titre)
			if (utils.validateEmail(req.body.inviteEmail) && u.prenom && req.body.auteur && req.body.titre) {
				var inviteMail = mailer.invitationMail(req.body.debat, u.prenom, req.body.auteur, req.body.titre)
				var mail = mailer.INVITATION;
				mail.from = settings.configuration.MAILER;
				mail.to = req.body.inviteEmail;
				mail.html = inviteMail.html;
				mail.text = inviteMail.text;
				mailer.send(mail)
				return res.status(200).json("OK")
			}
			else return res.status(401).json("Un problème est survenu à l'envoi de l'invitation")
		}else{
			log.warn("INVITATION REQUEST BUT USER NOT FOUND!")
		}
	})
}