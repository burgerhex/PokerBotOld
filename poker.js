const cmb = require("js-combinatorics");

exports.HANDS = {
    HIGH_CARD: 1,
    PAIR: 2,
    TWO_PAIR: 3,
    THREE_KIND: 4,
    STRAIGHT: 5,
    FLUSH: 6,
    FULL_HOUSE: 7,
    FOUR_KIND: 8,
    STRAIGHT_FLUSH: 9,
    ROYAL_FLUSH: 10
};

class Card {
    constructor(value, suit) {
        this.value = value;
        this.suit = suit;
    }

    equals(c) {
        return this.value === c.value && this.suit === c.suit;
    }

    greaterThan(c) {
        let suits = ['d', 'h', 'c', 's'];
        return this.value > c.value ||
            (this.value === c.value && suits.indexOf(this.suit) > suits.indexOf(c.suit));
    }

    toString() {
        let suits = new Map([['d', "Diamonds"], ['h', "Hearts"], ['c', "Clubs"], ['s', "Spades"]]);
        let values = new Map([[1, "Ace"], [2, "Two"], [3, "Three"], [4, "Four"], [5, "Five"], [6, "Six"],
            [7, "Seven"], [8, "Eight"], [9, "Nine"], [10, "Ten"], [11, "Jack"], [12, "Queen"], [13, "King"]]);

        return values.get(this.value) + " of " + suits.get(this.suit);
    }
}

function generateDeck() {
    let deck = [];

    for (let val = 1; val <= 13; val++) {
        for (let suit of ['s', 'c', 'h', 'd']) {
            deck.push(new Card(val, suit));
        }
    }

    return deck;
}

exports.Game = class {
    constructor(client, playersArr, categoryChannel) {
        this.client = client;
        this.players = playersArr;
        this.channel = categoryChannel;
        this.letter = this.channel.name.toLowerCase().split(" ")[2];
        this.deck = generateDeck();
    }

    deal() {
        shuffle(this.deck);
        console.log("players: " + this.players.map(player => player.username));
        console.log("children: " + Array.from(this.channel.children.values()).map(chan => chan.name));
        console.log("deck: " + this.deck.map(c => c.toString()));

        for (let player of this.players) {
            for (let ch of this.channel.children.values()) {
                console.log("checking " + player.username + " against " + ch.name);
                if (ch.name === this.letter + "-" + player.username) {
                    let card1 = this.deck.pop();
                    let card2 = this.deck.pop();

                    this.client.channels.get(ch.id.toString()).send(
                        player + ", your cards are:\n" + card1.toString() + "\n" + card2.toString()
                    ).then();
                }
            }
        }
    }
};

function shuffle(arr) {
    for (let i = 0; i < arr.length; i++) {
        let rand = Math.floor(Math.random() * arr.length);
        swap(arr, i, rand);
    }
}

function swap(arr, i, j) {
    let temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
}

exports.getHand = function(arr) {
    if (arr.length !== 7) {
        console.log("Error: did not receive 7 cards before hand retrieval, aborting");
        return;
    }

    if (isRoyalFlush(arr))
        return HANDS.ROYAL_FLUSH;
    else if (isStraightFlush(arr))
        return HANDS.STRAIGHT_FLUSH;
    else if (isFourKind(arr))
        return HANDS.FOUR_KIND;
    else if (isFullHouse(arr))
        return HANDS.FULL_HOUSE;
    else if (isFlush(arr))
        return HANDS.FLUSH;
    else if (isStraight(arr))
        return HANDS.STRAIGHT;
    else if (isThreeKind(arr))
        return HANDS.THREE_KIND;
    else if (isTwoPair(arr))
        return HANDS.TWO_PAIR;
    else if (isPair(arr))
        return HANDS.PAIR;
};

function appearances(arr) {
    let set = new Set(arr);
    let uniques = [...set];
    let appearances = uniques.map(num => arr.filter(e => e === num).length);

    let map = new Map();
    for (let i = 0; i < uniques.length; i++)
        map.set(uniques[i], appearances[i]);

    return map;
}

function possibleHands(arr) {
    return cmb.combination(arr, 5);
}

function isRoyalFlush (arr) {
    let combos = possibleHands(arr);

    for (let combo of combos) {
        if (isStraight(combo) && isFlush(combo) && isStraight(combo).value === 10)
            return true;
    }

    return false;
}

function isStraightFlush(arr) {
    let combos = possibleHands(arr);

    for (let combo of combos) {
        if (isStraight(arr) && isFlush(arr))
            return true;
    }

    return false;
}

function isFourKind(arr) {
    let combos = possibleHands(arr);

    for (let combo of combos) {
        let values = combo.map(c => c.value);
        let appearances = appearances(values);

        if (Array.from(appearances.values()).includes(4)) {
            return true;
        }
    }

    return false;
}

function isFullHouse(arr) {
    let combos = possibleHands(arr);

    for (let combo of combos) {
        let values = combo.map(c => c.value);
        let appearances = appearances(values);

        if (Array.from(appearances.values()).includes(3) &&
            Array.from(appearances.values()).includes(2)) {
            return true;
        }
    }

    return false;
}

function isFlush(arr) {
    let combos = possibleHands(arr);

    for (let combo of combos) {
        let suits = combo.map(c => c.suit);
        let appearances = appearances(suits);

        if (Array.from(appearances.values()).includes(5))
            return true;
    }

    return false;
}

function isStraight(arr) {
    let combos = possibleHands(arr);

    for (let combo of combos) {
        let values = combo.map(c => c.value);
        let has = (v) => values.includes(v);

        for (let start = 1; start <= 10; start++) {
            let hasAll = true;
            for (let add = 0; add < combo.length; add++)
                hasAll &= has((start + add - 1) % 13 + 1); // weird bc of 10-A straight but it works

            if (hasAll)
                return true;
        }
    }

    return false;
}

function isThreeKind(arr) {
    let combos = possibleHands(arr);

    for (let combo of combos) {
        let values = combo.map(c => c.value);
        let appearances = appearances(values);

        if (Array.from(appearances.values()).includes(3)) {
            return true;
        }
    }

    return false;
}

function isTwoPair(arr) {
    let combos = possibleHands(arr);

    for (let combo of combos) {
        let values = combo.map(c => c.value);
        let appearances = appearances(values);

        if (Array.from(appearances.values()).includes(2) &&
            Array.from(appearances.values()).includes(1)) {
            return true;
        }
    }

    return false;
}

function isPair(arr) {
    let combos = possibleHands(arr);

    for (let combo of combos) {
        let values = combo.map(c => c.value);
        let appearances = appearances(values);

        if (Array.from(appearances.values()).includes(2)) {
            return true;
        }
    }

    return false;
}