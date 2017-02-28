/**
 * Dialoguea
 * account.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
 * Released under the AGPL license
 *
 *
 * shared service broadcast
 *
 // todo : a dedicated page for update/request and register/activate to offload some bits
 **/

angular.module('account', ['ngResource','ngMessages'])
	.directive('checkStrength', checkstrength)
	.controller('RegisterCtrl', RegisterCtrl)
	.controller('ActivationCtrl', ActivationCtrl)
	.controller('UpdatePassCtrl', UpdatePassCtrl)
	.controller('RequestPassCtrl', RequestPassCtrl)
	.controller('MessageCtrl', MessageCtrl)
	.config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
		// For any unmatched url, redirect to /
		$urlRouterProvider.otherwise("/");
		//$urlRouterProvider.when('/', '/');
		// Now set up the states
		$stateProvider
			.state('register', {
				url: '/register',
				templateUrl: 'section/register.html',
				controller: 'RegisterCtrl',
				controllerAs: 'R'
			})
			.state('activation', {
				url: '/activation/:id',
				templateUrl: 'section/message.html',
				controller: 'ActivationCtrl',
				controllerAs: 'R'
			})
			.state('requestpass', {
				url: '/requestp',
				templateUrl: 'section/requestpass.html',
				controller: 'RequestPassCtrl',
				controllerAs: 'R'
			})
			.state('reinitmdp', {
				url: '/reinit-mdp/:key',
				templateUrl: 'section/reinit-mdp.html',
				controller: 'UpdatePassCtrl',
				controllerAs: 'U'
			})
	}])
