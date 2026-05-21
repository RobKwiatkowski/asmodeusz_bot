// Punkt startowy bota Sentinel. Cala logika jest ladowana z modulow,
// dzieki czemu ten plik odpowiada tylko za start aplikacji.
const { config } = require('./src/config');
const { createDiscordClient } = require('./src/client');
const { setupCommands } = require('./src/commandLoader');
const { setupEvents } = require('./src/eventLoader');
const { setupFeatures } = require('./src/features');

const requiredDiscordEnv = [
  ['DISCORD_TOKEN', config.discord.token],
  ['DISCORD_GUILD_ID', config.discord.guildId]
];
const missingDiscordEnv = requiredDiscordEnv
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missingDiscordEnv.length > 0) {
  console.error(
    `Brakuje konfiguracji Discord: ${missingDiscordEnv.join(', ')}. ` +
    'Uzupelnij .env albo zmienne srodowiskowe kontenera.'
  );
  process.exit(1);
}

const client = createDiscordClient();

setupCommands(client);
setupFeatures(client);
setupEvents(client);

client.login(config.discord.token);
