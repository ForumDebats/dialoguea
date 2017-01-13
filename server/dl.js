/**
 * Dialoguea
 * dl.js
 *
 * copyright 2014-2017 Intactile design, Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Dual licensed under the MIT and GPLv3 licenses.
 *
 *
 * download resources by url to the server
 * (such as images in categories)
 */

var http = require('http')
	, https = require('https')
	, settings = require('../settings').configuration
	, log = require('./log')
	, fs = require('fs')
	, crypto = require('crypto')

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

/*
var createFolders=function(){
	try{
		fs.mkdir(uploads, function(){});
	}
	catch(e){}
}()
*/

exports.dl = function(url,next,sizeCb, failed) {

	/*var options = {
	 host: host || "localhost",
	 port: port || 80,
	 path: path
	 };*/

	log.dbg('downloading',url)
	var size= 0,cur= 0,res_data;

	var protocol =
		url.indexOf('https')==0? https :
			url.indexOf('http')==0 ? http  :  null

	if (protocol===null) return;

	var req = protocol.get(url, function (res) {
		log.dbg(res.headers)
		var content_type= res.headers['content-type'];
		console.log(content_type, content_type.indexOf('image/'))

		var size = res.headers['content-length'];
		if (size > settings.MAX_DLSIZE) {
			log.dbg("too big!")
			if(failed) return failed("le fichier est trop volumineux (>",settings.MAX_DLSIZE,") ",size)
		}

		/*var type = content_type.indexOf('image/');
		 if (! (content_type.indexOf('image/')===0) ) {
		 log.dbg("not an image",content_type)
		 return failed("type de fichier incorrect : " + content_type)
		 }*/
		var ext = "."+content_type.substring(6,content_type.length)
				filename = crypto.randomBytes(20).toString('hex')+ext,
				file = settings.ABS_UPLOAD_DIR+filename
				f=fs.createWriteStream(file);

		// handle the response
		if(sizeCb) sizeCb(0,size)

		res.on('data', function (chunk) {
			//res_data += chunk;
			f.write(chunk)
			cur += chunk.length;
			if(sizeCb) sizeCb(cur,size)

		});
		res.on('end', function () {
			if(sizeCb) sizeCb(size,size)
			log.dbg("saving", file, size)
			f.end()
			if(next) { next(res_data,filename) }
		});
	});

	req.on('error', function (err) {
		if(sizeCb) sizeCb(0,size)
		console.log("Request error: " + err.message);
		if(failed) return failed("erreur dans la requête")
	});

	/* short version
	 http.get(imgSource, function(res) {
	 res.pipe(fs.createWriteStream('wiki.jpg'));
	 });*/

};