/**
 * Dialoguea
 * dialoguea.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
 * Released under the AGPL license
 *
 *
 **/

angular.module('dialoguea',
	['ui.router', 'ngResource', 'ngRoute', 'ngAnimate','translation', 'account','login','debat' /*, 'ckeditor'*/]
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
