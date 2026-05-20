// Autorola dla nowych czlonkow serwera.
const { config } = require('../config');
const { logToFile } = require('../logger');

function setupAutoRole(client) {
  client.on('guildMemberAdd', async member => {
    const role = member.guild.roles.cache.find(item => item.name === config.discord.defaultRoleName);
    if (!role) {
      logToFile(`Nie znaleziono roli autoroli: ${config.discord.defaultRoleName}`);
      return;
    }

    try {
      await member.roles.add(role);
      logToFile(`Nadano role ${role.name} uzytkownikowi ${member.user.tag}`);
    } catch (error) {
      logToFile(`Blad autoroli dla ${member.user.tag}: ${error.message}`);
    }
  });
}

module.exports = { setupAutoRole };
