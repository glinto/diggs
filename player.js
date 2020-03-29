class Player {

	constructor(socket, group) {
		this.socket = socket;
		this.name = socket.id;
		this.group = group;
		this.cards = [];
		//this.clientID = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
		socket.on('me', this.setName.bind(this));
		socket.on('next', this.next.bind(this));
	}

	setName(str) {
		console.log(this.name + ' has set his/her name to "' + str + '"');
		this.name = str;
		this.group.update();
	}

	next() { 
		console.log(this.name + ' started new round');
		this.group.game.next(); 
	}

}

class Players {

	constructor(io) {
		this.io = io;
		this.items = [];
		this.activeIndex = 0;
		this.game = null;
		//this.clientID = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
	}

	disconnect(socket, reason) {
		var i;
		var index = -1;
		for (i=0; i<this.items.length; i++) {
			if (this.items[i].socket == socket) index = i;
		}
		
		if (index != -1) { 
			console.log(this.items[index].name + ' disconnected - reason: ' + reason);
			console.log('Returning '+this.items[index].cards.length+' cards to deck.')
			this.game.returnCards(this.items[index].cards);
			this.items.splice(index, 1);
		}
		//Notify others to update list of players
		this.update(); 

	}

	connect(socket) {
		var p = new Player(socket, this);

		this.items.push(p);
		console.log(socket.id + ' connected to the game');
		
		//Send back the socket ID
		socket.emit('you', {id: socket.id});
		
		if (this.game.state != 'NS') this.game.deal();
		else socket.emit('hand', []);
		socket.emit('state', this.game.state);
		
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
			l.push({id: this.items[i].socket.id, name: this.items[i].name, active: (i == this.activeIndex)});
		}
		return l;
	}

} 

module.exports = Players;