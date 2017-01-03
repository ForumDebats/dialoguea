/**
 * Dialoguea
 * log.js
 *
 * copyright 2014-2017 Intactile design, Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Dual licensed under the MIT and GPLv3 licenses.
 *
 * logging utility
 */

var   callsite = require('callsite')
	, loadmodule = require('./loadmodule').loadmodule
	, winston = require(loadmodule('winston'))
	, settings = require('../settings').configuration

winston.emitErrs = true;
var logger = new winston.Logger({
    transports: [
	new winston.transports.File({
	    level: 'debug',
	    filename: settings.LOG_FILE,
	    handleExceptions: true,
	    json: false,
	    maxsize: 5242880, //5MB
	    maxFiles: 5,
	    colorize: false,
		timestamp:function() {
			var D = new Date();
			return (D.getFullYear()+"-"+(D.getMonth()+1)+"-"+ D.getDate() + " " + +D.getHours() + ":" + D.getMinutes() + ":" + D.getSeconds())
		}
	}),
	new winston.transports.Console({
	    level: 'debug',
	    handleExceptions: false,
	    json: false,
	    colorize: true
	})
    ],
    exitOnError: false
});


logger.dbg =
function dbg(){
    var msg = '';

    for (var i = 0, L=arguments.length; i<L; i++) {
		/*console.log(arguments[i],typeof (arguments[i]))
		if(typeof (arguments[i]) == 'object' && arguments[i]!=null) {
			var obj=arguments[i]
			msg+='{'
			for(var key in obj){
				var attrName = key;
				var attrValue = obj[key];
				console.log(typeof( key))
				msg += attrName +':'+attrValue + ',';
			}
			msg+='} '
		}
		else*/
			msg += arguments[i] + ' ';
	}

    var stack = callsite(),
		site=stack[1],
		caller = stack[1].getFileName(),
		//functionName = + site.getFunctionName() || 'anonymous',
		lineNumber = site.getLineNumber();

    caller = new String(caller).substring(caller.lastIndexOf('/') + 1);
   /* if(caller.lastIndexOf(".") != -1)
        caller = caller.substring(0, caller.lastIndexOf(".")).toUpperCase();*/
    this.debug("["+caller+':' +lineNumber +']', msg);
	/*function logAr(ar){
		var L=ar.length;
		for (var i = 0; i < L; i++)
			console.log(ar[i]);
	}*/
}


logger.dbgAr =
    function dbgAr(){
        var msg = '';
        for (var i = 0, L = arguments.length; i < L; i++) {
            //console.log(arguments[i])
            if (typeof (arguments[i]) == 'object' && arguments[i] != null) {
                var obj = arguments[i]
                msg += '{'
                for (var key in obj) {
                    var attrName = key;
                    var attrValue = obj[key];
                    //console.log(typeof( key))
                    msg += attrName + ':' + attrValue + ',';
                }
                msg += '} '
            }
            else
                msg += arguments[i] + ' ';
        }

        var stack = callsite(),
            site=stack[1],
            caller = stack[1].getFileName(),
            lineNumber = site.getLineNumber();

        caller = new String(caller).substring(caller.lastIndexOf('/') + 1);
        this.debug("["+caller+':' +lineNumber +']', msg);
        /*function logAr(ar){
         var L=ar.length;
         for (var i = 0; i < L; i++)
         console.log(ar[i]);
         }*/
    }


module.exports = logger;
module.exports.stream = {
    write: function(message /*, encoding*/){
	logger.info(message);
    }
};
