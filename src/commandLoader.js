// Ladowanie komend slash z katalogu commands. Kazda komenda moze tez wystawic
// opcjonalne hooki, np. registerReactionHandler albo startCron.
const fs = require('fs');
const path = require('path');
const { Collection, REST, Routes } = require('discord.js');
const { config } = require('./config');

function loadCommands(client) {
  client.commands = new Collection();

  const commandPayload = [];
  const commandFiles = fs
    .readdirSync(config.paths.commandsDir)
    .filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const commandPath = path.join(config.paths.commandsDir, file);
    const command = require(commandPath);

    if (!command.data || typeof command.execute !== 'function') {
      console.warn(`[commands] Pomijam ${file}: brak data albo execute`);
      continue;
    }

    client.commands.set(command.data.name, command);
    commandPayload.push(command.data.toJSON());
  }

  return commandPayload;
}

function registerCommandHooks(client) {
  for (const command of client.commands.values()) {
    if (typeof command.registerReactionHandler === 'function') {
      command.registerReactionHandler(client);
    }

    if (typeof command.registerVoiceListener === 'function') {
      command.registerVoiceListener(client);
    }

    if (typeof command.register === 'function') {
      command.register(client);
    }

    if (typeof command.startCron === 'function') {
      client.once('clientReady', () => command.startCron(client));
    }
  }
}

function registerInteractionRouter(client) {
  client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      console.log(
        `[commands] Start /${interaction.commandName} | ` +
        `guild=${interaction.guildId} | channel=${interaction.channelId} | ` +
        `user=${interaction.user?.tag || interaction.user?.id}`
      );
      await command.execute(interaction);
      console.log(`[commands] Sukces /${interaction.commandName}`);
    } catch (error) {
      console.error(`[commands] Blad komendy /${interaction.commandName}:`, error);
      const payload = {
        content: 'Wystapil blad podczas wykonywania komendy.',
        ephemeral: true
      };

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
  });
}

function registerCommandsOnReady(client, commandPayload) {
  client.once('clientReady', async () => {
    const rest = new REST({ version: '10' }).setToken(config.discord.token);

    try {
      console.log('[commands] Rejestruje komendy slash...');
      await rest.put(
        Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
        { body: commandPayload }
      );
      console.log(`[commands] Zarejestrowano ${commandPayload.length} komend.`);
    } catch (error) {
      console.error('[commands] Blad rejestracji komend:', error);
    }
  });
}

function setupCommands(client) {
  const commandPayload = loadCommands(client);
  registerCommandHooks(client);
  registerInteractionRouter(client);
  registerCommandsOnReady(client, commandPayload);
}

module.exports = { setupCommands };
