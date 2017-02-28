/**
 * Dialoguea
 * account.js
 *
 * copyright 2015-2017 Forum Des Débats, Intactile Design, the following authors
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
 * Released under the AGPL license
 *
 * registering usera and password recovery
 */


angular.module('account', ['ngResource','ngMessages'])
	.directive('checkStrength', checkstrength)
	.controller('RegisterCtrl', ['$scope','$http',function($scope,$http) {
		$scope.user = { nom:'', prenom:'', email:'',password:''};
		$scope.submitted = false;
		$scope.validated = false;
		$scope.message = ''
		$scope.interacted = function(field) { return $scope.submitted && field.$dirty; };

		$scope.submit = function() {
			$scope.submitted = true;
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


/** account activation */
const ActivationCtrl
	= ['$scope', '$rootScope', '$sce', '$http', '$stateParams', '$window', "$location",
	function ($scope, $rootScope, $sce, $http, $stateParams, $window, $location) {

		$scope.message = "Validation..."

		$http
			.post('activer', {id: $stateParams.id}) // todo : hash
			.success(function (data) {
				UserStorage(data, $window, $rootScope, $sce)
				$location.path("_/registered");
			})
			.error(function (data) { // return code redirect to error page
				$location.path("_/" + data);
			})
	}]


/** password retrieval request */
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
		// todo : wait indicator
		//if($scope.loginForm.$valid) {
		$http
			.post('/requestnewp', $scope.user)
			.success(function () {
				// Les instructions pour réinitialiser le mot de passe ont été envoyées
				$location.path('/_/activating')
			})
			.error(function (data) {
				if (data == -1) $location.path('/_/noaccount')
			})
		//}
	}
}];

/** set a new password */
const UpdatePassCtrl
	= ['$scope', '$rootScope', '$sce', '$http', '$stateParams', '$state', '$window',
	function ($scope, $rootScope, $sce, $http, $stateParams, $state, $window ) {

		$scope.success = false;
		$scope.user = {password: ''}
		$http
			.post('/reinitmdpcheck', {key: $stateParams.key})
			.success(function (data) {
				$scope.message = data;
			})
			.error(function (data) {
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
