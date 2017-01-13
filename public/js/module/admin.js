/**
 * Dialoguea
 * admin.js
 *
 * copyright 2014-2017 Intactile design, Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Released under the GPLv2 license
 *
 *
 * admin section routing
 */


var app = angular.module('adminDialoguea',
		['login', 'users', 'groups', 'openDebat', 'admDebats',
			'documents', 'admCategories', 'translation', 'upload']
)
		.factory('authInterceptor', AuthFactory)
		.config(['$httpProvider', function ($httpProvider) {
			$httpProvider.interceptors.push('authInterceptor');
		}])

		.config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {

			$stateProvider
				.state('opendebat', {
					url: '/opendebat',
					templateUrl: 'section/admin/opendebat.html',
					controller: 'OpenDebatCtrl',
					controllerAs: 'O'
				})
				.state('opendebat.groupList', {
					templateUrl: 'section/admin/group-list.html',
					controller: 'GroupsListCtrl',
					controllerAs: 'G',
					//template: "<group-list validation='yes' selection='O.selection'></group-list>",
					data: {selector: true, section: 'opendebat.'}
				})
				.state('opendebat.group', {
					url: '/groupe/:groupId',
					templateUrl: 'section/admin/group.html',
					controller: 'GroupCtrl',
					controllerAs: 'g',
					data: {section: 'opendebat.'}
				})
				.state('opendebat.categories', {
					templateUrl: 'section/admin/categories.html',
					controller: 'AdmCategoriesCtrl',
					controllerAs: 'C',
					data: {section: 'opendebat.'}
				})
				.state('opendebat.docList', {
					url: '/documents/:catId',
					templateUrl: 'section/admin/documents.html',
					controller: 'DocListCtrl',
					controllerAs: 'D',
					data: {selector: true, section: 'opendebat.'}
				})
				.state('categories', {
					url: '/categories',
					templateUrl: 'section/admin/categories.html',
					controller: 'AdmCategoriesCtrl',
					controllerAs: 'C',
					data: {section: ''}
				})
				.state('docList', {
					url: '/documents/:catId',
					templateUrl: 'section/admin/documents.html',
					controller: 'DocListCtrl',
					controllerAs: 'D',
					data: {selector: false, section: ''}
				})
				.state('groupList', {
					url: '/groupes',
					templateUrl: 'section/admin/group-list.html',
					controller: 'GroupsListCtrl',
					controllerAs: 'G',
					data: {selector: false, section: ''}
				})
				.state('group', {
					url: '/groupe/:groupId',
					templateUrl: 'section/admin/group.html',
					controller: 'GroupCtrl',
					controllerAs: 'g'
				})
				.state('documentDetail', {
					url: '/doc/:docId',
					templateUrl: 'section/admin/documents.html',
					controller: 'DocsCtrl',
					controllerAs: 'D'
				})
				.state('admDebats', {
					url: '/admdebats',
					templateUrl: 'section/admin/debat-list.html',
					controller: 'AdmDebatsCtrl',
					controllerAs: 'D'
				})
				.state('upload', {
					url: '/upload',
					templateUrl: 'section/admin/upload.html',
					controller: 'FileUploadCtrl',
					controllerAs: 'F'
				})
		}]);
