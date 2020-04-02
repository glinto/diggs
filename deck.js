class PlayCard {
	constructor(serial, player) {
		this.serial = serial;
		this.votes = []
		this.owner = player.clientId;
	}
}

class Deck {

	constructor() {
		//cards in the draw deck
		this.cards = [];
		//dispened cards
		this.dispense = [];
		//cards played on the table
		this.table = [];
	}

	reset() {
		const DECK_SIZE = 84;
		
		this.cards = [];

		for (var i = 0; i < DECK_SIZE; i++) {
			this.cards.push(i+1);
		}

		this.dispense = [];
		this.table = [];

		this.shuffle(this.cards);
	}

	shuffle(cards) {
		var currentIndex = cards.length;
		var temporaryValue, randomIndex;

		// While there remain elements to shuffle...
		while (0 !== currentIndex) {
			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;

			// And swap it with the current element.
			temporaryValue = cards[currentIndex];
			cards[currentIndex] = cards[randomIndex];
			cards[randomIndex] = temporaryValue;
		}
		//console.log(this.cards)
	}

	//Dispose the table cards
	dispose() {
		var i; 
		for (i = 0; i < this.table.length; i++) {
			this.dispense.push(this.table[i].serial);
		}
		this.table = [];
		console.log('Disposed cards, new dispense deck: '+this.dispense)
	}

	playCard(player, serial) {
		var index = -1;

		//check if player has the card
		if (player.cards.indexOf(serial) == -1) {
			console.log(player.name + ' attempted to play card [' + serial + '] which she/he does not own');
			console.log('Owned: '+player.cards);
			return null;
		}

		for (var i = 0; i < this.table.length; i++) { 
			if (this.table[i].owner == player.clientId) index = i;
		}

		//if player already has a card on table, return the card to him
		if (index != -1) {
			var card = this.table.splice(index, 1);
			player.cards.push(card[0].serial);
		}

		//put the card on table
		this.table.push(new PlayCard(serial, player));

		//remove card from player hand
		player.cards.splice(player.cards.indexOf(serial), 1);

		//Note game play is successful
		return serial;
	}

	voteCard(player, serial) {
		var i;
		var card;
		var index; 
		var success = false;
		for (i = 0; i < this.table.length; i++) {
			card = this.table[i]; 
			//if player has already voted, remove the vote
			if ((index = card.votes.indexOf(player.clientId)) != -1) {
				card.votes.splice(index, 1);
			}
			if ((card.serial == serial) && (card.owner != player.clientId)) { 
				card.votes.push(player.clientId); 
				success = true;			}
		}
		return success;
	}

	cardsOnTable(player) {
		var i;
		for (i = 0; i < this.table.length; i++) {
			if (this.table[i].owner == player.clientId) return 1;
		}
		return 0;
	}



}

module.exports = Deck;