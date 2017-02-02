/**
 * CONFIGURATION FILE
 */


var upload_dir = 'data/'

export var configuration = {

	APP: 'dialoguea',
	SITE: 'https://dialoguea.io',
	SERVER: "localhost:2015",
	PROTOCOL: "http://",
	PORT: 2015,
	DEBUG: true,
	LOG_FILE:'./logs/server.log', // todo rotations
	MONGO:'mongodb://127.0.0.1/', // todo sql layer
	DB: 'dialo',
	MAILER: {
		provider: 'GandiMail',
		email: 'forum-des-debats@dialoguea.fr',
		user: 'debats@dialoguea.fr',
		pass: '=3b4T5@@D14L0GU344='
	},
	ADMIN_MODULE: __dirname + '/server/views/adminmodule.min.js',
	UPLOAD_DIR: upload_dir,
	ABS_UPLOAD_DIR: '' + __dirname + '/public/'+upload_dir,
	MAX_DLSIZE: 5700000,
	THUMB: {WIDTH: 250, HEIGHT: 150},
	GROUP_PUBLIC:'public',
	ADMIN_GROUP : ['public'], //only to hide passwords
	TEMPPOSTTIME: 60 , //seconds
	UIDKEY:'3kinfDBcwdpGvuId',
	MODE_PUBLIC: true
};
