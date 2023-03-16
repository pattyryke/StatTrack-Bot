const { Client, IntentsBitField, Message, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const bits = new IntentsBitField()

const client = new Client({
    intents: ["Guilds", "MessageContent", "GuildMessages"], partials: ["CHANNEL"],
});

const baseURL = "https://na1.api.riotgames.com/lol/"
const summonerURL = `${baseURL}summoner/v4/summoners/by-name/`
const leaguev4URL = `${baseURL}league/v4/entries/by-summoner/`

const DISCORD_TOKEN = 'MTA4NTU5NDk3MDg1MDg2MTA1Ng.GIf8MI.ijhszw7ETgrsUQld9I9nkDqA4Ojk4-F2aPW5nI';
const RIOT_API_KEY = 'RGAPI-8e8dc7aa-e20d-4e23-aa94-d8bc90cc68b4'; 

const userData = {}

async function getLolSummonerId(summonerName) {
  try {
    const response = await axios.get(`${summonerURL}${summonerName}?api_key=${RIOT_API_KEY}`, {
      responseType: 'json'
    });
    return response.data;
  } catch (error) {
    throw new Error("Error gathering the summoner's encrypted IDs");
  }
}
async function getLolRankedStats(summonerId) {
  try {
    const response = await axios.get(`${leaguev4URL}${summonerId}?api_key=${RIOT_API_KEY}`, {
      responseType: 'json'
    });
    return response.data;
  } catch (error) {
    throw new Error("Error gathering the summoner's ranked stats");
  }
}
async function getLolStats(summonerName) {
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
      throw new Error('No solo queue stats found for this season.');
    }
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

  

  try{
    if (command === 'help') {
      try {
        var commandList = {
          stats: "Shows the specified player's rank, wins, losses, and win-loss ratio in the specified game.\nSyntax: !stats <game> <username>",
          help: "Gives a list of commands that you can use\nSyntax: !help"
        };
        const helpEmbed = new EmbedBuilder()
          .setColor(0xDC143C)
          .setTitle('Command List:')
          .addFields(
            {name: '!stats', value: commandList.stats},
            {name: '!help', value: commandList.help},
          );
        
        message.channel.send({ embeds: [helpEmbed] });
      } catch (error) {
        throw new Error("Error sending !help's embeded message.");
      }
    }

    //SEARCH FOR SOMEONE'S RANKED STATS
    else if (command === 'stats') {

      // Isolate the game and check if blank
      const game = args[0];
      if (game == null || game.length < 1) {throw new Error("Syntax: !stats <game> <username>");}
      else {
        // Isolate the player's name 
        //==== GOING TO HAVE TO ADJUST THIS FOR OW AND VAL TAG#s ====
        const playerName = args.slice(1).join('%20');
        const summonerName = args.slice(1).join(' ');
        if (!playerName) { throw new Error('Please provide a summoner name. \nExample: !stats <game> YoMama'); }

        // If League of legends is selected:
        if (game === 'lol') {
          const stats = await getLolStats(playerName);
  
          try{
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
              throw new Error('Error sending embeded stats.')
          }
        }
      }
    }
  } catch (error) {
    const errorEmbed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle(`Failed...`)
      .addFields(
        {name: 'Invalid input.', value: String(error)},
      );
    message.channel.send({ embeds: [errorEmbed] });
  }
  
});

client.login(DISCORD_TOKEN);

