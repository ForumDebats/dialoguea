/**
 * Dialoguea
 * invitation.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
 * Dual licensed under the MIT and AGPL licenses.
 *
 * invitation/mailer
 */

var mailer = require('../mailer'),
	DB = require('../db'),
	settings = require('../../settings'),
	log = require('../log'),
	utils = require('../utils')

module.exports = function (req, res) {
	DB.findUserById(req.user.uid, u =>{
		if(u) {
			log.dbg("invitation à ", req.body.inviteEmail, "de:", u.prenom, " debat:", req.body.auteur, req.body.titre)
			if (utils.validateEmail(req.body.inviteEmail) && u.prenom && req.body.auteur && req.body.titre) {
				var inviteMail = mailer.invitationMail(req.body.debat, u.prenom, req.body.auteur, req.body.titre)
				var mail = mailer.INVITATION;
				mail.from = settings.MAILER;
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
