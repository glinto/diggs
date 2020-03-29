class Game {

	constructor(players, deck) {
		this.players = players;
		this.deck = deck;
		this.state = 'NS';
		players.game = this;
	}

	reset() {
		//reset the deck
		this.deck.reset();
		console.log('Deck: '+this.deck.cards);

		//empty players' hands
		var i;
		for (i = 0; i < this.players.items.length; i++) {
			this.players.items[i].cards = [];
		}
		
	}

	deal() {
		var i;
		for (i = 0; i < this.players.items.length; i++) {
			var p = this.players.items[i];
			while (p.cards.length < 6) {
				p.cards.push(this.deck.cards.pop());
			}
			p.socket.emit('hand', p.cards);
		}
		console.log('Cars dealt, new deck: '+this.deck.cards);
	}

	next() {
		if (this.state == 'NS') { 
			this.reset();
			this.deal();
			
			this.setState('ST');
		}
		
	}

	setState(str) {
		this.state = str;
		this.players.io.emit('state', this.state);
		console.log('New state: ' + this.state);
	}

	returnCards(arr) {
		if (Array.isArray(arr)) {
			this.deck.cards = this.deck.cards.concat(arr);
		}
		
	}



}

module.exports = Game;