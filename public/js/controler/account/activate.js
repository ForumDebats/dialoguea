
var ActivationCtrl
	= ['$scope', '$rootScope', '$sce', '$http', '$stateParams', '$window', "$location",
	function ($scope, $rootScope, $sce, $http, $stateParams, $window, $location) {

		$http
			.post('activer', {id: $stateParams.id})
			.success(function (data) {
				UserStorage(data, $window, $rootScope, $sce)
				$location.path("_/registered");
			})
			.error(function (data) {
				$location.path("_/" + data);
			})
	}]