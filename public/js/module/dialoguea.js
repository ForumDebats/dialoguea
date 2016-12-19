/**
 * Dialoguea
 * dialoguea.js
 *
 * copyright 2014-2017 Intactile design, Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Released under the GPLv2 license
 *
 *
 **/

angular.module('dialoguea',
	['ui.router', 'ngResource', 'ngAnimate','translation', 'account','login',
		'nouveaudebat','debat' /*, 'ckeditor'*/]
)
	.factory('authInterceptor', AuthFactory)
	.config(['$httpProvider', function ($httpProvider) {
		$httpProvider.interceptors.push('authInterceptor');
	}])
	.factory('Debat', DebatFactory)
	.factory('Docu', DebatFactory)
	.factory('Cat', CatFactory)
	.filter('cut', cutFilter)
	.directive('emailValidator', emailValidation)
	.controller('AccueilCtrl', ['$stateParams', '$state','$rootScope',
		function ($stateParams, $state,$rootScope) {
			$rootScope.NAVIGATOR = NAVIGATOR;
			$state.go('accueil.cat')
			//$state.go('accueil.liste')
			/*if($rootScope.loggedIn) $state.go('accueil.cat')
			else  $state.go('login')
			*/
			}])
	.controller('ListeDebatsCtrl', ListeDebatsCtrl)
	.controller('MessageCtrl', MessageCtrl)
	.controller('CategoriesCtrl', CategoriesCtrl)
	.controller('CatDocListCtrl', CatDocListCtrl)
	.controller('DebatsCtrl', DebatsCtrl)
	.controller('RestitCtrl', RestitCtrl)
	.controller('SyntheseCtrl', SyntheseCtrl)

	//.controller('TestCtrl', TestCtrl)
	.config(ROUTES)
