// Punkt startowy bota Asmodeusz. Cala logika jest ladowana z modulow,
// dzieki czemu ten plik odpowiada tylko za start aplikacji.
const { config } = require('./src/config');
const { createDiscordClient } = require('./src/client');
const { setupCommands } = require('./src/commandLoader');
const { setupEvents } = require('./src/eventLoader');
const { setupFeatures } = require('./src/features');

if (!config.discord.token) {
  console.error('Brakuje DISCORD_TOKEN. Uzupelnij .env albo zmienne srodowiskowe kontenera.');
  process.exit(1);
}

const client = createDiscordClient();

setupCommands(client);
setupFeatures(client);
setupEvents(client);

client.login(config.discord.token);
