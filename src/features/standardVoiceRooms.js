// Standardowe kanaly tymczasowe PUBG. Wejscie na kanal-trigger tworzy pokoj
// z kolejnym numerem i przenosi do niego gracza.
const { ChannelType, PermissionsBitField } = require('discord.js');
const { config } = require('../config');
const { logToFile } = require('../logger');

const temporaryChannels = new Map();

function getNextAvailableNumber(guild, baseName) {
  const existingNumbers = new Set();

  guild.channels.cache.forEach(channel => {
    if (channel.parentId !== config.voice.standardCategoryId) return;
    const match = channel.name.match(/^\[(\d+)]\s+(.+)$/);
    if (!match) return;
    if (match[2].toLowerCase().trim() === baseName.toLowerCase().trim()) {
      existingNumbers.add(Number(match[1]));
    }
  });

  let number = 1;
  while (existingNumbers.has(number)) number++;
  return number;
}

function getLimit(baseName) {
  if (baseName.includes('DUO')) return 3;
  if (baseName.includes('SQUAD')) return 5;
  return 0;
}

function setupStandardVoiceRooms(client) {
  client.on('voiceStateUpdate', async (oldState, newState) => {
    const member = newState.member;
    const guild = newState.guild;
    const joinedChannel = newState.channel;
    const leftChannel = oldState.channel;

    if (
      joinedChannel &&
      joinedChannel.id !== config.voice.technicalChannelId &&
      config.voice.creatorNames.includes(joinedChannel.name)
    ) {
      const category = guild.channels.cache.get(config.voice.standardCategoryId);
      if (!category) return;

      const baseName = joinedChannel.name.replace(/^.*➕\s*/, '');
      const number = getNextAvailableNumber(guild, baseName);
      const newChannelName = `[${number}] ${baseName}`;

      try {
        const tempChannel = await guild.channels.create({
          name: newChannelName,
          type: ChannelType.GuildVoice,
          parent: category,
          userLimit: getLimit(baseName),
          permissionOverwrites: [
            { id: guild.roles.everyone, allow: [PermissionsBitField.Flags.Connect] },
            {
              id: member.id,
              allow: [
                PermissionsBitField.Flags.Connect,
                PermissionsBitField.Flags.Speak,
                PermissionsBitField.Flags.Stream
              ]
            }
          ]
        });

        temporaryChannels.set(tempChannel.id, member.id);
        if (member.voice.channelId === joinedChannel.id) {
          await member.voice.setChannel(tempChannel);
        }
        logToFile(`[voice] ${member.displayName} utworzyl kanal ${newChannelName}`);
      } catch (error) {
        console.error('[standardVoiceRooms] Blad tworzenia kanalu:', error);
        logToFile(`[voice] Blad tworzenia kanalu: ${error.message}`);
      }
    }

    if (leftChannel && temporaryChannels.has(leftChannel.id) && leftChannel.members.size === 0) {
      await leftChannel.delete().catch(error => {
        console.error('[standardVoiceRooms] Blad usuwania kanalu:', error);
      });
      temporaryChannels.delete(leftChannel.id);
    }
  });
}

module.exports = { setupStandardVoiceRooms };
