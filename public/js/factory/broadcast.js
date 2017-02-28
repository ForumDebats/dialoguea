/**
 * Dialoguea
 * broadcast.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
 * Released under the AGPL license
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

