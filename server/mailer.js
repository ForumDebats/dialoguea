/**
 * Dialoguea
 * mailer.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
 * Released under the AGPL license
 *
 *
 * mails Dialoguea auto send
 */

import settings from "../settings";

var   log       = require('./log')
	, nodemailer = require('nodemailer')
	, wellknown  = require('nodemailer-wellknown') // https://github.com/andris9/nodemailer-wellknown
	, config     = wellknown(settings.MAILER.provider)
	, SERVER     = settings.PROTOCOL + settings.SERVER


var appli = settings.APP
var site = settings.SITE
var title = "DIALOGUEA"
var subtitle = " Forum des débats sur le bien commun"

var transporter = nodemailer.createTransport({
    service:settings.MAILER.provider,
	 auth:
	 {
      user: settings.MAILER.user,
      pass: settings.MAILER.pass
	 }
});

exports.send = function(mail,callback)
{
	transporter.sendMail({
		from: mail.from,
		to: mail.to,
		subject: mail.subject,
		text: mail.text,
		html: mail.html
	}, function(error, info){
		if(error){
			log.error(error,info);
			typeof callback === 'function' && callback(error)
		}else{
			log.info('Message sent: ',info,error);
			typeof callback === 'function' && callback()
		}
	})
}

exports.WELCOMEMAIL = {
	from: settings.MAILER.email,
	bcc:settings.MAILER.bcc,
	to: undefined,
	subject:"Débattez avec " + site,
	text: "Debattez avec " + site,
	html: "'<b>Bonjour, bienvenus sur " + appli + " ✔</b>"
}

exports.INVITATION = {
	from:settings.MAILER.email,
	to:undefined,
	bcc:settings.MAILER.bcc,
	subject:"Invitation à débattre sur " + site,
	text: "Invitation à débattre sur " + site,
	html: "'<b>Hello world ✔</b>"
}

exports.RESETPASSMAIL = {
	from:settings.MAILER.email,
	to:undefined,
	subject:"Réinitialisation du mot de passe " + appli,
	text: "",
	html: ""
}

exports.REPONSEMAIL = {
	from:settings.MAILER.email,
	to:undefined,
	subject:"Suite du débat sur " + appli,
	text: "",
	html: ""
}

exports.SENDPASSWORDMAIL = {
	from:"<forum-des-debats@dialoguea.fr>",
	to:undefined,
	subject:"Votre inscription a dialoguea a été validée",
	text: "",
	html: ""
}



var mailHeader = ""
+"<!DOCTYPE HTML PUBLIC ' -//W3C//DTD HTML 4.01 Frameset//FR' 'http://www.w3.org/TR/html4/frameset.dtd'>"
+"<html>"
+"   <head>"
+"      <meta http-equiv='Content-Type' content='text/html;'>"
+"      <meta name='viewport'content='width=device-width'>"
+"      <style>"
+"         body { margin:0px;font-family:Arial, Helvetica, sans-serif; min-width:300px;background-color:grey;}"
+"         .site-header { background-color: #3F4458; color:#FFF; padding: 20px; margin-bottom: 0px; display:table; width:100%;}"
+"         .site-title {  padding-left: 40px; margin: 0px 25px 0px 0px; display: table; float: left;}"
+"         h1 { display : inline; font-size:27px; font-weight:300;margin-right:10px;"
+"              font-family:'Trebuchet MS', Helvetica, sans-serif;font-weight:200;}"
+"         table{ background-color:white; width:100%; padding:20px;}"
+"      </style>"
+"   </head>"
+"   <body>"
+"      <header class='site-header'>"
+"         <h1 class='site-title'>DIALOGUEA</h1> Forum des débats sur le bien commun <br/><br/>"
+"      </header>"
+"      <table style='site-header'>"
+"         <tr>"
+"            <td align=3D'center'>"
+"            </td>"
+"         </tr>"
+"         <tr>"
+"            <td>"

var mailFooter="\
            </td>\
         </tr>\
      </table>\
   </body>\
</html>"

var mailFooterWithSite="\
            </td>\
         </tr>\
         <tr><td>\
        <a href='"+site+"'>"+site+"</a>\
         </tr></td>\
      </table>\
   </body>\
</html>"



exports.activationMail = function (id) {
	return {
		html: mailHeader + "Cliquez sur ce lien pour valider votre inscription à " + appli +".\
    <a href='"+SERVER+"#/activation/"+id+"'>"+SERVER+"#/activation/"+id+"</a>\
    <br/><br/></td></tr></table></body></html>",

		text: site
		+ "\n------------ \n\n"
		+ "Copiez ce lien dans votre navigateur pour valider votre inscription à " + appli +".\n"
		+ SERVER+"#/activation/" + id + '\n'
		+ "Vous pouvez ouvrir ou rejoindre un nouveau débat et y inviter des participants."
	}
}

exports.invitationMail = function (id,prenom,auteur,titre) {
	return {
		html: mailHeader
		+ "<b>"+ prenom + "</b> vous invite à rejoindre un débat sur " + site
		+ "<H3>" + auteur + ", <b><i>" + titre +"</i></b></H3></td></tr><tr><td>"
		+ "<a href='"+SERVER+"#/debat/"+id+"'>"+SERVER+"#/debat/"+id+"</a>"
		+ "</td></tr></table></body></html>",

		text: site
		+"\n"
		+ "------------ \n\n"
		+ prenom + " vous invite à rejoindre un débat sur "+ site +"\n"
		+ titre + "\n"
		+ SERVER+"#/debat/"+id
	}
}

exports.resetMdpMail = function (id) {
	return {
		html: mailHeader
		+"<br/>Cliquez sur ce lien pour réinitialiser votre mot de passe " + title
		+"<br/><a href='"+SERVER+"#/reinit-mdp/"+id+"'>"+SERVER+"#/reinit-mdp/id="+id+"</a>\
        </td></tr></table></body></html>",

		text: title
		+ "\n------------ \n\n"
		+ "Cliquez sur ce lien pour réinitialiser votre mot de passe " + title
		+"\n" + SERVER+"#/reinit-mdp?phase=3&id="+id+"\n"
	}
}

// TODO
exports.RelanceDebatMail = function (debid,cmtid,who, citation, argument) {
	return {
		html: mailHeader
		+"<br/>"+who+" a répondu à votre argument : <br/>"
		+"<I>"+citation+"</I><br>"+
		+argument+"</br>"+
		+"Cliquer sur ce lien pour aller au débat:"+
		+"<a href='"+SERVER+"#/"+debid+"/"+cmtid+"></a>"
		+"</td></tr></table></body></html>",

		text: "Dialoguea.fr\n"
		+ "------------ \n\n"
		+ ".\n"
		+"\n"
	}
}

// inscription explicite
exports.sendPassToUser = function (user) {
	return {
		html: mailHeader
           +"<br/>" + user.prenom+ ", votre inscription à <a href='"+site+"'>"+appli+"</a> est validée<br/>"
           + " Votre identfiant : " + user.login + "<br/>"
           + " mot de passe : " + user.password + "<br/>"
           + mailFooterWithSite
           ,

		text: title
		+ "\n------------ \n\n"
           + user.prenom+ ", votre inscription a "+appli+"est validée \n"
           + " Votre identfiant : " + user.login + "\n"
           + " mot de passe : " + user.password+"\n"
           + "\n"+site
   }
}
