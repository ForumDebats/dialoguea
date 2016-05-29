

var RegisterCtrl = ['$scope','$http',function($scope,$http) {
	$scope.user = { nom:'', prenom:'', email:'',password:''};
	$scope.submitted = false;
	$scope.validated = false;
	$scope.message=''
	$scope.interacted = function(field) { return $scope.submitted && field.$dirty; };

	$scope.submit = function() {
		$scope.submitted=true;
		console_dbg($scope.user)
		if($scope.registerForm.$valid) {
			$http
				.post('newaccount', $scope.user)
				.success(function () {
					$scope.validated=true;
				})
				.error( function (data) {
					$scope.message = data;
				})
		}
	}
}]