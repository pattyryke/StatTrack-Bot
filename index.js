const { Client, IntentsBitField, Message, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const bits = new IntentsBitField()

const client = new Client({
    intents: ["Guilds", "MessageContent", "GuildMessages"], partials: ["CHANNEL"],
});
//League
const lolBaseURL = "https://na1.api.riotgames.com/lol/"
const lolSummonerURL = `${lolBaseURL}summoner/v4/summoners/by-name/`
const lolLeaguev4URL = `${lolBaseURL}league/v4/entries/by-summoner/`

//Val
const valBaseURL = "https://api.henrikdev.xyz"
const valAccInfoURL = "/valorant/v1/account/"
const valStatsURL = "/valorant/v2/by-puuid/mmr/na/"

const DISCORD_TOKEN = 'MTA4NTU5NDk3MDg1MDg2MTA1Ng.G82xgQ.aPyT7rjVD9qYBfGaZz1Swbr-3xJhI1fW_2W6Iw';
const RIOT_API_KEY = 'RGAPI-7c7d3192-e79b-419d-ac4a-4ddf2aae81d7'; 
const TRACKER_GG_API = 'ad907fca-da9b-4f33-8d46-18637311b43b';

const userData = {}

async function getLolSummonerId(summonerName) {
  try {
    const response = await axios.get(`${lolSummonerURL}${summonerName}?api_key=${RIOT_API_KEY}`, {
      responseType: 'json'
    });
    return response.data;
  } catch (error) {
    throw new Error("Error gathering the summoner's encrypted IDs");
  }
}
async function getLolRankedStats(summonerId) {
  try {
    const response = await axios.get(`${lolLeaguev4URL}${summonerId}?api_key=${RIOT_API_KEY}`, {
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



async function getValAccInfo(username, tag) {
  try {
    const response = await axios.get(`${valBaseURL}${valAccInfoURL}${username}/${tag}`, {
      responseType: 'json'
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.log(error);
    throw new Error("Error gathering Valorant Account Information.")
  }
}
async function getValRankedStats(valAccId) {
  try {
    const response = await axios.get(`${valBaseURL}${valStatsURL}${valAccId}`, {
      responseType: 'json'
    });
    return response.data;
  } catch (error) {
    throw new Error("Error gathering Valorant Stats.")
  }
}
async function getValStats(username, tag) {
    const accountInfo = await getValAccInfo(username, tag);
    const rankedStats = await getValRankedStats(accountInfo.data.puuid);
    const soloQueueStats = rankedStats.data;
    const highestStats = rankedStats.data.highest_rank;
    const accountImage = accountInfo.data.card;
    const seasonStats = rankedStats.data.by_season.e6a2;

  if(soloQueueStats) {
    const cardImg = accountImage.small;
    const elo = soloQueueStats.current_data.elo;
    const rank = soloQueueStats.current_data.currenttierpatched;
    const highRank = highestStats.patched_tier;
    const highRankSeason = highestStats.season;
    const wins = seasonStats.wins;
    const amountOfGames = seasonStats.number_of_games;
    console.log(seasonStats);

    const winLossRatio = ((wins)/(amountOfGames))*100;
    const losses = (amountOfGames-wins)
    return {
      img: cardImg,
      elo: String(`${elo}`),
      rank: String(`${rank}`),
      highest_rank: (`${highRank} in ${highRankSeason}`),
      wins: String(`${wins}`),
      losses: String(`${losses}`),
      WLRatio: String(`${winLossRatio} %`)
    };
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
        // If Valorant is selected:
        if (game === 'val') {
          try {
            const tag = args[args.length-1];
            if (tag.charAt(0) === '#') {tag = tag.substring(1,tag.length);}
            args.pop();
            const username = encodeURIComponent(args.slice(1).join(' '));
            console.log(username);
            const usernameWithSpace = args.slice(1).join(' ');
            if (!username) { throw new Error('Please provide a summoner name. \nExample: !stats val <username> <tag>'); }
            const valStats = await getValStats(username, tag);
          
            try{
              const valStatsEmbed = new EmbedBuilder()
                .setColor(0xDC143C)
                .setTitle(`${usernameWithSpace}'s Ranked Stats: `)
                .setThumbnail(valStats.img)
                .addFields(
                  { name: 'Rank', value: valStats.rank, inline: true },
                  { name: 'Elo', value: valStats.elo, inline: true },
                  { name: 'Highest Rank', value: valStats.highest_rank, inline: true },
                  { name: '\u200b', value: '\u200b' },
                  { name: 'Wins', value: valStats.wins, inline: true },
                  { name: 'Losses', value: valStats.losses, inline: true },
                  { name: 'W/L Ratio', value: valStats.WLRatio, inline: true},
                );
              message.channel.send({ embeds: [valStatsEmbed] });
            } catch (error) {
              console.log(error);
              throw new Error('Error sending embeded stats.')
            }
          } catch (error) {
            throw new Error(error)
          }
        }
        // If League of legends is selected:
        if (game === 'lol') {
          // Isolate the player's name 
          const playerName = args.slice(1).join('%20');
          const summonerName = args.slice(1).join(' ');
          if (!playerName) { throw new Error('Please provide a summoner name. \nExample: !stats lol YoMama'); }
          const lolStats = await getLolStats(playerName);
  
          try{
            const statsEmbed = new EmbedBuilder()
              .setColor(0xDC143C)
              .setTitle(`${summonerName}'s Ranked Stats: `)
              .addFields(
                { name: 'Rank', value: lolStats.rank, inline: true },
                { name: 'LP', value: lolStats.lp, inline: true },
                { name: '\u200b', value: '\u200b' },
                { name: 'Wins', value: lolStats.wins, inline: true },
                { name: 'Losses', value: lolStats.losses, inline: true },
                { name: 'W/L Ratio', value: lolStats.WLRatio, inline: true},
              );
            message.channel.send({ embeds: [statsEmbed] });
          } catch (error) {
              throw new Error('Error sending embeded stats.')
          }
        }
      }
    }
  } catch (error) {
    console.log(error);
    const errorEmbed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle(`Failed...`)
      .setDescription(`Description: ${String(error)}`);
    message.channel.send({ embeds: [errorEmbed] });
  }
  
});

client.login(DISCORD_TOKEN);

