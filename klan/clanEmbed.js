// Buduje embed z lista czlonkow klanu pogrupowana wedlug roli klanowej.
const { EmbedBuilder } = require('discord.js');
const { getMembers } = require('./clanStore');

// 🔁 dzieli tablicę na N kolumn (równomiernie)
function chunkArray(array, parts) {
  const result = Array.from({ length: parts }, () => []);
  array.forEach((item, index) => {
    result[index % parts].push(item);
  });
  return result;
}

function createClanEmbed() {
  const members = getMembers();

  const founder = members.filter(m => m.roleClan === 'Założyciel');
  const managers = members.filter(m => m.roleClan === 'Kierownik');
  const regulars = members.filter(m => m.roleClan === 'Członek');

  const embed = new EmbedBuilder()
    .setTitle('🔥 Pełny skład klanu DEVS')
    .setColor('#c40000')
    // ⬇️ LOGO W PRAWYM GÓRNYM ROGU
    .setThumbnail('https://nationaldevils.eu/wp-content/uploads/2026/02/logo-klan-1.png')
    .setTimestamp();

  // 👑 ZAŁOŻYCIEL
  embed.addFields({
    name: '👑 Założyciel',
    value: founder.length
      ? founder.map(m => `**${m.username}**`).join('\n')
      : '—',
    inline: false
  });

  // ⭐ KIEROWNICY – 3 KOLUMNY
  const managerChunks = chunkArray(managers, 3);
  managerChunks.forEach((chunk, index) => {
    embed.addFields({
      name: index === 0 ? '⭐ Kierownicy' : '\u200b',
      value: chunk.length
        ? chunk.map(m => `• **${m.username}**`).join('\n')
        : '—',
      inline: true
    });
  });

  // 👤 CZŁONKOWIE – 3 KOLUMNY
  const memberChunks = chunkArray(regulars, 3);
  memberChunks.forEach((chunk, index) => {
    embed.addFields({
      name: index === 0 ? '👤 Członkowie' : '\u200b',
      value: chunk.length
        ? chunk.map(m => `• ${m.username}`).join('\n')
        : '—',
      inline: true
    });
  });

  embed.setFooter({
    text: `Łącznie: ${members.length} członków`
  });

  return embed;
}

module.exports = { createClanEmbed };
