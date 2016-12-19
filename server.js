/**
 * Dialoguea
 * server.js
 *
 * copyright 2014-2017 Intactilespeakers design, Forum des débats
 * author : Philippe Estival -- phil.estival@free.fr
 * Released under the GPLv2 license
 *
 * express server
 *
 */

var log = require('./server/log');

process.on('uncaughtException', function (err) {
	log.error(err.stack)
	process.exit(1)
})
log.info("------- DIALOGUEA starts (PID:" + process.pid + ") -------");

express = require('express');
require('./server/db.js');
require('./server/cron.js');

var bodyparser = require('body-parser');
messaging = require('./server/messaging');
settings = require('./settings').configuration;

/*
var allowCrossDomain = function(req, res, next) {
	res.header('Access-Control-Allow-Origin', 'dialoguea.fr');
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	res.header('Access-Control-Allow-Headers', 'Content-Type');
	next();
}
//var cors=require('cors')({credentials:true,origin: ''})
*/

app = express()
	.use(bodyparser.json({limit: '12mb'}))
	.use(express.static(__dirname + '/public'));
	//.use(cors)
	//.options('*', cors); // include before other routes
//app.use(cors)

app.set('port', settings.PORT)
var server = require('http').createServer(app)
require('./server/route')(app)
require('./server/routes/register').routes(app)

mongoose = require('mongoose')
mongoose.connect(settings.MONGO + settings.DB)
mongoose.connection.on('error', function (e) {log.dbg('Mongoose connection error',e);});
mongoose.connection.once('open', function callback() {log.dbg("DB",settings.DB,"ready");});
// only use to serve content outside of the public static route
// not as render engine
swig = require('swig');
swig.setDefaults({
	//cache: false,
	varControls: ['[[', ']]']
})

// Views and template
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', './server/views');
app.set('view cache', false);

messaging.listen(server)

log.info("http://"+settings.SERVER+":"+settings.PORT);
log.dbg('started')

