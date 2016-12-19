/**
 * Dialoguea
 * broadcast.js
 *
 * copyright 2014-2017 Intactile design, Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Released under the GPLv2 license
 *
 *
 * shared service broadcast
 **/

var BroadcastFactory = ['$rootScope', function($rootScope) {
	var sharedService = {};

	sharedService.message = '';

	sharedService.prepForBroadcast = function(msg,head) {
		this.message = msg;
		this.broadcastItem(head);
	};

	sharedService.broadcastItem = function(head) {
		$rootScope.$broadcast(head);
	};

	return sharedService;
}];

