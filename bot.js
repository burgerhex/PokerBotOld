const Discord = require("discord.js");
const client = new Discord.Client();

const COMMAND_START = "!";

const GAME_NAMES = ["alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "theta", "iota", "kappa",
    "lambda", "mu", "nu", "xi", "omicron", "pi", "rho", "sigma", "tau", "upsilon", "phi", "chi", "psi", "omega"];

let activeChannels = [];

function nextAvailableLetter() {
    let activeGames = activeChannels.map(chan => chan.name.substring(11));

    if (activeGames.length === GAME_NAMES.length)
        return null;
    else {
        for (let name of GAME_NAMES) {
            if (!activeGames.includes(name))
                return name
        }
    }
}

function englishList(arr) {
    switch (arr.length) {
        case 0:
            return "";
        case 1:
            return arr[0].toString();
        case 2:
            return arr[0].toString() + " and " + arr[1].toString();
        default:
            let result = "";

            for (let i = 0; i < arr.length; i++) {
                if (i === arr.length - 1)
                    result += "and " + arr[i].toString();
                else
                    result += arr[i].toString() + ", ";
            }

            return result;
    }
}

client.on("ready", () => {
    console.log("I am ready!");
});

client.on("message", message => {
    function send(msgText) {
        console.log("Message sent: \"" + msgText + "\"");
        return client.channels.get(message.channel.id).send(msgText);
    }
    function isCmd(test) {
        return message.content === COMMAND_START + test;
    }
    function mention(user) {
        return "<@" + user.id.toString() + ">";
    }

    let guild = message.guild;
    let channel = message.channel;
    let author = message.author;
    let authorMention = mention(author);

    if (isCmd("ping"))
        send("Pong!");

    else if (isCmd("whoami"))
        send(`You are ${authorMention}! `);

    else if (isCmd("toxic"))
        send("Are you talking about :radioactive:<@363180361188114434>:radioactive:?");

    else if (isCmd("poker")) {
        // let greek = GAME_NAMES[NUM_ACTIVE_GAMES];
        // let letter = greek.charAt(0).toUpperCase() + greek.substring(1);
        // NUM_ACTIVE_GAMES++;
        //
        // let name = `Poker Game ${letter}`;
        //
        // let perms = Discord.Permissions(Permissions.FLAGS);
        //
        // guild.createChannel(name, "text").then();
        // guild.createRole({name: name, color: "", permissions: {}}).then();
        // don't use roles, just assign perms to people ^^

        function pokerMsg(secs) {
            let plural = (secs === 1)? "" : "s";
            return "A new Poker game is starting in " + secs + " second" +
                plural + "! React to this message to play!";
        }

        // message to get people in game
        send(pokerMsg(20)).then(sent => {
            message.delete().then();

            // get id of this message
            let id = sent.id;
            let queryMsg = channel.messages.get(id);

            // schedule to edit this message every 5 seconds for 20 seconds
            for (let i = 3; i > 0; i--) {
                setTimeout(() => {
                    queryMsg.edit(pokerMsg(5 * i)).then();
                }, (20 - 5 * i) * 1e3);
            }
            // delete this message in 10 seconds
            queryMsg.delete(20e3).then();

            let players = [];

            // get reactors to this message in 20 seconds
            setTimeout(() => {
                // store IDs of reactors to not get duplicates
                let ids = new Set();

                for (let rxn of queryMsg.reactions.values()) {
                    rxn.users.forEach(reactor => {
                        let reactorId = reactor.id.toString();
                        if (!ids.has(reactorId)) {
                            ids.add(reactorId);
                            players.push(reactor);
                        }
                    });
                }

                console.log("reactors: [" + players.map(u => u.username).join(", ") + "]");
                send("Caught players: " + englishList(players)).then();

                if (!players) {
                    send("Sorry, but there was an error in retrieving players. " +
                        "Try again later. :frowning:").then();
                }
                // channel category retrieval/creation
                let category = guild.channels.find(c =>
                    (c.name.toLowerCase() === "poker games" && c.type === "category"));
                if (!category)
                    guild.createChannel("Poker Games", "category").then(chan => category = chan);

                let letter = nextAvailableLetter();

                let overwrites = [{id: guild.defaultRole.id, deny: Discord.Permissions.FLAGS.VIEW_CHANNEL}];
                for (let player of players) {
                    console.log(player);
                    console.log(player.username);
                    console.log(player.id.toString());
                    overwrites.push({id: player.id, allow: Discord.Permissions.FLAGS.VIEW_CHANNEL})
                }

                guild.createChannel("poker-game-" + letter,
                    {type: "text", permissionOverwrites: overwrites}).then(chan => {
                    chan.setParent(category).then();
                });
                activeChannels.push(letter);

            }, 20e3);

        });


    }
});

client.login(process.env.BOT_TOKEN).then();