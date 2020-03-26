class Deck {


	constructor() {
		
		this.reset();
	}

	reset() {
		const deckSize = 84;
		this.cards = [];
		for (var i = 0; i < deckSize; i++) {
			this.cards.push(i+1);
		}
		this.dispense = [];
		this.shuffle();
	}

	shuffle() {
		var currentIndex = this.cards.length;
		var temporaryValue, randomIndex;

		// While there remain elements to shuffle...
		while (0 !== currentIndex) {
			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;

			// And swap it with the current element.
			temporaryValue = this.cards[currentIndex];
			this.cards[currentIndex] = this.cards[randomIndex];
			this.cards[randomIndex] = temporaryValue;
		}
		//console.log(this.cards);

	}


}

module.exports = Deck;