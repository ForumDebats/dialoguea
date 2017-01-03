/**
 * Dialoguea
 * messaing.js
 *
 * copyright 2014-2017 Intactile design, Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Dual licensed under the MIT and GPLv3 licenses.
 *
 *
 * server/messaging.js
 * Socket.io channel
 *
 */

var
db = require('./db'),
log = require('./log'),
Group = require('mongoose').model('Group'),
io = require('socket.io'),
connectedUsers=0

/*io.configure(function () {
    io.set("transports", ["xhr-polling"]);
    io.set("polling duration", 10);
});*/

/*io.set('browser client minification',1);  // send minified client
io.set('browser client etag');          // apply etag caching logic based on version number
io.set('browser client gzip');
*/
/*function broadcastChannel(id,type,data) {
 log.info('broadcasting '+type+' to OTHERS in class_'+ idg);
 io.sockets.in('class_'+ id).emit(type, data);
 }*/

exports.usersConnected = function() {
    return connectedUsers;
}

exports.listen = function (server) {

	// error:24064064:random number generator:SSLEAY_RAND_BYTES:PRNG not seeded
    log.info('socket messaging initialized')
    io = io.listen(server);

    server.listen(app.get('port'));
    log.info("server listening on port " + app.get('port'));

    io.sockets.on('connection', function (socket) {
        connectedUsers++
        //log.dbg(socket.id,'socket connected');

        socket.on('disconnect', function (data) {
            connectedUsers--;
           // log.dbg('*** socket closed ***')
            //log.dbg(data) //transport close
        });

        socket.on('enter', function (data) {
            socket.join(data.room)
            db.User.findOne({_id:data.uid},{prenom:1}, function(e,u) {
                if(u) {
                    console.log(u)
                    socket.to(data.room).emit("entered",u.prenom)
                }else{log.error("user",data.uid,"not found")}
            });
            //log.dbg(data.uid)
        });

        socket.on('newcmt', function (data) {
            db.User.findOne({_id:data.uid},{prenom:1}, function(e,u) {
                if(u) {
                    console.log(u)
                    socket.to(data.room).emit("newcmt",data)
                }else{log.error("user",data.uid,"not found")}
            });
        });

    });
}
