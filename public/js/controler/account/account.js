w/**
 * Date: <17/05/15 16:52>
 * dialoguea
 * estival@enov-formation.com
 *
 * activation.js
 */


angular.module('account', ['ngResource','ngMessages'])

	.directive('checkStrength', checkstrength)
	.controller('RegisterCtrl', ['$scope','$http',function($scope,$http) {
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
					.success(function (data /*, status, headers, config*/) {
						$scope.validated=true;
					})
					.error( function (data) {
						$scope.message = data;
					})
			}
		}
	}])

const ActivationCtrl
	= ['$scope', '$rootScope', '$sce', '$http', '$stateParams', '$window', "$location",
	function ($scope, $rootScope, $sce, $http, $stateParams, $window, $location) {

		$scope.message = "Validation..."

		$http
			.post('/activer', {id: $stateParams.id}) // todo : hash
			.success(function (data) {
				UserStorage(data, $window, $rootScope, $sce)
				$location.path("/_/registered");
			})
			.error(function (data) {
				$location.path("/_/" + data);
			})
	}]


const RequestPassCtrl
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
		// todo : wait
		//if($scope.loginForm.$valid) {
		$http
			.post('/requestnewp', $scope.user)
			.success(function () {
				//$scope.message="Les instructions pour réinitialiser le mot de passe vous ont été envoyées.";
				$location.path('/_/activating')
			})
			.error(function (data) {
				// todo : message code, translate
				//if(data==-1) $scope.message="Aucun compte Dialoguea n'est enregistré avec cet email"
				if (data == -1) $location.path('/_/noaccount')
			})
		//}
	}
}];

const UpdatePassCtrl
	= ['$scope', '$rootScope', '$sce', '$http', '$stateParams', '$state', '$window',
	function ($scope, $rootScope, $sce, $http, $stateParams, $state, $window ) {

		$scope.success = false;
		$scope.user = {password: ''}
		console_dbg($stateParams.key)
		$http
			.post('/reinitmdpcheck', {key: $stateParams.key})
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
				.post('/newmdp', {id: $stateParams.key, newmp: $scope.user.password}) // todo : hash
				.success(function (data) {
					UserStorage(data, $window, $rootScope, $sce)
					$state.go("message", {message: "pwupdated"});
				})
				.error(function (data) {
					$scope.message = data;
				})
			//}
		}
	}]
