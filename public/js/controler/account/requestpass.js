
var RequestPassCtrl
	= ['$scope', '$http', '$location', function ($scope, $http, $location) {

	$scope.user = {email: ''}
	$scope.submitted = false;
	$scope.validated = false;
	$scope.changed = true;
	$scope.message = ''
	$scope.interacted = function (field) {
		return $scope.submitted && field.$dirty;
	};

	$scope.submitRequest = function () {
		$scope.submitted = true;
		$scope.changed = false;

		$http
			.post('requestnewp', $scope.user)
			.success(function () {
				$location.path('_/activating')
			})
			.error(function (data) {
				if (data == -1) $location.path('_/noaccount')
			})
	}
}];