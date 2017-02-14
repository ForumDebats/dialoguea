/**
 * Dialoguea
 * routes.js
 *
 * copyright 2014-2017 Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Released under the AGPL license
 *
 */

var ROUTES = ['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
	// For any unmatched url, redirect to /
	//$urlRouterProvider.otherwise("/");
	//$urlRouterProvider.when('/', '/');
	$stateProvider
		.state('accueil', {
			url: '/',
			templateUrl: 'section/accueil.html',
			controller: 'AccueilCtrl'
		})
		.state('accueil.liste', {
			templateUrl: 'section/liste-debats.html',
			controller: 'ListeDebatsCtrl',
			controllerAs: 'L'
		})
		.state('accueil.cat', {
			templateUrl: 'section/categories.html',
			controller: 'CategoriesCtrl',
			controllerAs: 'C'
		})
		.state('tutoriel', {
			url: '/tutoriel',
			templateUrl: 'section/tutoriel/index.html'
		})
		.state('cat', {
			url: '/cat',
			templateUrl: 'section/categories.html',
			controller: 'CategoriesCtrl',
			controllerAs: 'C'
		})
		.state('liste-debats', {
			url: '/liste-debats',
			templateUrl: 'section/liste-debats.html',
			controller: 'ListeDebatsCtrl',
			controllerAs: 'L'
		})
		.state('cdebats', {
			url: '/cdebats/:catId',
			templateUrl: 'section/cdebats.html',
			controller: 'CatDocListCtrl',
			controllerAs: 'D'
		})
		.state('cdebats.debats', {
			url: '/debats',
			templateUrl: 'section/debat-list.html',
			controller: 'DebatsCtrl',
			controllerAs: 'D'
		})
		.state('debats', {
			url: '/debats',
			templateUrl: 'section/debat-list.html',
			controller: 'DebatsCtrl',
			controllerAs: 'D'
		})
		.state('debat', {
			url: '/debat/:debatId',
			templateUrl: 'section/debat.html',
			controller: 'DebatCtrl',
			controllerAs: 'A'
		})
		.state('jumpToComment', {
			url: '/debat/:debatId/:cmtId',
			templateUrl: 'section/debat.html',
			controller: 'DebatCtrl',
			controllerAs: 'A'
		})
		.state('restitution', {
			url: '/restitution/:debatId',
			templateUrl: 'section/restitution.html',
			controller: 'RestitCtrl',
			controllerAs: 'G'
		})
		.state('message', {
			url: '/_/:message',
			templateUrl: 'section/message.html',
			controller: 'MessageCtrl',
			controllerAs: 'M'
		})
		.state('error', {
			url: '/error/:message',
			templateUrl: 'section/message.html',
			controller: 'MessageCtrl',
			controllerAs: 'M'
		})
		.state('synthese', {
			url: '/synthese/:docId',
			templateUrl: 'section/synthese.html',
			controller: 'SyntheseCtrl',
			controllerAs: 'S'
		})
		.state('login', {
			url: '/login',
			templateUrl: 'section/login-modal.html',
			controller: 'LoginCtrl',
			controllerAs: 'L'
		})
		.state('login.requestp', {
			templateUrl: 'section/requestpass.html',
			controller: 'CategoriesCtrl',
			controllerAs: 'C'
		})
		.state('/debats/:catId', {
			templateUrl: 'section/debat-list.html',
			controller: 'DebatsCtrl',
			controllerAs: 'D'
		})
		.state('/nouveaudebat/:catId', {
			templateUrl: 'section/nouveaudebat.html',
			controller: 'NouveauDebatCtrl',
			controllerAs: 'N'
		})
}]