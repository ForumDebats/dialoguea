/**
 * nemred-boilerplate
 *
 * db.js
 * phil.estival@free.fr
 * $Date$:2016/09/09 14:01:20 $
 *
 * logging utility not quite perfect
 */


import callsite from 'callsite'
import winston from 'winston'
//import { configuration as settings } from '../settings'
import settings from '../settings'
import path from 'path'

var shortMonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function isEmpty(obj) {
	for (var prop in obj) {
		if (obj.hasOwnProperty(prop))
			return false;
	}

	return JSON.stringify(obj) === JSON.stringify({});
}

winston.emitErrs = true;
var logger = new winston.Logger({
	transports: [
		new winston.transports.File({
			level: settings.DEBUG ? 'debug':'info',
			filename: settings.LOG_FILE,
			handleExceptions: true,
			json: false,
			maxsize: 5242880, //5MB
			maxFiles: 5,
			colorize: false,
			prettyPrint: true,
			timestamp: function () {
				var D = new Date();
				return (shortMonthNames[D.getMonth()]) + "  " + D.getDate() + " " + +D.getHours() + ":" + D.getMinutes() + ":" + D.getSeconds()
			}
		}),
		new winston.transports.Console({
			level: settings.DEBUG ? 'debug':'info',
			handleExceptions: true,
			humanReadableUnhandledException: true,
			json: false,
			colorize: true
			//prettyPrint:true //function ( object ){ return JSON.stringify(object); }
		})
	],
	rewriters  : [
		function (level, msg, meta) {
			return meta && !isEmpty(meta) ? JSON.stringify(meta, null,2) : meta;
			//return meta ? JSON.stringify(meta) : meta;
		}
	],
	exitOnError: false
});

/*
 winston.handleExceptions(
 new winston.transports.Console({
 colorize:true,
 json:true
 })
 )*/



// add callsite info to winston logger instance
function addCallSite(logger, levels) {
	// WARNING: traceCaller is slow
	// http://stackoverflow.com/a/20431861/665507
	/**
	 * examines the call stack and returns a string indicating
	 * the file and line number of the n'th previous ancestor call.
	 * this works in chrome, and should work in nodejs as well.
	 *
	 * @param n : int (default: n=1) - the number of calls to trace up the
	 *   stack from the current call.  `n=0` gives you your current file/line.
	 *  `n=1` gives the file/line that called you.
	 */
	function traceCaller(n) {
		if (isNaN(n) || n < 0) n = 1;
		n += 1;
		let s = (new Error()).stack
			, a = s.indexOf('\n', 5);
		while (n--) {
			a = s.indexOf('\n', a + 1);
			if (a < 0) {
				a = s.lastIndexOf('\n', s.length);
				break;
			}
		}
		let b = s.indexOf('\n', a + 1);
		if (b < 0) b = s.length;
		a = Math.max(s.lastIndexOf(' ', b), s.lastIndexOf('/', b));
		b = s.lastIndexOf(':', b);
		s = s.substring(a + 1, b);
		return '[' + s + ']';
	}

	for (var func in levels) {

		//oldFunc = logger[func]

		(function (oldFunc) {
			logger[func] = function () {

				/* // partial stack
				 let stack = callsite()[1]
				 console.log( ">>",
				 path.parse(stack.getFileName()).base
				 , stack.getLineNumber());

				 // full stack
				 callsite().forEach(function (site) {
				 console.log(
				 path.parse(site.getFileName()).base
				 , site.getLineNumber());
				 });*/

				var args = Array.prototype.slice.call(arguments);
				if (typeof args[0] === 'string') {
					args[0] = traceCaller(1) + ' ' + args[0];
				}
				else {
					args.unshift(traceCaller(1)); // level 2 b/c of log.dbg definition
				}
				oldFunc.apply(logger, args);
			};
		})(logger[func]);
	}
}

addCallSite(logger, {debug: 1})
addCallSite(logger, {error: 1})

logger.dbg = logger.debug
logger._silly = logger.silly // only for visibility outside package

logger.err = function err(x) {
	this.debug(JSON.stringify(x, null))
}


module.exports = logger;