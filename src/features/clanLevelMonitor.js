// Monitor poziomu klanu PUBG. Przy awansie wysyla embed na Discorda i POST do WP.
const axios = require('axios');
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
    channel.name === config.clan.statsChannelName && channel.isTextBased()
  );
}

async function checkClanLevel(client) {
  try {
    const currentStats = await fetchClanStats();
    const previousStats = readJson(config.files.clanStats, null);

    if (!previousStats || typeof previousStats.clanLevel !== 'number') {
      writeJson(config.files.clanStats, { ...currentStats, savedAt: new Date().toISOString() });
      return;
    }

    if (currentStats.clanLevel <= previousStats.clanLevel) return;

    await sendClanPromotionToWP(previousStats.clanLevel, currentStats.clanLevel);

    client.guilds.cache.forEach(guild => {
      const channel = getGeneralChannel(guild);
      if (!channel) return;

      const embed = new EmbedBuilder()
        .setColor(0xE74C3C)
        .setTitle('AWANS KLANU')
        .setDescription('Klan osiagnal nowy poziom. Gratulacje dla aktywnych czlonkow!')
        .addFields(
          { name: 'Nowy poziom', value: `**${currentStats.clanLevel}**`, inline: true },
          { name: 'Czlonkowie', value: `**${currentStats.clanMemberCount}**`, inline: true }
        )
        .setFooter({ text: 'PUBG Clan Monitor' })
        .setTimestamp();

      channel.send({ embeds: [embed] }).catch(() => {});
    });

    writeJson(config.files.clanStats, { ...currentStats, savedAt: new Date().toISOString() });
  } catch (error) {
    console.error('[clanLevelMonitor] Blad:', error.response?.data || error.message);
  }
}

function setupClanLevelMonitor(client) {
  client.once('ready', () => {
    checkClanLevel(client);
    setInterval(() => checkClanLevel(client), config.pubg.clanLevelCheckMs);
  });
}

module.exports = {
  setupClanLevelMonitor,
  checkClanLevel
};
