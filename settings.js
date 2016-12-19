/**
 * CONFIGURATION FILE
 */


var upload_dir = 'data/'

exports.configuration = {

   APP: 'dialoguea',
   SITE: 'https://dialoguea.io',
	SERVER: "localhost:2016",
	PROTOCOL: "http://",
	PORT: 2016,
	DEBUG: false,
	LOG_FILE:'./logs/server.log', // todo rotations
	MONGO:'mongodb://localhost/',
	DB: '',
	ADMIN_MODULE: __dirname + '/server/views/adminmodule.min.js',
	UPLOAD_DIR: upload_dir,
	ABS_UPLOAD_DIR: '' + __dirname + '/public/'+upload_dir,
	MAX_DLSIZE: 5700000,
	THUMB: {WIDTH: 250, HEIGHT: 150},
	GROUP_PUBLIC:'public',
	ADMIN_GROUP : ['public'], //hide passwords
	TEMPPOSTTIME: 30 , //seconds when debugging, 4 mn in prod
	MODE_PUBLIC: false
};
