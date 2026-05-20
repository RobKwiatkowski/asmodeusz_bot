// Podziekowania za boost serwera. Zostawiamy jedna wersje embed, zeby uniknac
// podwojnych wiadomosci za ten sam boost.
const { EmbedBuilder } = require('discord.js');
const { config } = require('../config');

function setupBoostThanks(client) {
  client.on('messageCreate', async message => {
    if (message.channel.id !== config.notifications.boostSystemChannelId) return;
    if (message.type !== 8) return;

    const guild = message.guild;
    if (!guild) return;

    const booster = message.author || message.member?.user;
    const thankChannel = guild.channels.cache.get(config.notifications.thankChannelId);
    if (!booster || !thankChannel) return;

    const embed = new EmbedBuilder()
      .setColor(0xff73fa)
      .setTitle('Dziekujemy za boosta!')
      .setDescription(`<@${booster.id}> wlasnie wzmocnil serwer. Dziekujemy za wsparcie!`)
      .setThumbnail(booster.displayAvatarURL({ dynamic: true, size: 256 }))
      .setTimestamp();

    await thankChannel.send({ embeds: [embed] });
  });
}

module.exports = { setupBoostThanks };
