/**
 * Dialoguea
 * admin.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
 * Released under the AGPL license
 *
 *
 * admin section routing
 */

 /*
ok
var loadJS = function(url, implementationCode, location){
    //url is URL of external file, implementationCode is the code
    //to be called from the file, location is the location to
    //insert the <script> element

    var scriptTag = document.createElement('script');
    scriptTag.src = url;

    scriptTag.onload = implementationCode;
    scriptTag.onreadystatechange = implementationCode;

    location.appendChild(scriptTag);
};
loadJS('admindeps.js',null,document.body)
*/


var UserFactory = ['$resource', function ($resource) {
	return $resource('apiadm/users/:id',
		{id: '@_id'},
		{
			update: {method: 'PUT'},
			query: {method: 'GET', params: {gid: '@groupId'}, isArray: true}
		});
}];

var app = angular.module('adminDialoguea',
	['ui.router', 'ngResource', 'ngAnimate','as.sortable','ui.tinymce','ngTouch'])

	.factory('authInterceptor', AuthFactory)
	.factory('Broadcast', BroadcastFactory)

	.factory('User',UserFactory)
	.factory('Cat', CatFactory)
	.factory('Debat', DebatFactory)
	.factory('Docu', DocuFactory)
	.factory('Group',GroupFactory)
	.factory('Cmt', CmtFactory)

	.directive('clickOnce', ClickOnce)
	.directive('userList',function() {
		return{
			restrict:'E',
			templateUrl: 'section/admin/user-list.html',
			controller: 'UsersCtrl',
			controllerAs:'U'
		}
	})

	// keyboard
	.directive('ngEnter', ngEnter )
	.directive('ngEscape', ngEscape )

	.filter('usersearch', function (row) {
		return !!((row.nom.indexOf($scope.query || '') !== -1
			 || row.prenom.indexOf($scope.query || '') !== -1));
	})
	.directive('groupList',function() {
		return{
			restrict:'E',
			templateUrl: 'section/admin/group-list.html',
			controller: 'GroupsListCtrl',
			controllerAs:'G',
			scope: {
				validation: '@validation',
				selection: '='
			}
		}
	})
	/*.filter('search', function (row) {
		return 0 //((row.dateFermeture < Date.now())) ;
	})*/


	.directive('errSrc',errSrc)
	.directive('getImg',getImg)
	.controller('AdmCategoriesCtrl',AdmCategoriesCtrl)
	.controller('AdmDebatsCtrl', AdmDebatCtrl)
	.controller('DocListCtrl',DocListCtrl)
	/*.controller('DocsListCtrl',DocsListCtrl)
	.controller('DocsCtrl',DocsCtrl)
	.controller('DocEditCtrl',DocEditCtrl)*/
	.controller('GroupsListCtrl',GroupsListCtrl)
	.controller('GroupCtrl',GroupCtrl)
	.controller('UsersCtrl',UsersCtrl)
	.controller('OpenDebatCtrl',OpenDebatCtrl)
	.controller('PreDebatCtrl',PreDebatCtrl)

	.config(['$httpProvider', function ($httpProvider) {
		$httpProvider.interceptors.push('authInterceptor');
	}])

	.config(ADMINROUTES);
