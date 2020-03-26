class Player {

	constructor(socket) {
		this.socket = socket;
		this.name = socket.id;
		this.group = null;
		//this.clientID = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
		socket.on('me', this.setName.bind(this));

	}

	setName(str) {
		//console.log(this);
		this.name = str;
		this.group.update();
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

		//Notify others to update list of players
		this.update(); 

		//TODO: dispense held cards
	}

	connect(socket) {
		var p = new Player(socket);
		p.group = this;
		this.items.push(p);
		

		//Send back the socket ID
		socket.emit('you', {id: socket.id});
		//Notify others to update list of players
		this.update();
	}

	update() {
		this.io.emit('players', this.list()); 
	}

	list() {
		var i;
		var l = [];
		for (i=0; i<this.items.length; i++) {
			l.push({id: this.items[i].socket.id, name: this.items[i].name});
		}
		return l;
	}

} 

module.exports = Players;