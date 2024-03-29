import Poker = require("./poker")
import Discord = require("discord.js")
import assert = require('assert')

const client = new Discord.Client()

//VERSION COW
const COMMAND_START = "!"
const GAME_NAMES = ["alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "theta", "iota", "kappa",
    "lambda", "mu", "nu", "xi", "omicron", "pi", "rho", "sigma", "tau", "upsilon", "phi", "chi", "psi", "omega"]
const WAIT_SECONDS = 10
const NUM_EDITS = 4
const JOIN_EMOJI = "✅"

let activeGames: Poker.Game[] = []

function nextAvailableLetter() {
    let activeNames = activeGames.map(game => game.gameChannel.name.toLowerCase().split(" ")[2])

    if (activeNames.length === GAME_NAMES.length)
        return null
    else {
        for (let name of GAME_NAMES) {
            if (!activeNames.includes(name))
                return name
        }
    }
}

function englishList(arr: any[]) {
    switch (arr.length) {
        case 0:
            return ""
        case 1:
            return arr[0].toString()
        case 2:
            return arr[0].toString() + " and " + arr[1].toString()
        default:
            let result = ""

            for (let i = 0; i < arr.length; i++) {
                if (i === arr.length - 1)
                    result += "and " + arr[i].toString()
                else
                    result += arr[i].toString() + ", "
            }

            return result
    }
}

client.on("ready", () => {
    console.log("I am ready!")
})

client.on("message", message => {
    function send(msgText: string) {
        return message.channel.send(msgText).then(msgOrArr => msgOrArr as Discord.Message)
    }
    function isCmd(test: string) {
        return message.content.split(" ")[0] === COMMAND_START + test
    }
    function log() {
        console.log(author.username + "#" + author.discriminator + " ran a command: " + message.content)
    }

    let guild = message.guild
    let channel = message.channel
    let author = message.author

    for (let chan of activeGames.map(game => game.gameChannel)) {
        if (chan.id === channel.id) {
            message.delete().then()
            return
        }
    }

    if (isCmd("ping")) {
        send("Pong!")
        log()
    }
    else if (isCmd("whoami")) {
        send("You are " + author + "!")
        log()
    }
    else if (isCmd("toxic")) {
        send("Are you talking about :radioactive:<@363180361188114434>:radioactive:?")
        log()
    }
    else if (isCmd("car")) {
        send("Are you talking about :blue_car:<@171336809836576768>:blue_car:?")
        log()
    }
    else if (isCmd("hackerman")) {
        send("Are you talking about :desktop_computer:<@168376512272269313>:desktop_computer:?")
        log()
    }
    else if (isCmd("zzz")) {
        send("Is that the sound of :zzz:<@333059265000636418>:zzz:?")
        log()
    }
    else if (isCmd("clown")) {
        send(":clown:<@185080525357056000>:clown: has entered!")
        log()
    }
    else if (isCmd("clear")) {
        if (message.content.split(" ").length !== 2) {
            message.reply("please input a greek letter after `clear`, like this: `!clear alpha`").then()
            return
        }

        let letter = message.content.toLowerCase().split(" ")[1]

        if (!GAME_NAMES.includes(letter)) {
            message.reply("please input a greek letter after `clear`, like this: `!clear alpha`").then()
            return
        }

        let letterCap = letter.charAt(0).toUpperCase() + letter.substring(1)

        let category = guild.channels.find(c =>
            (c.name.toLowerCase().split(" ")[2]) === letter && c instanceof Discord.CategoryChannel) as Discord.CategoryChannel

        if (!category) {
            message.reply("Poker Game " + letterCap + " is not currently active.").then()
            return
        }

        for (let ch of category.children.values()) {
            ch.delete().then()
        }
        category.delete().then()

        message.reply("Poker Game " + letterCap + " has been deleted.").then()
        log()

        for (let i = 0; i < activeGames.length; i++) {
            if (activeGames[i].gameChannel.name.split("-")[0] === letter)
                activeGames.splice(i, 1)
        }
    }
    else if (isCmd("poker")) {
        function pokerMsg(secs: number) {
            let plural = (secs === 1) ? "" : "s"
            return "A new poker game started by " + author + " will begin in " + secs + " second" +
                plural + "! React to this message to play!"
        }

        // message to get people in game
        log()
        send(pokerMsg(WAIT_SECONDS)).then(sent => {
            assert(sent instanceof Discord.Message)
            // get id of this message
            let id = sent.id
            let queryMsg = channel.messages.get(id)

            queryMsg.react(JOIN_EMOJI).then()
            // schedule to edit this message
            for (let i = NUM_EDITS - 1; i > 0; i--) {
                setTimeout(() => {
                    queryMsg.edit(pokerMsg(WAIT_SECONDS / NUM_EDITS * i)).then()
                }, (WAIT_SECONDS - WAIT_SECONDS / NUM_EDITS * i) * 1e3)
            }

            let players: Discord.User[] = []

            // get reactors to this message
            setTimeout(() => {
                // store IDs of reactors to not get duplicates
                let ids = new Set()

                for (let rxn of queryMsg.reactions.values()) {
                    rxn.users.forEach(reactor => {
                        let reactorId = reactor.id.toString()
                        if (!ids.has(reactorId) && reactorId !== client.user.id.toString()) {
                            ids.add(reactorId)
                            players.push(reactor)
                        }
                    })
                }

                if (players.length < 2) {
                    queryMsg.edit("Game cancelled -- not enough players. :cry:").then()
                    queryMsg.clearReactions().then()
                    return
                }

                let letter = nextAvailableLetter()
                let letterCap = letter.charAt(0).toUpperCase() + letter.substring(1)

                // give viewing channel perms to detected players and remove from everyone else
                let overwrites: [{ id: string, allow: number, deny: number }] = [{ id: guild.defaultRole.id, deny: Discord.Permissions.FLAGS.VIEW_CHANNEL, allow: undefined }]
                for (let player of players)
                    overwrites.push({ id: player.id, allow: Discord.Permissions.FLAGS.VIEW_CHANNEL, deny: undefined })

                // channel category creation
                let name = "Poker Game " + letterCap
                guild.createChannel(name, { type: "category", permissionOverwrites: overwrites })
                    .then(category => {

                        console.log("Starting Poker Game Alpha!")

                        // create game channel
                        guild.createChannel(letter + "-game",
                            {
                                type: "text", permissionOverwrites: overwrites,
                                parent: category, position: 1
                            }).then(chan => {

                                assert(chan instanceof Discord.TextChannel)
                                let textChannel = chan as Discord.TextChannel
                                // update original message
                                queryMsg.edit("Game " + letterCap + " has begun! Players: " +
                                    englishList(players) + ". Head to " + chan + " to play!").then()
                                console.log("Created game channel for " + letter + ".")

                                let game = new Poker.Game(client, chan, players)
                                activeGames.push(game)

                                // deal cards
                                game.deal()
                                console.log("Dealt cards for " + letter + ".")

                                textChannel.send("Welcome to " + chan + ". The river is:\n" + game.river.join("\n")).then()

                                // create chat channel
                                guild.createChannel(letter + "-chat",
                                    {
                                        type: "text", permissionOverwrites: overwrites,
                                        parent: category, position: 2
                                    }).then(chat => {
                                        textChannel.send("This is the discussion channel for " + chan + ".")
                                        console.log("Created chat channel for " + letter + ".")
                                    })
                            })

                        // create voice channel
                        guild.createChannel(letter + "-voice",
                            {
                                type: "voice", permissionOverwrites: overwrites,
                                parent: category, position: 3
                            }).then(() =>
                                console.log("Created voice channel for " + letter + ".")
                            )
                    })

            }, WAIT_SECONDS * 1e3)

        })

    }

})

client.login(process.env.BOT_TOKEN).then(msg => {
    alert(msg)
})