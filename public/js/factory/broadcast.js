
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

