// Odpala listener Tipply dopiero po zalogowaniu bota. Wlasciwa integracja jest
// w osobnym pliku, bo korzysta z Puppeteera i CDP.
const fs = require('fs');
const path = require('path');
const { config } = require('../config');

function loadTipplyListener() {
  const listenerPath = path.resolve(__dirname, '../../tipply.js');
  if (!fs.existsSync(listenerPath)) {
    console.warn('[tipply] Pomijam integracje: brakuje pliku ../../tipply.js.');
    return null;
  }

  return require(listenerPath);
}

function setupTipply(client) {
  if (!config.tipply.widgetUrl) {
    console.warn('[tipply] Pomijam integracje: brak TIPPLY_WIDGET_URL w ENV.');
    return;
  }

  const tipplyListener = loadTipplyListener();
  if (!tipplyListener) {
    return;
  }

  client.once('ready', () => {
    tipplyListener(client).catch(error => {
      console.error('[tipply] Blad listenera:', error);
    });
  });
}

module.exports = { setupTipply };
