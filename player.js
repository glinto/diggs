class Player {
	constructor(socket) {
		this.socket = socket;
		//this.clientID = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
	}


}
class Players {


	constructor(io) {
		this.io = io;
		this.items = [];
		//this.clientID = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
	}

	disconnect(socket) {
		var i;
		var index = -1;
		for (i=0; i<this.items.length; i++) {
			if (this.items[i].socket == socket) index = i;
		}
		if (index != -1) this.items.splice(index, 1);
		this.io.emit('players', this.list()); 
	}

	connect(socket) {
		var p = new Player(socket);
		this.items.push(p);
		socket.emit('you', {id: socket.id});
		this.io.emit('players', this.list()); 

	}

	list() {
		var i;
		var l = [];
		for (i=0; i<this.items.length; i++) {
			l.push({id: this.items[i].socket.id});
		}
		return l;
	}
} 

module.exports = Players;