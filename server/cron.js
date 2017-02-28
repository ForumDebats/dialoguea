/**
 * Dialoguea
 * cron.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * author : Philippe Estival -- phil.estival @ free.fr
 * Dual licensed under the MIT and AGPL licenses.
 *
 *
 * cron like tasks
 *
 */

var DB = require('./db'),
    log = require('./log')

var CronJob = require('cron').CronJob;
new CronJob('00 00 05 * * *', function () {
	log.dbg('Mise à jour des débats');
}, null, true, 'Europe/Paris');
