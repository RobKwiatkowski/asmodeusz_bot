// Loguje wejscia, wyjscia i przenosiny na kanalch glosowych tworzonych przez bota.
const { config } = require('../config');

function setupVoiceLogs(client) {
  client.on('voiceStateUpdate', async (oldState, newState) => {
    const logChannel = await client.channels.fetch(config.voice.logChannelId).catch(() => null);
    if (!logChannel) return;

    const member = newState.member || oldState.member;
    const oldChannel = oldState.channel;
    const newChannel = newState.channel;
    const displayName = member?.displayName || member?.user?.username || 'Nieznany';
    const timestamp = new Date().toLocaleString('pl-PL');

    const isInTempCategory = channel =>
      channel && [config.voice.standardCategoryId, config.voice.otherGamesCategoryId].includes(channel.parentId);

    if (oldChannel && newChannel && oldChannel.id !== newChannel.id && (isInTempCategory(oldChannel) || isInTempCategory(newChannel))) {
      await logChannel.send(`${timestamp} => **${displayName}** przeszedl z **${oldChannel.name}** do **${newChannel.name}**`);
    } else if (!oldChannel && newChannel && isInTempCategory(newChannel)) {
      await logChannel.send(`${timestamp} => **${displayName}** wszedl na kanal **${newChannel.name}**`);
    } else if (oldChannel && !newChannel && isInTempCategory(oldChannel)) {
      await logChannel.send(`${timestamp} => **${displayName}** opuscil kanal **${oldChannel.name}**`);
    }
  });
}

module.exports = { setupVoiceLogs };
