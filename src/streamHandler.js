const ytutil = require("../util/youtubeHandler.js");
const ytdl   = require("ytdl-core");
const buffer = require("buffered2").BufferedStream;

exports.play = async function play(guild, client) {
	if (!client.guilds.get(guild.id) ||	!client.voiceConnections.get(guild.id) || client.voiceConnections.get(guild.id).playing || client.voiceConnections.get(guild.id).paused) return;

	if (guild.queue.length === 0) {
		if (client.voiceConnections.get(guild.id) && client.voiceConnections.get(guild.id).channelID) client.leaveVoiceChannel(guild.id);
		return client.getChannel(guild.msgc).createMessage({ embed: {
			color: config.options.embedColour,
			title: "Queue concluded!",
			description: "[Enjoying the music? Help keep JukeBot alive!](https://patreon.com/crimsonxv)",
			footer: {
				text: "Becoming a patron will also bag you some nice benefits!"
			}
		}});
	}

	let song;

	if (guild.queue[0].src === "youtube") {
		let duration = await ytutil.getDuration(guild.queue[0].id);
		if (duration > 3700 && !permissions.isDonator(guild.queue[0].req) || duration > 7300 && permissions.isDonator(guild.queue[0].req)) {
			guild.queue.shift();
			exports.play(guild, client);
			client.getChannel(guild.msgc).createMessage({ embed: {
				color: config.options.embedColour,
				title: "This song exceeds the duration limit"
			}});
		} else {
			guild.queue[0].duration = duration;
		}

		var res = await ytutil.getFormats(guild.queue[0].id);
		if (!res.url) {
			guild.queue.shift();
			exports.play(guild, client);
			client.getChannel(guild.msgc).createMessage({ embed: {
				color: config.options.embedColour,
				title: "This song is unplayable"
			}});
		} else {
			song = new buffer();
			ytdl(guild.queue[0].id, { filter: "audioonly" }).pipe(song);
		}
	} else {
		song = guild.queue[0].id
	}

	client.getChannel(guild.msgc).createMessage({embed: {
		color: config.options.embedColour,
		title: "Now Playing",
		description: `${guild.queue[0].title}` //(https://youtu.be/${guild.queue[0].id})`
	}});

	client.voiceConnections.get(guild.id).play(res ? res.url : guild.queue[0].id);

	client.voiceConnections.get(guild.id).once("end", () => {
		if (guild.repeat === "All") guild.queue.push(guild.queue[0]);
		if (guild.repeat !== "Current") guild.queue.shift();
		guild.svotes = [];
		exports.play(guild, client);
	});

};
