class Game {

	constructor(players, deck) {
		this.players = players;
		this.deck = deck;
		this.state = 'NS';
		players.game = this;
		this.story = null;
		this.storySetter = null;
		this.roundOrder = [];
		this.acted = [];
		this.scores = [];
		this.results;
	}

	reset() {
		//reset the deck
		this.deck.reset();
		this.scores = [];
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
			//only deal to registered clientIds and if total cards is less than 6
			if ((p.cards.length < 6 - this.deck.cardsOnTable(p)) && (this.roundOrder.indexOf(p.clientId) != -1)) {
				while (p.cards.length < 6 - this.deck.cardsOnTable(p)) {
					p.cards.push(this.deck.cards.pop());
				}
				p.updateHand();
			}
		}
		console.log('Cars dealt, new deck: '+this.deck.cards);
	}

	register(clientId, player) {
		
		if (this.state != 'NS') this.deal();

		if (this.state == 'VC') player.socket.emit('table', this.getTable());

		if (this.state == 'SR') player.socket.emit('results', this.results);

		if (this.roundOrder.indexOf(clientId) == -1) { 
			this.roundOrder.push(clientId);
			console.log(this.roundOrder);
		}
		
	}

	next() {
		if (this.state == 'NS') { 
			//not starting game with less than 2 registered players
			if (this.players.registeredCount < 2) return;			
			this.setState('ST');
		}
		if (this.state == 'SR') { 
			//not starting game with less than 2 registered players
			if (this.players.registeredCount < 2) return;			
			this.setState('ST');
		}
	}

	roundRobin() {
		if (!this.storySetter) { 
			this.storySetter = this.roundOrder[0]; 
		}
		else {
			var index = this.roundOrder.indexOf(this.storySetter);
			var i = (index < this.roundOrder.length - 1) ? index + 1 : 0;
			this.storySetter = this.roundOrder[i];
		}
		console.log('Storysetter: '+ this.storySetter);
		this.players.update();
	}

	setStory(player, str) {
		if (player.clientId == this.storySetter) {
			this.story = str;
			this.storySetter = player.clientId;
			this.players.io.emit('story', str);
			this.setState('PC');
		}
		else {
			console.log('Wrong player "'+ player.name + '" attempted to tell story');
		}
	}

	playCard(player, serial) {
		if (this.state != 'PC') {
			console.log(player.name + ' attempted to play card ' + serial + ' in state ' + this.state);
			return;
		}
		console.log(player.name + ' plays card ' + serial);
		var i = this.deck.playCard(player, serial);
		console.log(this.deck.table);
		if (i) {
			player.socket.emit('hand', {table:i, hand: player.cards});
			if (this.acted.indexOf(player.clientId) == -1) { 
				this.acted.push(player.clientId);
				this.players.update();
			}
		}
		//console.log(this.acted);
		if (this.allActed) this.setState('VC');
	}

	voteCard(player, serial) {
		if (this.state != 'VC') {
			console.log(player.name + ' attempted to vote card ' + serial + ' in state ' + this.state);
			return;
		}
		//Story setter cannot vote
		if (this.storySetter == player.clientId) return;
		
		console.log(player.name + ' votes card ' + serial);

		if (this.deck.voteCard(player, serial)) {
			if (this.acted.indexOf(player.clientId) == -1) { 
				this.acted.push(player.clientId);
				this.players.update();
			}
		}
		//console.log(this.acted);
		if (this.allActed) this.setState('SR');
	}

	get allActed() {
		var i;
		for (i = 0; i < this.players.items.length; i++) {
			if (this.acted.indexOf(this.players.items[i].clientId) == -1) return false;
		}
		return true;
	}
	
	returnCards(arr) {
		if (Array.isArray(arr)) {
			this.deck.cards = this.deck.cards.concat(arr);
		}
		
	}

	getTable() {
		var arr = [];
		for (var i = 0; i < this.deck.table.length; i++) {
			var card = this.deck.table[i];
			arr.push(card.serial);
		}
		return arr;
	}

	getResults() {
		var i, j;
		
		var allMultiplier = 2;
		var tempScores = [];
		var cards = [];
		for (i = 0; i < this.deck.table.length; i++) {
			var card = this.deck.table[i];
			
			//storyteller card
			if (card.owner == this.storySetter) {
				//check all hits or no hits
				if ((card.votes.length == 0) || (card.votes.length == this.players.items.length - 1)) {
					//nothing happens, everyone else will get 2 (allMutiplier)
					tempScores[this.storySetter] = {fix: 0};
				}
				else {
					//no points for everyone else
					allMultiplier = 0;
					//storyteller gets 3
					tempScores[this.storySetter] = {fix: 3};
					//check who got it right
					for (j = 0; j < card.votes.length; j++) {
						//get 3
						if (!tempScores[card.votes[j]]) tempScores[card.votes[j]] = {fix: 3};
						else tempScores[card.votes[j]].fix = 3;
					}
				}
			}
			else {
				//everyone gets 0 or 2 based on allMultiplier
				if (!tempScores[card.owner]) tempScores[card.owner] = {all: 1};
				else tempScores[card.owner].all = 1;
				tempScores[card.owner].hits = card.votes.length;
			}
			var player = this.players.find('clientId', card.owner);
			var tempcard = {serial: card.serial, owner: player ? player.name : 'Unknown', storyCard: card.owner == this.storySetter, votes:[]};
			for (j = 0; j < card.votes.length; j++) {
				var voter = this.players.find('clientId', card.votes[j]);
				tempcard.votes.push(voter ? voter.name :  'Unknown');
			}
			cards.push(tempcard);
		}

		var scoreTable = [];
		for (var s in tempScores) {
			var st = this.addScore(s, tempScores[s], allMultiplier);
			scoreTable.push({name: st.name, score: st.score}); 
		}

		this.results = {cards: cards, scores: scoreTable};
		this.players.io.emit('results', this.results);
		console.log(this.results);
	}


	addScore(clientId, temp, allMultiplier) {
		var player = this.players.find('clientId', clientId);
		if (this.scores[clientId] === undefined) this.scores[clientId] = {name: player ? player.name : 'Unknown', score: 0};
		if (temp.fix) this.scores[clientId].score += temp.fix;
		if (temp.hits) this.scores[clientId].score += temp.hits;
		if (temp.all) this.scores[clientId].score += temp.all * allMultiplier;
		return this.scores[clientId];
	}

	setState(str) {

		//States: NS (not started), ST (setting story), PC (play cards), VC (vote cards), SR (show results) -> ST
		this.closeState(this.state);
		this.state = str;
		this.initState(str);
		this.players.io.emit('state', this.state);
		console.log('New state: ' + this.state);
	}

	closeState(str) {
		if (str == 'NS') {
			this.reset();
		}
		if (str == 'SR') {
			this.deck.dispose();
		}
	}

	initState(str) {
		if (str == 'PC') {
			this.acted = [];
		}
		if (str == 'ST') {
			this.story = null;
			this.roundRobin();
			this.deal();
		}
		if (str == 'VC') {
			this.acted = [this.storySetter];
			this.deck.shuffle(this.deck.table);
			console.log(this.deck.table);
			this.players.update();
			this.players.io.emit('table', this.getTable());
		}

		if (str == 'SR') {
			console.log(this.deck.table);
			this.getResults();
		}
	}



}

module.exports = Game;