/**
 * Dialoguea
 * socket.js
 *
 * copyright 2014-2017 Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Released under the AGPL license
 *
 *
 * websocket emiter/receiver
 *
 **/

var SocketFactory = ['$rootScope',function($rootScope) {
    //var socket = io.connect();
    return {
        on: function(eventName, callback) {
            /*socket.on(eventName, function() {
                var args = arguments;
                $rootScope.$apply(function() {
                    callback.apply(socket, args);
                });
            });*/
        },
        emit: function(eventName, data, callback) {
            /*socket.emit(eventName, data, function() {
                var args = arguments;
                $rootScope.$apply(function() {
                    if(callback) {
                        callback.apply(socket, args);
                    }
                });
            });*/
        }
    };
}]
