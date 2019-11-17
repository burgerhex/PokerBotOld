const Discord = require("discord.js");
const client = new Discord.Client();

const COMMAND_START = "!";
const GAME_NAMES = ["alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "theta", "iota", "kappa",
    "lambda", "mu", "nu", "xi", "omicron", "pi", "rho", "sigma", "tau", "upsilon", "phi", "chi", "psi", "omega"];
const WAIT_SECONDS = 15;
const NUM_EDITS = 6;
const JOIN_EMOJI = "✅";

let activeChannels = [];

function nextAvailableLetter() {
    let activeNames = activeChannels.map(chan => chan.name.substring(11).toLowerCase());

    if (activeNames.length === GAME_NAMES.length)
        return null;
    else {
        for (let name of GAME_NAMES) {
            if (!activeNames.includes(name))
                return name;
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
        return message.content.split(" ")[0] === COMMAND_START + test;
    }

    let guild = message.guild;
    let channel = message.channel;
    let author = message.author;

    if (isCmd("ping")) {
        send("Pong!");
    }
    else if (isCmd("whoami")) {
        send("You are " + author + "!");
    }
    else if (isCmd("toxic")) {
        send("Are you talking about :radioactive:<@363180361188114434>:radioactive:?");
    }
    else if (isCmd("car")) {
        send("Are you talking about :blue_car:<@171336809836576768>:blue_car:?");
    }
    else if (isCmd("zzz")) {
        send("Is that the sound of :zzz:<@333059265000636418>:zzz:?");
    }
    else if (isCmd("clown")) {
        send(":clown:<@185080525357056000>:clown: has entered!");
    }
    else if (isCmd("clear")) {
        if (message.content.split(" ").length !== 2) {
            message.reply("please input a greek letter after `clear`, like this: `!clear alpha`").then();
            return;
        }

        let letter = message.content.toLowerCase().split(" ")[1];

        if (!GAME_NAMES.includes(letter)) {
            message.reply("please input a greek letter after `clear`, like this: `!clear alpha`").then();
            return;
        }

        let letterCap = letter.charAt(0).toUpperCase() + letter.substring(1);

        let category = guild.channels.find(c =>
            (c.name.toLowerCase().split(" ")[2]) === letter && c.type === "category");

        if (!category) {
            message.reply("Poker Game " + letterCap + " is not currently active.").then();
            return;
        }

        for (let ch of category.children.values()) {
            ch.delete().then();
        }
        category.delete().then();

        message.reply("Poker Game " + letterCap + " has been deleted.").then();

        for (let i = 0; i < activeChannels.length; i++) {
            if (activeChannels[i].name.toLowerCase().split(" ")[2] === letter)
                activeChannels.splice(i,1);
        }
    }
    else if (isCmd("poker")) {
        function pokerMsg(secs) {
            let plural = (secs === 1)? "" : "s";
            return "A new poker game started by " + author + " will begin in " + secs + " second" +
                plural + "! React to this message to play!";
        }

        // message to get people in game
        send(pokerMsg(WAIT_SECONDS)).then(sent => {
            message.delete().then();

            // get id of this message
            let id = sent.id;
            let queryMsg = channel.messages.get(id);

            queryMsg.react(JOIN_EMOJI).then();
            // schedule to edit this message
            for (let i = NUM_EDITS - 1; i > 0; i--) {
                setTimeout(() => {
                    queryMsg.edit(pokerMsg(WAIT_SECONDS / NUM_EDITS * i)).then();
                }, (WAIT_SECONDS - WAIT_SECONDS / NUM_EDITS * i) * 1e3);
            }

            let players = [];

            // get reactors to this message
            setTimeout(() => {
                // store IDs of reactors to not get duplicates
                let ids = new Set();

                for (let rxn of queryMsg.reactions.values()) {
                    rxn.users.forEach(reactor => {
                        let reactorId = reactor.id.toString();
                        if (!ids.has(reactorId) && reactorId !== client.user.id.toString()) {
                            ids.add(reactorId);
                            players.push(reactor);
                        }
                    });
                }

                if (players.length < 2) {
                    queryMsg.edit("Game cancelled -- not enough players. :cry:").then();
                    queryMsg.clearReactions().then();
                    return;
                }

                let letter = nextAvailableLetter();
                let letterCap = letter.charAt(0).toUpperCase() + letter.substring(1);

                // give viewing channel perms to detected players and remove from everyone else
                let overwrites = [{id: guild.defaultRole.id, deny: Discord.Permissions.FLAGS.VIEW_CHANNEL}];
                for (let player of players)
                    overwrites.push({id: player.id, allow: Discord.Permissions.FLAGS.VIEW_CHANNEL});

                // channel category creation
                let name = "Poker Game " + letterCap;
                guild.createChannel(name,{type: "category", permissionOverwrites: overwrites})
                    .then(category => {
                        activeChannels.push(category);

                        // create game and chat channels
                        guild.createChannel(letter + "-game",
                            {type: "text", permissionOverwrites: overwrites,
                                parent: category, position: 1}).then(chan => {
                            queryMsg.edit(`Game ${letterCap} has begun! Players: ` + englishList(players) +
                                ". Head to " + chan + " to play!").then();

                            guild.createChannel(letter + "-chat",
                                {type: "text", permissionOverwrites: overwrites,
                                    parent: category, position: 2}).then(chat => {
                                client.channels.get(chat.id.toString())
                                    .send("This is the discussion channel for " + chan + ".");
                            });
                        });

                        // create player-specific channels
                        for (let player of players) {
                            guild.createChannel(letter + "-" + player.username,
                                {
                                    type: "text",
                                    permissionOverwrites: [
                                        {id: guild.defaultRole.id, deny: Discord.Permissions.FLAGS.VIEW_CHANNEL},
                                        {id: player.id, allow: Discord.Permissions.FLAGS.VIEW_CHANNEL}
                                    ],
                                    parent: category
                                }).then(chan => {
                                client.channels.get(chan.id.toString()).send(player + ", this is your channel.").then();
                            });
                        }
                    });

            }, WAIT_SECONDS * 1e3);

        });

    }

});

client.login(process.env.BOT_TOKEN).then();