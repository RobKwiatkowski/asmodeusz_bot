// Fabryka klienta Discord. Intencje sa w jednym miejscu, bo od nich zalezy,
// ktore eventy Discord wysyla do naszego bota.
const { Client, GatewayIntentBits, Partials } = require('discord.js');

function createDiscordClient() {
  return new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildScheduledEvents
    ],
    partials: [
      Partials.Message,
      Partials.Channel,
      Partials.Reaction
    ]
  });
}

module.exports = { createDiscordClient };
