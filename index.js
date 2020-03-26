const express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http, {cookie: true, pingInterval: 5000, pingTimeout: 5000});

const Players = require('./player');
var players = new Players(io);

const Deck = require('./deck');
var deck = new Deck();




app.use(express.static('public'));
app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});

io.on('connection', function(socket) {
 	
 	//console.log(socket.id+' connected');
 	players.connect(socket);
 	
 	socket.on('disconnect', (reason) => {
    	console.log(socket.id+' disconnected: '+reason);
    	players.disconnect(socket);
  	});
 	
 	io.clients((error, clients) => {
	  if (error) throw error;
	  //console.log('clients: ' + clients); // => [6em3d4TJP8Et9EMNAAAA, G5p55dHhGgUnLUctAAAB]
	});
});
