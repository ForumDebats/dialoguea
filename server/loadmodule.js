/**
 * Dialoguea
 * loadmodule.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
 * Released under the AGPL license
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