/**
 * Dialoguea
 * menu.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
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