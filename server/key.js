/**
 * Dialoguea
 * key.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
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