/**
 * Dialoguea
 * auth.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
 * Released under the AGPL license
 *
 *
 * authentication through a request/reponse interceptor
 *
 * to configure :
   .factory('authInterceptor',AuthFactory)
   .config(function ($httpProvider) { $httpProvider.interceptors.push('authInterceptor'); })
 **/

var AuthFactory = ['$rootScope', '$q', function ($rootScope, $q) {
    return {
        request: function (config) {
            config.headers = config.headers || {};
	        config.headers.app='dialoguea'
            if ($rootScope.user) {
                config.headers.Authorization = 'Bearer ' + $rootScope.user.token;
            }
            return config;
        },
        response: function (response) {
            if (response.status === 401) {
                //console_dbg("/login")
                $rootScope.loggedIn=false
                //location.path("/login")
            }
            return response || $q.when(response);
        }
    };
}]
