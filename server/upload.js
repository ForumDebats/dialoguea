/**
 * Dialoguea
 * upload.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
 * Dual licensed under the MIT and AGPL licenses.
 *
 * upload handlers
 */

var
	settings = require('../settings')
	, uploadProgress = require('node-upload-progress')// todo : check file size
	, sharp = require('sharp')
	, log = require('./log')
	, fs = require('fs')
	, parseXlsx = require('excel')
	, mv = require('mv')
 	, fse = require('fs-extra');


// upload handler >
var uploadHandler = new uploadProgress.UploadHandler;
var uploadHandlerImg = new uploadProgress.UploadHandler;
var uploadHandlerXls = new uploadProgress.UploadHandler;
var uploadHandlerDbtImg = new uploadProgress.UploadHandler;
var uploadHandlerDebatMedia =  new uploadProgress.UploadHandler;

exports.uploadHandlerImg = uploadHandlerImg;
exports.uploadHandlerXls = uploadHandlerXls;
exports.uploadHandlerDbtImg = uploadHandlerDbtImg;

uploadHandlerImg.configure(function() { this.uploadDir = settings.ABS_UPLOAD_DIR });
uploadHandlerXls.configure(function() { this.uploadDir = settings.ABS_UPLOAD_DIR });
uploadHandlerDbtImg.configure(function() { this.uploadDir = settings.ABS_UPLOAD_DIR });
uploadHandlerDebatMedia.configure(function() { this.uploadDir = settings.ABS_UPLOAD_DIR });
uploadHandlerImg.formOnFile = function (upload, field, file) { receive(this,file) };
uploadHandlerDbtImg.formOnFile = function (upload, field, file) { receive(this,file) };
uploadHandlerXls.formOnFile = function(upload, field, file) { receive(this,file) };

function receive(handler,file) {
	log.dbg("file uploading :",
			" type:", file.type,
			" size:", file.size,
			" path:", file.path , handler)

	if(file.size > settings.MAX_DLSIZE) return false

	let t = file.path.split("/")
	let uid = t[t.length-1]
	handler.file = uid +"_"+file.name
	log.dbg("renaming", file.path,"->", settings.ABS_UPLOAD_DIR + handler.file)
	//fs.rename(file.path, settings.ABS_UPLOAD_DIR + handler.file);
	let tmp = file.path

	fse.copySync(tmp,settings.ABS_UPLOAD_DIR + handler.file );
	//fs.createReadStream(tmp).pipe(fs.createWriteStream(settings.ABS_UPLOAD_DIR + handler.file));

 	/*let stats = fs.statSync(tmp)
 	let fileSizeInBytes = stats["size"]
	log.dbg(fileSizeInBytes) 	*/

 	/*var stats = fs.statSync(settings.ABS_UPLOAD_DIR+handler.file)
 	var fileSizeInBytes = stats["size"]
	log.dbg(fileSizeInBytes)*/
	log.dbg("upload complete",file.path)
}


uploadHandlerImg.onEnd = function uploadOnEndHandler(req, res){
	let file = settings.ABS_UPLOAD_DIR + uploadHandlerImg.file
	let resizedFileName = "_"+uploadHandlerImg.file +'.png'
	let resizedImg = settings.ABS_UPLOAD_DIR + resizedFileName
	log.dbg(file,resizedImg) ;

	sharp(file)
		.resize(settings.THUMB.WIDTH, settings.THUMB.HEIGHT)
		.toFile(resizedImg, function(err) {
			// output.jpg is a 200 pixels wide and 200 pixels high image
			// containing a scaled and cropped version of input.jpg
			if(!err)
			{
				res.writeHead( 200, {'Content-Type': 'text/plain'} )
				res.end(settings.UPLOAD_DIR + resizedFileName);
			}
			else {
				log.dbg(err)
				res.status(401).send(err);
			}
			// todo : manage errors
		});
}


uploadHandlerXls.onEnd = function uploadOnEndHandler(req, res){
	log.dbg("upload complete. parsing xlsx")
	parseXlsx(uploadHandlerXls.uploadDir+ "/" + uploadHandlerXls.file, function(err, data) {
		if(err) { log.dbg(err) ; res.status(400).send() }
		else { res.status(200).json(data)}
	});
}
// < upload handler


uploadHandlerDebatMedia.onEnd = function uploadOnEndHandler(req, res){}

uploadHandlerDbtImg.onEnd = function uploadOnEndHandler(req, res){
	log.dbg('uploadonend dbt img end',uploadHandlerDbtImg.file )
	res.status(200).json({"status":"finished",
	                     "fileName":uploadHandlerDbtImg.file})
}


// unused and to defer to an other server/service
exports.uploadEndHandler=function(req, res) {

	log.dbg('uploadEndHandler')
	//req.form.on('end', function() {
	var upload = req.files.uploadedFile;
	//var POST= require('querystring').parse(req.body);
	log.dbg(upload)
	log.dbg("[" + upload.size + "]", upload.type)

	// check uploaded file
	if (upload
	&& upload.name != ''
	&& upload.name.length > 0
	&& upload.size > 0
	) {
		if (upload.size < 1000)
			return res.send('/ERROR, file too small');

		/*
		 if( ! upload.type.match(/audio|video/i) )
		 return res.send('/ERROR, not an audio nor video file');
		 */
		fs.readFile(upload.path, function (err, data) {
			if (err) return res.send('/ERROR, no file');
		});

		var ext = upload.type.split('/')[1];
		var tmp = upload.path
		//  fs.writeFile(tmp, data, function (err) {

		res.statusCode = 205;
		var convDone = 0
		var convErr = 0

		if (upload.type.match(/audio/i)) {
			log.dbg('starting audio conversion of ', tmp)
		}
		else { //video
			log.dbg('starting video conversion of ', tmp)
		}

		log.dbg(tmp + "written")
		res.writeHead( 200, {'Content-Type': 'text/plain'} )
		res.end(tmp);
	}
	else {
		log.dbg('no media')
	}
	//})
};

