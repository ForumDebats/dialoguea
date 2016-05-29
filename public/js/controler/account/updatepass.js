
var UpdatePassCtrl
	= ['$scope', '$rootScope', '$sce', '$http', '$stateParams', '$state', '$window',
	function ($scope, $rootScope, $sce, $http, $stateParams, $state, $window ) {

		$scope.success = false;
		$scope.user = {password: ''}
		console_dbg($stateParams.key)
		$http
			.post('reinitmdpcheck', {key: $stateParams.key})
			.success(function (data) {
				$scope.message = data;
			})
			.error(function (data) {
				console_dbg(data)
				$state.go("error", {message: "invalid_token"});
			})

		$scope.submitted = false;
		$scope.validated = false;
		$scope.message = ''
		$scope.interacted = function (field) {
			return $scope.submitted && field.$dirty;
		};

		$scope.submit = function () {
			$scope.submitted = true;
			// todo : wait indicator
			$http
				.post('newmdp', {id: $stateParams.key, newmp: $scope.user.password})
				.success(function (data) {
					UserStorage(data, $window, $rootScope, $sce)
					$state.go("message", {message: "pwupdated"});
				})
				.error(function (data) {
					$scope.message = data;
				})
		}
	}]

