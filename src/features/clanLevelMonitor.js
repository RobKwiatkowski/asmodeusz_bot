// Monitor poziomu klanu PUBG. Przy awansie wysyła embed na Discorda i POST do WP.
const axios = require('axios');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const { config } = require('../config');
const { readJson, writeJson } = require('../jsonStore');
const { pubgHeaders } = require('../pubgApi');
const { sendClanPromotionToWP } = require('../../klan/wpClanPromotion');

async function fetchClanStats() {
  const response = await axios.get(
    `https://api.pubg.com/shards/${config.pubg.platform}/clans/${config.pubg.clanId}`,
    {
      headers: pubgHeaders(),
      timeout: 10000
    }
  );

  return response.data.data.attributes;
}

function getGeneralChannel(guild) {
  return guild.channels.cache.find(channel =>
    channel.name === config.clan.statsChannelName &&
    channel.isTextBased()
  );
}

async function checkClanLevel(client) {
  try {
    const currentStats = await fetchClanStats();
    const previousStats = readJson(config.files.clanStats, null);

    // pierwsze uruchomienie — tylko zapis
    if (!previousStats || typeof previousStats.clanLevel !== 'number') {
      writeJson(config.files.clanStats, {
        ...currentStats,
        savedAt: new Date().toISOString()
      });
      return;
    }

    // brak awansu
    if (currentStats.clanLevel <= previousStats.clanLevel) return;

    // wysyłka do WordPressa
    await sendClanPromotionToWP(
      previousStats.clanLevel,
      currentStats.clanLevel
    );

    client.guilds.cache.forEach(guild => {
      const channel = getGeneralChannel(guild);
      if (!channel) return;

      const embed = new EmbedBuilder()
        .setColor(0xE74C3C)
        .setAuthor({
          name: `Klan ${currentStats.clanName}`,
          iconURL: 'attachment://clan_logo.png'
        })
        .setTitle('🏴 AWANS KLANU')
        .setDescription(
          'Klan osiągnął nowy poziom. Gratulacje dla aktywnych członków!'
        )
        .addFields(
          {
            name: '🎖️ Nowy poziom',
            value: `**${currentStats.clanLevel}**`,
            inline: true
          },
          {
            name: '👥 Członkowie',
            value: `**${currentStats.clanMemberCount}**`,
            inline: true
          }
        )
        .setThumbnail('attachment://clan_logo.png')
        .setImage('attachment://clan_banner.png')
        .setFooter({
          text: 'PUBG Clan Monitor'
        })
        .setTimestamp();

      channel.send({
        embeds: [embed],
        files: [
          {
            attachment: path.join(__dirname, '../../assets/clan_logo.png'),
            name: 'clan_logo.png'
          },
          {
            attachment: path.join(__dirname, '../../assets/clan_banner.png'),
            name: 'clan_banner.png'
          }
        ]
      }).catch(error => {
        console.error('[clanLevelMonitor] Błąd wysyłki:', error.message);
      });
    });

    // zapis nowego poziomu
    writeJson(config.files.clanStats, {
      ...currentStats,
      savedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error(
      '[clanLevelMonitor] Błąd:',
      error.response?.data || error.message
    );
  }
}

function setupClanLevelMonitor(client) {
  client.once('clientReady', () => {
    checkClanLevel(client);

    setInterval(
      () => checkClanLevel(client),
      config.pubg.clanLevelCheckMs
    );
  });
}

module.exports = {
  setupClanLevelMonitor,
  checkClanLevel
};