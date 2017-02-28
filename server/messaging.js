/**
 * Dialoguea
 * messaing.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * author : Philippe Estival -- phil.estival @ free.fr
 * Dual licensed under the MIT and AGPL licenses.
 *
 *
 * server/messaging.js
 * Socket.io channel
 *
 */

import log from './log'
import db from './db'

var
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

    io.sockets.on('connection', socket=>{
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
