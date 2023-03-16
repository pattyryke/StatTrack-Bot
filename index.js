const { Client, IntentsBitField, Message, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const bits = new IntentsBitField()

const client = new Client({
    intents: ["Guilds", "MessageContent", "GuildMessages"], partials: ["CHANNEL"],
});

const baseURL = "https://na1.api.riotgames.com/lol/"
const summonerURL = `${baseURL}summoner/v4/summoners/by-name/`
const leaguev4URL = `${baseURL}league/v4/entries/by-summoner/`

const DISCORD_TOKEN = 'MTA4NTU5NDk3MDg1MDg2MTA1Ng.GtBaT6.13LrmCIBPaQmwr9Gxepjkj0mQy_ddr1EfUjVTg';
const RIOT_API_KEY = 'RGAPI-222bd06e-c114-48bd-b53e-c820fe0240e0';

const userData = {}

async function getLolSummonerId(summonerName) {
  try {
    const response = await axios.get(`${summonerURL}${summonerName}?api_key=${RIOT_API_KEY}`, {
      responseType: 'json'
    });
    return response.data;
  } catch (error) {
    console.log(error);
  }
}
async function getLolRankedStats(summonerId) {
  try {
    const response = await axios.get(`${leaguev4URL}${summonerId}?api_key=${RIOT_API_KEY}`, {
      responseType: 'json'
    });
    return response.data;
  } catch (error) {
    console.log(error);
  }
}
async function getLolStats(summonerName) {
  try {
    const summoner = await getLolSummonerId(summonerName);
    const rankedStats = await getLolRankedStats(summoner.id);

    const soloQueueStats = rankedStats.find(stat => stat.queueType === 'RANKED_SOLO_5x5');
    if(soloQueueStats) {
      const winLossRatio = (soloQueueStats.wins/(soloQueueStats.wins+soloQueueStats.losses))*100;
      return {
        rank: String(`${soloQueueStats.tier} ${soloQueueStats.rank}`),
        lp: String(soloQueueStats.leaguePoints),
        wins: String(soloQueueStats.wins),
        losses: String(soloQueueStats.losses),
        WLRatio: String(`${winLossRatio} %`)
      };
    } else {
      throw new Error('Solo queue stats not found');
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

function setUserGameData(userId, properties) {
    userData[userId] = properties;
}



client.once('ready', () => {
  console.log('Bot is online!');
});

client.on('messageCreate', async (message) => {
  // Ignore messages from bots
  if (message.author.bot) return;

  // Command handling logic
  const prefix = '!';
  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const command = args.shift().toLowerCase();

  if (command === 'stats') {

    const playerName = args.join('%20');
    const summonerName = args.join(' ');
    if (!playerName) {
      return message.reply('Please provide the summoner name.');
    } else {
        try {
          const userId = message.author;
          const stats = await getLolStats(playerName);


          const statsEmbed = new EmbedBuilder()
            .setColor(0xDC143C)
            .setTitle(`${summonerName}'s Ranked Stats: `)
            .addFields(
              { name: 'Rank', value: stats.rank, inline: true },
              { name: 'LP', value: stats.lp, inline: true },
              { name: '\u200b', value: '\u200b' },
              { name: 'Wins', value: stats.wins, inline: true },
              { name: 'Losses', value: stats.losses, inline: true },
              { name: 'W/L Ratio', value: stats.WLRatio, inline: true},
            );
          message.channel.send({ embeds: [statsEmbed] });
        } catch (error) {
            console.log(error);
            message.reply('Failed to gather the players stats.');
        }
    }
  }

  if (command === 'link') {
    try {
      const userId = message.author.id;
      const stats = await getLolSummonerId(playerName);

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

