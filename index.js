const { Client, IntentsBitField, Message, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();
console.log(process.env.discord_api_key);


const bits = new IntentsBitField()

const client = new Client({
    intents: ["Guilds", "MessageContent", "GuildMessages"], partials: ["CHANNEL"],
});
// League API link
const lolBaseURL = "https://na1.api.riotgames.com/lol/"
const lolSummonerURL = `${lolBaseURL}summoner/v4/summoners/by-name/`
const lolLeaguev4URL = `${lolBaseURL}league/v4/entries/by-summoner/`

// Val API link
const valBaseURL = "https://api.henrikdev.xyz"
const valAccInfoURL = "/valorant/v1/account/"
const valStatsURL = "/valorant/v2/by-puuid/mmr/na/"

// OW API link
const owBaseURL = "https://overfast-api.tekrop.fr/"
const owAccInfoURL = "/players/"
//const owStatsURL = "/valorant/v2/by-puuid/mmr/na/"

// Secure API Key
const DISCORD_TOKEN = process.env.discord_api_key;
const RIOT_API_KEY = process.env.riot_api_key; 



// Gathering League of Legends data
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
      const winLossRatio = String((soloQueueStats.wins/(soloQueueStats.wins+soloQueueStats.losses))*100);
      return {
        rank: String(`${soloQueueStats.tier} ${soloQueueStats.rank}`),
        lp: String(soloQueueStats.leaguePoints),
        wins: String(soloQueueStats.wins),
        losses: String(soloQueueStats.losses),
        WLRatio: String(`${winLossRatio.substring(0,5)} %`)
      };
    } else {
      throw new Error('No solo queue stats found for this season.');
    }
}


// Gathering Valorant data
async function getValAccInfo(username, tag) {
  try {
    const response = await axios.get(`${valBaseURL}${valAccInfoURL}${username}/${tag}`, {
      responseType: 'json'
    });
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

    const winLossRatio = String(((wins)/(amountOfGames))*100);
    const losses = (amountOfGames-wins)
    return {
      img: cardImg,
      elo: String(`${elo}`),
      rank: String(`${rank}`),
      highest_rank: (`${highRank} in ${highRankSeason}`),
      wins: String(`${wins}`),
      losses: String(`${losses}`),
      WLRatio: String(`${winLossRatio.substring(0,5)} %`)
    };
  }
}

// Gathering Overwatch data
async function getOWAccInfo(battletag) {
  try {
    const response = await axios.get(`${owBaseURL}${owAccInfoURL}${battletag}/stats/summary`, {
      params: {
        gamemode: "competitive"
      },
      responseType: 'json'
    });
    return response.data;
  } catch (error) {
    throw new Error("Error gathering Overwatch Account Information.")
  }
}
async function getOWPicture(battletag) {
  try {
    const response = await axios.get(`${owBaseURL}${owAccInfoURL}${battletag}/summary`, {
      responseType: 'json'
    });
    return response.data.avatar;
  } catch {
    throw new Error("Error gathering Overwatch Account Thumbnail.")
  }
}
async function getOWStats(battletag) {
  function Playtime_SecToHour(secs) {
    const mins = Math.floor(secs/60);
    const hrs = Math.floor(mins/60);
    const remainingMins = mins%60;
    const remainingSecs = secs%60;
    return `\n${hrs} hr(s)\n${remainingMins} min(s)\n${remainingSecs} sec(s)`
  }  
  
  
  const owStats = await getOWAccInfo(battletag);
  const owPhoto = await getOWPicture(battletag);


  if(owStats) {
    const owGeneral = owStats.general;
    const owTotal = owStats.general.total;
    const owAve = owStats.general.average;
    const owTank = owStats.roles.tank;
    const owSupp = owStats.roles.support;
    const owDmg = owStats.roles.damage;


    var total1 = String(owGeneral.games_played);
    var total2 = String(Playtime_SecToHour(owGeneral.time_played));
    var total3 = String(owGeneral.winrate);
    var total4 = String(owGeneral.kda);
    
    var totalK = String(owTotal.eliminations);
    var totalA = String(owTotal.assists);
    var totalD = String(owTotal.deaths);
    var totalDmg = String(owTotal.damage);
    var totalHeal = String(owTotal.healing);
    
    if (owTank) {
      var tank1 = String(owTank.games_played);
      var tank2 = String(Playtime_SecToHour(owTank.time_played));
      var tank3 = String(owTank.winrate);
      var tank4 = String(owTank.kda);
    } else {var tank1,tank2,tank3,tank4 = "0"}

    if (owDmg) {
      var dmg1 = String(owDmg.games_played);
      var dmg2 = String(Playtime_SecToHour(owDmg.time_played));
      var dmg3 = String(owDmg.winrate);
      var dmg4 = String(owDmg.kda);
    } else {var dmg1,dmg2,dmg3,dmg4 = "0"}

    if (owSupp) {
      var supp1 = String(owSupp.games_played);
      var supp2 = String(Playtime_SecToHour(owSupp.time_played));
      var supp3 = String(owSupp.winrate);
      var supp4 = String(owSupp.kda);
    } else {var supp1,supp2,supp3,supp4 = "0"}

    return {
      img: owPhoto,

      totalGames: String(total1),
      totalTime: String(total2),
      totalWinrate: String(total3),
      totalKDA: String(total4),
    
      totalKill: String(totalK),
      totalAssist: String(totalA),
      totalDeath: String(totalD),
      totalDmg: String(totalDmg),
      totalHeal: String(totalHeal),

      tankGames: String(tank1),
      tankTime: String(tank2),
      tankWinrate: String(tank3),
      tankKDA: String(tank4),

      dmgGames: String(dmg1),
      dmgTime: String(dmg2),
      dmgWinrate: String(dmg3),
      dmgKDA: String(dmg4),

      suppGames: String(supp1),
      suppTime: String(supp2),
      suppWinrate: String(supp3),
      suppKDA: String(supp4)
    };
  }
}


// Discord bot
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
          stats: "Shows the specified player's rank, wins, losses, and win-loss ratio in the specified game.\nSyntax: !stats <game> <username> (if needed <tag>)\nExamples:\n*!stats lol summoner_name\n!stats val username tag\n!stats ow username #tagnumber*",
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
                { name: '__***Rank***__', value: valStats.rank, inline: true },
                { name: '__***Elo***__', value: valStats.elo, inline: true },
                { name: '__***Highest Rank***__', value: valStats.highest_rank, inline: true },
                { name: '\u200b', value: '\u200b' },
                { name: '__***Wins***__', value: valStats.wins, inline: true },
                { name: '__***Losses***__', value: valStats.losses, inline: true },
                { name: '__***W/L Ratio***__', value: valStats.WLRatio, inline: true},
              );
            message.channel.send({ embeds: [valStatsEmbed] });
          } catch (error) {
            console.log(error);
            throw new Error('Error sending embeded stats.')
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
                { name: '__***Rank***__', value: lolStats.rank, inline: true },
                { name: '__***LP***__', value: lolStats.lp, inline: true },
                { name: '\u200b', value: '\u200b' },
                { name: '__***Wins***__', value: lolStats.wins, inline: true },
                { name: '__***Losses***__', value: lolStats.losses, inline: true },
                { name: '__***W/L Ratio***__', value: lolStats.WLRatio, inline: true},
              );
            message.channel.send({ embeds: [statsEmbed] });
          } catch (error) {
              throw new Error('Error sending embeded stats.')
          }
        }
        // If Overwatch is selected:
        if (game === 'ow') {

          const usernameWithSpace = args.slice(1).join(' ');
          const battletag = usernameWithSpace.replace(' #', '-');
          console.log(battletag);
          if (!battletag) { throw new Error('Please provide a summoner name. \nExample: !stats val <username> <tag>'); }
          const owStats = await getOWStats(battletag);
        
          try{
            const owStatsEmbed = new EmbedBuilder()
              .setColor(0xDC143C)
              .setTitle(`${usernameWithSpace}'s Ranked Stats: `)
              .setThumbnail(owStats.img)
              .addFields(
                { name: '__***Total Game Stats***__', value: 
                `*Total Games:* ${owStats.totalGames}\n
                *Total Playtime:* ${owStats.totalTime}\n
                *Total Winrate:* ${owStats.totalWinrate}\n
                *Total KDA:* ${owStats.totalKDA}`, inline: true},

                { name: '__***Total Specific Stats***__', value: 
                `*Total Kills:* ${owStats.totalKill}\n
                *Total Assists:* ${owStats.totalAssist}\n
                *Total Deaths:* ${owStats.totalDeath}\n
                *Total Damage:* ${owStats.totalDmg}\n
                *Total Healing:* ${owStats.totalHeal}`, inline: true},
                { name: '\u200b', value: '\u200b' },
              )
            if (owStats.tankKDA !== undefined){
              owStatsEmbed.addFields(
                { name: '__***Tank Stats:***__', value: 
                `*Total Games:* ${owStats.tankGames}\n
                *Total Playtime:* ${owStats.tankTime}\n
                *Total Winrate:* ${owStats.tankWinrate}\n
                *Total KDA:* ${owStats.tankKDA}`, inline: true},
              )}
            if (owStats.suppKDA !== undefined){
              owStatsEmbed.addFields(
                { name: '__***Support Stats:***__', value: 
                `*Total Games:* ${owStats.suppGames}\n
                *Total Playtime:* ${owStats.suppTime}\n
                *Total Winrate:* ${owStats.suppWinrate}\n
                *Total KDA:* ${owStats.suppKDA}`, inline: true},
            )}
            if (owStats.dps !== undefined){
              owStatsEmbed.addFields(
                { name: '__***DPS Stats:***__', value: 
                `*Total Games:* ${owStats.dmgGames}\n
                *Total Playtime:* ${owStats.dmgTime}\n
                *Total Winrate:* ${owStats.dmgWinrate}\n
                *Total KDA:* ${owStats.dmgKDA}`, inline: true},
              )}
            message.channel.send({ embeds: [owStatsEmbed] });
          } catch (error) {
            console.log(error);
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

