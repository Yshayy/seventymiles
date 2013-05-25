
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , socketio = require('socket.io')
  , path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));



// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}
var buffer = [];
app.get('/', routes.index);

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var io = socketio.listen(server);

io.configure( function(){
    io.enable('browser client minification');  // send minified client
	io.enable('browser client etag');          // apply etag caching logic based on version number
	io.enable('browser client gzip');          // gzip the file
	io.set('log level', 1);                    // reduce logging
	io.set('transports', [                     // enable all transports (optional if you want flashsocket)
	    'websocket'
	  , 'flashsocket'
	  , 'htmlfile'
	  , 'xhr-polling'
	  , 'jsonp-polling'
	]);
});
var peerCounts = [];
io.sockets.on('connection', function(client){
    client.on('setPeerChannel', function(channelId){
        peerCounts[channelId] = peerCounts[channelId] || 0;
        peerCounts[channelId]++;
        client.on(channelId, function(msg)
        {
            client.broadcast.emit(channelId, msg);
        });
        client.on('disconnect', function(){
             peerCounts[channelId]--;
             client.broadcast.emit(channelId, {type:"disconnect"});
        });
        
        client.emit(channelId, {type:"connect", membersCount:peerCounts[channelId]  });
        client.broadcast.emit(channelId, {type:"connect", membersCount:peerCounts[channelId]});
    });
 
    
});


