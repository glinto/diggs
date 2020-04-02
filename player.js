class Player {

	constructor(socket, group) {
		this.socket = socket;
		this.name = socket.id;
		this.clientId = socket.id;
		this.group = group;
		this.cards = [];
		//this.clientID = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
		socket.on('me', this.me.bind(this));
		socket.on('next', this.next.bind(this));
		socket.on('story', this.story.bind(this));
		socket.on('play', this.play.bind(this));
		socket.on('vote', this.vote.bind(this));
	}

	me(data) {
		console.log(this.name + ' has set his/her name to "' + data.name + '" (client id: "' + data.clientId + '")');
		this.name = data.name;
		this.clientId = data.clientId;
		this.group.game.register(data.clientId, this);
		this.group.update();
		this.updateHand();
	}

	next() { 
		console.log(this.name + ' started new round');
		this.group.game.next(); 
	}

	story(str) { 
		console.log(this.name + ' told story "'+str+'"');
		this.group.game.setStory(this, str); 
	}

	play(serial) {
		this.group.game.playCard(this, parseInt(serial));
	}

	vote(serial) {
		this.group.game.voteCard(this, parseInt(serial));
	}

	updateHand() {
		var i;
		var tableCard = false;
		for (i = 0; i < this.group.game.deck.table.length; i++) {
			if (this.group.game.deck.table[i].owner == this.clientId) tableCard = this.group.game.deck.table[i].serial;
		}
		this.socket.emit('hand', {table: tableCard, hand: this.cards});
	}

}

class Players {

	constructor(io) {
		this.io = io;
		this.items = [];
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
		
		//socket.emit('hand', {table: false, hand:[]});

		socket.emit('state', this.game.state);
		if (this.game.story) socket.emit('story', this.game.story);
		
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
			var p = this.items[i];
			var acted = this.game.acted.indexOf(p.clientId) != -1;
			l.push({id: p.socket.id, name: p.name, storySetter: p.clientId == this.game.storySetter, acted: acted});
		}
		return l;
	}

	find(property, value) {
		var i;
		for (i = 0; i < this.items.length; i++) {
			if (this.items[i][property] == value) return this.items[i];
		}
		return null;
	}

	get registeredCount() {
		var i;
		var n = 0;
		for (i = 0; i < this.items.length; i++) {
			if (this.items[i].clientId != this.items[i].socket.id) n++;
		}
		return n;
	}

} 

module.exports = Players;