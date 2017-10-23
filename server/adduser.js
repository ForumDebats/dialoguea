/**
 * Dialoguea
 * userlisting.js
 *
 * copyright 2014-2016 Forum des débats
 *
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
 * Released under the AGPL license
 *
 *
 * add a new admin (level 600)
 * admins are not subscribed to any group
 */

import settings from '../settings'
let mongoose = require('mongoose')
    , prompt = require('prompt')
    , User = require("./db.js").User
    , Debat = require("./db.js").Debat
    , Categorie = require("./db.js").Categorie
    , _ = require("underscore")
    , log = require('./log')
    , reEmailValidator = require('./utils').validateEmail
    , fs = require('fs')
    , genpwd = require('./genpasswd')
    , mailer = require('./mailer.js')


process.on('uncaughtException', function (err) {
    log.error(err.stack)
    process.exit(1)
})

//mongoose.set('debug', settings.DEBUG);
mongoose.connection.on('error', function () {
    console.log('Mongoose connection error', arguments);
});

mongoose.connect(settings.MONGO + settings.DB)

prompt.message = "";
//prompt.delimiter = "";
var validator = {
    validator: /^[a-zA-Z0-9_\s\-\.]+$/,
    warning: 'lettres, nombres, espaces, tirets, points'
}
// dup with utils.js
var emailvalidator = {
    validator: reEmailValidator,
    warning: 'not a valid email'
}

var properties = [
    {
        name: 'login',
        message: 'login',
        validator: validator.validator,
        warning: validator.warning
    }, {
        name: 'password',
        message: 'password',
        hidden: true
    }, {
        name: 'nom',
        message: 'nom',
        validator: validator.validator,
        warning: validator.warning
    }, {
        name: 'prenom',
        message: 'prenom',
        validator: validator.validator,
        warning: validator.warning
    },
    {
        name: 'email',
        message: 'email',
        validator: emailvalidator.validator,
        warning: emailvalidator.warning
    }
];

function onErr(err) {
    console.log(err);
    return 1;
}

var nusers = [
    {
        name: 'uniqueuser_or_list',
        message: 'Ajouter un utilisateur unique [y]yes (ou une liste, choix suivant) ?'
    }]

var userlist = [
    {
        name: 'fichier :',
        message: 'fichier liste ?'
    }]


let start = function () {

    prompt.start();

    console.log('Ctrl-c pour sortir')
    prompt.get(nusers, (err, input) => {
        if (input.uniqueuser_or_list == 'y') {
            add1user()
        }
        else {
            prompt.get(userlist, (err, input) => {adduserlist(input.file)})
        }
    })

    function adduser(input, callback) {
        var user = new User({
            ...input,
            /*nom: input.nom,
             prenom: input.prenom,
             login: input.login,
             email: input.email,
             password: input.password,*/
            level: 600,
            activation: 1,
            status: 1
        });

        user.save(function (err) {
            if (err) {
                log.dbg(err);
            } else {
                log.dbg(user);
                if (callback)
                    callback(user)
            }
        })
    }


    function add1user(callback) {
        prompt.get(properties, (err, input)=>{
            if (err) {
                return onErr(err);
            }
            adduser(input)
        });
    }


    function adduserlist(file) {
        fs.readFile(file, {encoding: 'utf-8'}, function (err, data) {
            if (err) throw err;
            console.log(data, typeof(data))
            data = data.trim().split('\n')
            for (i in data) {
                console.log(i, data[i])
                user = data[i].trim().split(';')
                input = {
                    nom: user[0],
                    prenom: user[1],
                    login: user[2],
                    email: user[2],
                    password: genpwd(8),
                    level: 500,
                    activation: 1,
                    status: 1,
                }
                adduser(input, sendPassTouser)
            }
        });

    }

    function sendPassTouser(user) {

        mailtext = mailer.sendPassToUser(user);
        mail = mailer.SENDPASSWORDMAIL
        mail.to = user.email
        mail.text = mailtext.text
        mail.html = mailtext.html

        console.log(mail)
        return mailer.send(mail, function (e) {
            if (e) console.log('problème à l\'envoi du mail')
        })
    }
}() // do it



