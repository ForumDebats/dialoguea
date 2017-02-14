/**
 * Dialoguea
 * cron.js
 *
 * copyright 2014-2017 Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Dual licensed under the MIT and AGPL licenses.
 *
 *
 * cron like tasks
 *
 */

var DB = require('./db')

var CronJob = require('cron').CronJob;
new CronJob('00 00 00 * * *', function () {
	log.dbg('Updating debates schedule');
}, null, true, 'Europe/Paris');
