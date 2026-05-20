// Odpala listener Tipply dopiero po zalogowaniu bota. Wlasciwa integracja jest
// w pliku tipply.js, bo korzysta z Puppeteera i CDP.
const tipplyListener = require('../../tipply');

function setupTipply(client) {
  client.once('ready', () => {
    tipplyListener(client).catch(error => {
      console.error('[tipply] Blad listenera:', error);
    });
  });
}

module.exports = { setupTipply };
