import cmb from "js-combinatorics"
import Discord = require("discord.js")

const HANDS = {
    HIGH_CARD: "only a high card", PAIR: "a pair", TWO_PAIR: "two pairs", THREE_KIND: "three of a kind",
    STRAIGHT: "a straight", FLUSH: "a flush", FULL_HOUSE: "a full house", FOUR_KIND: "four of a kind",
    STRAIGHT_FLUSH: "a straight flush", ROYAL_FLUSH: "a royal flush (wow)"
}

class Card {
    public value: number
    public suit: string
    constructor(value: number, suit: string) {
        this.value = value
        this.suit = suit
    }

    toString() {
        // let suits = new Map([['d', "Diamonds"], ['h', "Hearts"], ['c', "Clubs"], ['s', "Spades"]])
        let suits = new Map([['d', ":diamonds:"], ['h', ":hearts:"], ['c', ":clubs:"], ['s', ":spades:"]])
        // let values = new Map([[1, "Ace"], [2, "Two"], [3, "Three"], [4, "Four"], [5, "Five"], [6, "Six"],
        //     [7, "Seven"], [8, "Eight"], [9, "Nine"], [10, "Ten"], [11, "Jack"], [12, "Queen"], [13, "King"]])
        let values = new Map([[1, "A"], [11, "J"], [12, "Q"], [13, "K"]])

        let val = this.value
        return val === 1 || val > 10 ? values.get(val) : val + " of " + suits.get(this.suit)
    }
}

export function generateDeck() {
    let deck: Card[] = []

    for (let val = 1; val <= 13; val++) {
        for (let suit of ['s', 'c', 'h', 'd']) {
            deck.push(new Card(val, suit))
        }
    }

    return deck
}

export class Game {
    private client: Discord.Client
    public gameChannel: Discord.GuildChannel
    private players: Discord.User[]
    private cards: Map<string, Card[]>
    public river: Card[]
    private deck: Card[]
    constructor(client: Discord.Client, gameChannel: Discord.GuildChannel, playersArr: Discord.User[]) {
        this.client = client
        this.gameChannel = gameChannel
        // this.letter = gameChannel.name.split("-")[0]
        this.players = playersArr
        this.cards = new Map<string, Card[]>()
        this.river = new Array<Card>()
        this.deck = exports.generateDeck()
        shuffle(this.deck)
    }

    deal() {
        console.log("Starting deal.")
        console.log("Players: " + this.players.map(p => p.username))

        for (let i = 0; i < 5; i++)
            this.river.push(this.deck.pop())

        for (let player of this.players) {
            let card1 = this.deck.pop()
            let card2 = this.deck.pop()
            this.cards.set(player.id, [card1, card2])

            this.client.users.get(player.id).send(
                "Your cards for " + this.gameChannel + " are:\n" + card1.toString() + "\n" + card2.toString() + "\n" +
                "This hand has " + exports.getHand([card1, card2].concat(this.river)) + "."
            ).then()
        }
    }
}

function shuffle<T>(arr: T[]) {
    for (let i = 0; i < arr.length; i++) {
        let rand = Math.floor(Math.random() * arr.length)
        swap(arr, i, rand)
    }
}

function swap<T>(arr: T[], i: number, j: number) {
    let temp = arr[i]
    arr[i] = arr[j]
    arr[j] = temp
}

export function getHand(arr: Card[]) {
    if (isRoyalFlush(arr))
        return HANDS.ROYAL_FLUSH
    else if (isStraightFlush(arr))
        return HANDS.STRAIGHT_FLUSH
    else if (isFourKind(arr))
        return HANDS.FOUR_KIND
    else if (isFullHouse(arr))
        return HANDS.FULL_HOUSE
    else if (isFlush(arr))
        return HANDS.FLUSH
    else if (isStraight(arr))
        return HANDS.STRAIGHT
    else if (isThreeKind(arr))
        return HANDS.THREE_KIND
    else if (isTwoPair(arr))
        return HANDS.TWO_PAIR
    else if (isPair(arr))
        return HANDS.PAIR
    else
        return HANDS.HIGH_CARD
}

function appearances(cards: Card[], mode: string /* s for suits, v for values */) {
    let nums = cards.map(c => (mode === "s") ? c.suit : c.value)
    let set = new Set(nums)
    let uniques = [...set]
    return uniques.map(num => nums.filter(e => e === num).length)
}

function possibleHands(arr: Card[]) {
    return cmb.combination(arr, 5).toArray()
}

function isRoyalFlush(arr: Card[]) {
    for (let combo of possibleHands(arr)) {
        let values = combo.map(c => c.value)

        // royal flush is the only straight that has both ace and king
        if (isStraight(combo) && isFlush(combo) && values.includes(1) && values.includes(13))
            return true
    }

    return false
}

function isStraightFlush(arr: Card[]) {
    for (let combo of possibleHands(arr)) {
        if (isStraight(combo) && isFlush(combo))
            return true
    }

    return false
}

function isFourKind(arr: Card[]) {
    let app = appearances(arr, "v")
    return app.includes(4)
}

function isFullHouse(arr: Card[]) {
    for (let combo of possibleHands(arr)) {
        let app = appearances(combo, "v")

        if (app.includes(3) && app.includes(2))
            return true
    }

    return false
}

function isFlush(arr: Card[]) {
    let app = appearances(arr, "s")
    return app.includes(5)
}

// probably simplifiable
function isStraight(arr: Card[]) {
    out:
    for (let combo of possibleHands(arr)) {
        let values = combo.map(c => c.value)
        values.sort()

        // must check 10-A straight manually
        if ([1, 10, 11, 12, 13].every(v => values.includes(v)))
            return true

        for (let i = 0; i < values.length - 1; i++) {
            if (values[i] + 1 !== values[i + 1])
                continue out
        }

        return true
    }

    return false
}

function isThreeKind(arr: Card[]) {
    let app = appearances(arr, "v")
    return app.includes(3)
}

// maybe can be simplified?
function isTwoPair(arr: Card[]) {
    for (let combo of possibleHands(arr)) {
        let app = appearances(combo, "v")

        if (app.includes(2) && app.includes(1)) {
            return true
        }
    }

    return false
}

function isPair(arr: Card[]) {
    let app = appearances(arr, "v")
    return app.includes(2)
}