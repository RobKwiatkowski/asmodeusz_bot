// Ustawia opis aktywnosci bota po zalogowaniu.
const { ActivityType } = require('discord.js');
const { config } = require('../config');
const { logToFile } = require('../logger');

function setupPresence(client) {
  client.once('ready', () => {
    client.user.setActivity(config.discord.botActivity, { type: ActivityType.Playing });
    logToFile(`Bot uruchomiony jako ${client.user.tag}`);
    console.log(`[ready] Zalogowano jako ${client.user.tag}`);
  });
}

module.exports = { setupPresence };
