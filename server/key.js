/**
 * Dialoguea
 * key.js
 *
 * copyright 2014-2017 Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Dual licensed under the MIT and AGPL licenses.
 *
 * jwt public key
 *
 */

var
  jwt = require('express-jwt')
, fs = require('fs')

var publicKey = exports.pub = fs.readFileSync('./key.pub')
jwt({secret: publicKey});