/**
 * Dialoguea
 * server.js
 *
 * copyright 2014-2017 Intactilespeakers design, Forum des débats
 * author : Philippe Estival -- phil.estival@free.fr
 * Released under the AGLv2 license
 *
 * express server
 *
 */


import log from './log'
import settings from '../settings'
import express from 'express'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import pack from '../package.json'
import db from './db'
import route from './route'
import cront from './cron'

var messaging = require('./messaging')

log.info("" + pack.name+ " v" + pack.version + " starts (pid:"+process.pid+") █");

process.on('uncaughtException', function (err) {
	console.log('oups')
	log.error(err.stack)
	process.exit(1)
})

/*
 var allowCrossDomain = function(req, res, next) {
 res.header('Access-Control-Allow-Origin', 'dialoguea.fr');
 res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
 res.header('Access-Control-Allow-Headers', 'Content-Type');
 next();
 }
 //var cors=require('cors')({credentials:true,origin: ''})
 */

let app = express()
	.use(bodyParser.json())
	.use(express.static(__dirname + '/../public'))
	.set('port',settings.PORT)
//.use(cors)
//.options('*', cors); // include before other routes

var server = require('http').createServer(app);

require('./route')(app);
require('./routes/register').routes(app)

mongoose.connect(settings.MONGO + settings.DB)
mongoose.connection.once('open',() => log.dbg("Database [",settings.DB,"] up and ready"))
mongoose.connection.on('error',  e => log.error('Mongoose connection error',e))

app.set('view engine', 'html')
app.set('views', './views')
app.set('view cache', true)

server.listen(app.get('port'))
//messaging.listen(server)
log.info("http://"+settings.SERVER)




