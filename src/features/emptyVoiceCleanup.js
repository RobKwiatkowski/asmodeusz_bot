// Czysci puste kanaly glosowe w kategoriach tymczasowych, takze po restarcie bota.
const { ChannelType } = require('discord.js');
const { config } = require('../config');

const tempCategories = [
  config.voice.standardCategoryId,
  config.voice.otherGamesCategoryId
];

async function cleanupEmptyVoiceChannels(guild) {
  for (const categoryId of tempCategories) {
    const category = guild.channels.cache.get(categoryId);
    if (!category) continue;

    const voiceChannels = category.children.cache.filter(channel => channel.type === ChannelType.GuildVoice);
    for (const channel of voiceChannels.values()) {
      if (channel.id === config.voice.technicalChannelId) continue;
      if (channel.members.size !== 0) continue;

      setTimeout(async () => {
        const fresh = await guild.channels.fetch(channel.id).catch(() => null);
        if (fresh && fresh.members.size === 0) {
          await fresh.delete().catch(error => console.error('[emptyVoiceCleanup] Blad:', error));
        }
      }, 10_000);
    }
  }
}

function setupEmptyVoiceCleanup(client) {
  client.once('clientReady', () => {
    setInterval(() => {
      client.guilds.cache.forEach(guild => cleanupEmptyVoiceChannels(guild));
    }, 60_000);
  });
}

module.exports = {
  setupEmptyVoiceCleanup,
  cleanupEmptyVoiceChannels
};
