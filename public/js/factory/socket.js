/**
 * Dialoguea
 * socket.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
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
