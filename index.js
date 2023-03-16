const { Client, IntentsBitField, GatewayIntentBits, Message } = require('discord.js');
const axios = require('axios');

const bits = new IntentsBitField()

const client = new Client({
    intents: ["Guilds", "MessageContent", "GuildMessages"], partials: ["CHANNEL"],
});
const DISCORD_TOKEN = 'MTA4NTU5NDk3MDg1MDg2MTA1Ng.GtBaT6.13LrmCIBPaQmwr9Gxepjkj0mQy_ddr1EfUjVTg';
const RIOT_API_KEY = 'RGAPI-22ee49c4-73b1-486c-9c28-748f6cd9b08f';


const userData = {}

function setUserGameData(userId, properties) {
    userData[userId] = properties;
}

async function getLoLStats(userId, summonerName) {
  const baseURL = "https://na1.api.riotgames.com/lol/"
  const summonerURL = `${baseURL}summoner/v4/summoners/by-name/`
  const leaguev4URL = `${baseURL}league/v4/entries/by-summoner/`
  try {
    var test;
    axios.get(`${summonerURL}${encodeURIComponent(summonerName)}?api_key=${RIOT_API_KEY}`)
        .then(function (response) {
            console.log(response);
        })
        .catch(function (error) {
            console.log(error)
        })
        .finally(function () {
            test = response.id
        })
  } catch {console.log(summonerURL)}
  axios.get(`${baseURL}${leaguev4URL}${test}?api_key=${RIOT_API_KEY}`)
    .then(function (response) {
        console.log(response.data);
        console.log(response.status);
        console.log(response.statusText);
        console.log(response.headers);
        console.log(response.config);
      });
  // Fetch match history or other stats using the accountId
  // You can refer to the Riot Games API documentation to obtain the desired stats
  
  setUserGameData(userId, {
    lol: {
    }
  });
  return (
    console.log(lolStats)
  );
}


client.once('ready', () => {
  console.log('Bot is online!');
});

client.on('messageCreate', async (message) => {
  // Ignore messages from bots
  if (message.author.bot) return;

  // Command handling logic
  const prefix = '!';
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  console.log(args)
  if (command === 'link') {
    const playerName = args.join(' ');
    console.log(playerName)
    if (!playerName) {
      return message.reply('Please provide the summoner name.');
    } else {
        try {
            const userId = message.author
            getLoLStats(playerName)

        } catch {
            message.reply('Failed to gather the players stats.')
        }
    }
  }

  if (command === 'stats') {
    try {
      const stats = await getLoLStats(playerName);

      // Display the stats to the user
      const statsEmbed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(`${playerName}'s League of Legends Stats`)
        .addFields(
          { name: 'Wins', value: stats.wins, inline: true },
          { name: 'Losses', value: stats.losses, inline: true },
          { name: 'Kills', value: stats.kills, inline: true },
        );

        message.channel.send({ embeds: [statsEmbed] });

    } catch (error) {
      console.error(error);
      message.reply('An error occurred while fetching the stats. Please make sure the summoner name is correct.');
    }
  }
});

client.login(DISCORD_TOKEN);

