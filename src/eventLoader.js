// Loader eventow z katalogu events. Kazdy plik eksportuje { name, execute },
// dzieki czemu eventy Discorda nie musza mieszkac w glownym pliku startowym.
const fs = require('fs');
const path = require('path');
const { config } = require('./config');

function setupEvents(client) {
  if (!fs.existsSync(config.paths.eventsDir)) return;

  const eventFiles = fs
    .readdirSync(config.paths.eventsDir)
    .filter(file => file.endsWith('.js'));

  for (const file of eventFiles) {
    const event = require(path.join(config.paths.eventsDir, file));

    if (!event.name || typeof event.execute !== 'function') {
      console.warn(`[events] Pomijam ${file}: brak name albo execute`);
      continue;
    }

    client.on(event.name, (...args) => event.execute(...args));
    console.log(`[events] Zaladowano ${event.name}`);
  }
}

module.exports = { setupEvents };
