// Logger wszystkich wiadomosci Discorda do plikow dziennych.
const { logToFile } = require('../logger');

function setupMessageLogger(client) {
  client.on('messageCreate', message => {
    try {
      const channelId = message.channel?.id || 'nieznany-kanal';
      const nick = message.author?.username || message.member?.user?.username || 'Nieznany';
      const content = message.content ?? '<brak tresci>';
      logToFile(`Kanal: ${channelId} | Typ: ${message.type} | Nick: ${nick} | Tresc: ${content}`);
    } catch (error) {
      console.error('[messageLogger] Blad loggera:', error);
    }
  });
}

module.exports = { setupMessageLogger };
