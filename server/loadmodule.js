/**
 * Dialoguea
 * loadmodule.js
 *
 * copyright 2014-2017 Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Dual licensed under the MIT and AGPL licenses.
 *
 *
 * to trick nexe into NOT loading this module
 */

var nexe=true
exports.loadmodule = function(modulename) {
    if (nexe) {
        return modulename
    } else return modulename
}