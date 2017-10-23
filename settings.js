/**
 * CONFIGURATION FILE
 */


var upload_dir = 'data/'

export default {

	APP: 'dialoguea',
	SITE: 'https://dialoguea.fr',
	SERVER: "localhost:2015",
	PROTOCOL: "http://",
	PORT: 2015,
	LOG_FILE:'./logs/server.log',
	MONGO:'mongodb://127.0.0.1/',
	DB: 'dialo',
	MAILER: {
		provider: '',
		email: '',
		user: '',
		pass: ''
	},
	ADMIN_MODULE: __dirname + '/server/views/adminmodule.js',
	UPLOAD_DIR: upload_dir,
	ABS_UPLOAD_DIR: '' + __dirname + '/public/'+upload_dir,
	MAX_DLSIZE: 5700000,
	THUMB: {WIDTH: 250, HEIGHT: 150},
	GROUP_PUBLIC:'public',
	ADMIN_GROUP : ['public'],
	TEMPPOSTTIME: 60 , //seconds
	UIDKEY:'3kinfDBcwdpGvuId',
	MODE_PUBLIC: true,
    DEBUG:true
};
