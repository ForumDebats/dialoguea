


import {configuration as config} from '../settings.js'

const KEY = hex(config.UIDKEY)

/* cyclic xor
* python equivalent to  ''.join(chr(ord(c1) ^ ord(c2)) for c1, c2 in zip((h1), cycle(h2)))
* */
function xor(a, b) {
	if (!Buffer.isBuffer(a)) a = new Buffer(a)
	if (!Buffer.isBuffer(b)) b = new Buffer(b)
	var res = []
	let _l=Math.max(a.length,b.length)
	//if (a.length > b.length) {
		for (var i = 0; i < _l; i++) {
			res.push(a[i%_l] ^ b[i%_l])
		}
	/*} else {
		for (var i = 0; i < a.length; i++) {
			res.push(a[i] ^ b[i])
		}
	}*/
	return new Buffer(res);
}

/*
function xor(s1,s2) {
	var xor = "";
	for (var i = 0; i < s1.length && i < s2.length; ++i) {
		xor += String.fromCharCode(s1.charCodeAt(i) ^ s2.charCodeAt(i));
	}
	return xor;
}*/

function hex(s) {
	var hex = '', tmp='';
	for(var i=0; i<s.length; i++) {
		tmp = s.charCodeAt(i).toString(16)
		if (tmp.length == 1) {
			tmp = '0' + tmp;
		}
		hex += tmp
	}
	return hex;
}


export function xencode(s,hk) {
	return xor(hex(s), hk)
}

export function xdecode(h,hk) {
	let dX=xor(h,hk)
	return new Buffer(dX.toString(), 'hex')+'';
}

export function kencode(s) {
	return xencode(s,KEY)
}
export function kdecode(h) {
	let dX=xor(h,KEY)
	return new Buffer(dX.toString(), 'hex');
}

export function kdecodeb64(bh) {
	let h=new Buffer(bh, 'base64').toString();
	return kdecode(h)
}

/*

let key='hi there'
 let hk=hex(key)
 let str="5785eb0026a4a0ea5a21fbb6"
 let xs=xencode(str,hk)
 let dxs=xdecode(xs,hk)
 console.log(dxs)

str="5785eb0026a4a0ea5a21fbb6"
let bxs=kencode(str).toString('base64')
console.log(">>",bxs)
let abs=new Buffer(bxs, 'base64').toString();
dxs=kdecode(abs)
console.log("//",dxs.toString())
console.log(dxs.toString())
let bs = "BlMFDwQBBAUAUwEBBAQFAQQGBQ8BAgZSBQMAAAUEBQYGUzYxMzIzMTY2NjI2MjM2"
dxs=kdecodeb64(bs)
console.log("++",dxs.toString())
	*/