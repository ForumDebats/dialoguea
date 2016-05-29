/**
 * Login process
 *
 * - trigger the logincontroler
 * - check if login information present
 *   - then token present
 *   - proceed with token and session storage
 * - no login information
 *   - assert sessionstorage is clean
 *   - display with user info clearance
 *
 * - send login information
 *   - retrieve logindata and store
 *   - proceed
 * - send activation mail
 *   - retrieve logindata []
 *   - redirect to home page with userinfos
 *
 * - on every request
 *   - update token timeout?
 */

function UserStorage(loginData, $window, $rootScope, $sce) {
	// store user login parameters
	console_dbg(Settings.storage )
	var storage = Settings.storage == "SessionStorage" ? $window.sessionStorage : $window.localStorage;

	storage.user = JSON.stringify(loginData)
	$rootScope.user = JSON.parse(storage.user);
	$rootScope.indicator = $sce.trustAsHtml(storage.user.indicator)
	$rootScope.showLoginWindow = false;  // set it to true by default IN THE CONTROLLER INIT to force login on opening
	$rootScope.loggedIn = false;
}


angular.module('login', ['oc.lazyLoad'])

	/*.config(['$ocLazyLoadProvider', function ($ocLazyLoadProvider) {
		$ocLazyLoadProvider
			.config({
				debug: true
			})
	}])*/

	.directive('login', function () {
		return {
			restrict: 'E',
			templateUrl: 'section/user-info.html',
			controller: 'LoginCtrl',
			controllerAs: "L"
		};
	})

	.controller('LoginCtrl', ['$rootScope', '$http', '$window', '$sce', '$translate', '$ocLazyLoad', '$scope', '$timeout', '$location',
		function ($rootScope, $http, $window, $sce, $translate, $ocLazyLoad, $scope, $timeout, $location) {

			$rootScope.credits = true;
			$rootScope.showLoginWindow = !Settings.mode_public;// set it to true by default to force login on opening
			var L = this
			L.createAccountAllowed = Settings.createAccountAllowed

			var storage = $window.localStorage;
			var user = storage.user ? JSON.parse(storage.user) : undefined

			if (user
				&& user.uid
				&& user.token) {
				$rootScope.user = user
			}

			L.verify = function () {
				$http.get('api/hi')
					.success(function (data) {
						if (data == "HI") {
							$rootScope.loggedIn = true;
							$rootScope.showLoginWindow = false;
							L.load(user.indicator)
						}
						else $rootScope.loggedIn = false;
					})
					.error(function () {
						delete storage.user;
						$rootScope.loggedIn = false;
						//$rootScope.showLoginWindow = true;
						$rootScope.user = null;
					})
					.finally(function () {
						$("#loading").hide()
					})
			};
			L.verify();

			L.show = function (visible) {
				$rootScope.showLoginWindow = visible;
			}

			this.login = {username: '', password: ''};

			L.submit = function () {
				// TODO : HASH !
				$http
					.post('login', L.login)
					.success(function (loginData) {
						UserStorage(loginData, $window, $rootScope, $sce)
						user = $rootScope.user
						L.verify();
						$rootScope.$broadcast("loggedin")
						//$location.path("/");
					})
					.error(function (data, status, headers, config) {
						// Erase the token if the user fails to log in
						delete storage.user;
						$rootScope.loggedIn = false;
						// Handle login errors here
						L.message = data;
						console_dbg('error on connexion')
					})
					.finally(function () {
						L.login = {}
					});
			};

			$rootScope.disco = function () {
				delete storage.user;
				$rootScope.showLoginWindow = !Settings.mode_public ; // TRUE if default is login policy // Settings.defaultLogin
				$rootScope.loggedIn = false;
				$rootScope.user = {};
				$rootScope.credits = true;
				L.panel = ''
				L.message = '';
				$location.path("/");
			};

			L.closeLoginWindow = function () {
				$rootScope.showLoginWindow = false;
				L.message = ''
				$rootScope.message = '';
			}

			$rootScope.connect = function () {
				$rootScope.showLoginWindow = true;
				L.message = '';
			};

			L.load = function (path) {

				$scope.$on('ocLazyLoad.moduleLoaded', function (e, params) {
					console_dbg('event module loaded', params);
				});

				$scope.$on('ocLazyLoad.componentLoaded', function (e, params) {
					console_dbg('event component loaded', params);
				});

				$scope.$on('ocLazyLoad.fileLoaded', function (e, file) {
					console_dbg('event file loaded', file);
				});

				$ocLazyLoad.toggleWatch(true)

				$http.get(path)
					.success(function(script) {
						var el = document.createElement("script"),
							loaded = false;
						el.onload = el.onreadystatechange = function () {
							if ((el.readyState && el.readyState !== "complete" && el.readyState !== "loaded") || loaded) {
								return false;
							}
							el.onload = el.onreadystatechange = null;
							loaded = true;
							$ocLazyLoad.inject("admindialoguea")
							$ocLazyLoad.toggleWatch(false)
							el.parentNode.removeChild(el);
							L.panel = $sce.trustAsHtml($rootScope.user.panel)
						};
						el.async = true;
						el.text = script;
						document.getElementsByTagName('head')[0].insertBefore(el, document.head.lastChild);
						el.onload()
				})
			}
		}]);
