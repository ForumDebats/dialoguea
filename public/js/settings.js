

/** @define {boolean} */
ENABLE_DEBUG=false
console_dbg=function(){}

Settings = {
	default_login_policy: true,
	storage : "LocalStorage", /*"SessionStorage"*/
	createAccountAllowed : true,
	postTimeout:4*60*1000 // TODO :: compiler des constantes pour à la fois côté et client et serveur
}