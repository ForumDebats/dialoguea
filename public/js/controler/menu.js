/**
 * Dialoguea
 * menu.js
 *
 * copyright 2014-2017 Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Released under the AGPL license
 *
 * simple tab menu
 */

angular.module('menu', [])

	.controller('MenuCtrl',
	function()
	{
		this.isSelected = function (tab) {
			return this.tab === tab
		}
		this.setTab = function (tab) {
			this.tab = tab;
		};
		this.selectTab = function (tab) {
			console_dbg(this.tab)
			this.tab = tab;
		};
	});