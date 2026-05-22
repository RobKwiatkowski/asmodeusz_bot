// Flow "Inna gra". Uzytkownik wchodzi na kanal techniczny, wybiera gre z menu
// albo wpisuje wlasna nazwe, a bot tworzy kanal glosowy i pilnuje cooldownow.
const fs = require('fs');
const {
  ActionRowBuilder,
  ChannelType,
  ModalBuilder,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');
const { config } = require('../config');
const { logToFile } = require('../logger');

const DEFAULT_CONFIG = {
  technicalVoiceChannelId: config.voice.technicalChannelId,
  temporaryCategoryId: config.voice.otherGamesCategoryId,
  instructionChannelId: '',
  instructionChannelName: 'Info-jak-tworzyc-kanaly',
  flowTimeoutSeconds: 15,
  emptyChannelDeleteDelaySeconds: 90,
  createCooldownSeconds: 45,
  failedAttemptWindowSeconds: 300,
  failedAttemptLimit: 3,
  failedAttemptCooldownSeconds: 180,
  allowedGameNameMinLength: 3,
  allowedGameNameMaxLength: 24,
  maxGameNameWords: 3,
  fallbackGameName: 'Inna gra',
  popularGames: ['Battlefield 6', 'SnowRunner', 'Minecraft', 'Farming Simulator 25'],
  blockedTermsFile: 'wulgaryzmy.txt',
  lowQualityNames: ['aaa', 'test', 'elo', 'pokoj', 'kanal', 'nic'],
  blockedTerms: []
};

const SELECT_PREFIX = 'select_game:';
const MODAL_PREFIX = 'other_game_modal:';
const pendingFlows = new Map();
const cooldowns = new Map();
const failedAttempts = new Map();
const deleteTimers = new Map();

function loadVoiceConfig() {
  try {
    if (!fs.existsSync(config.files.temporaryVoiceConfig)) return { ...DEFAULT_CONFIG };
    const fileConfig = JSON.parse(fs.readFileSync(config.files.temporaryVoiceConfig, 'utf8'));
    return { ...DEFAULT_CONFIG, ...fileConfig };
  } catch (error) {
    console.error('[gameVoiceRooms] Blad konfiguracji:', error);
    return { ...DEFAULT_CONFIG };
  }
}

const voiceConfig = loadVoiceConfig();
const technicalChannelId = voiceConfig.technicalVoiceChannelId;
const temporaryCategoryId = voiceConfig.temporaryCategoryId;
const flowTimeoutMs = Math.max(5, Number(voiceConfig.flowTimeoutSeconds || 15)) * 1000;
const deleteDelayMs = Math.max(5, Number(voiceConfig.emptyChannelDeleteDelaySeconds || 90)) * 1000;
const createCooldownMs = Math.max(0, Number(voiceConfig.createCooldownSeconds || 45)) * 1000;
const failedWindowMs = Math.max(30, Number(voiceConfig.failedAttemptWindowSeconds || 300)) * 1000;
const failedCooldownMs = Math.max(30, Number(voiceConfig.failedAttemptCooldownSeconds || 180)) * 1000;

function key(guildId, userId) {
  return `${guildId}:${userId}`;
}

function normalizeForValidation(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function loadBlockedTerms() {
  const fileName = voiceConfig.blockedTermsFile;
  const terms = [...(voiceConfig.blockedTerms || [])];
  if (!fileName) return terms;

  try {
    const fullPath = fs.existsSync(fileName) ? fileName : require('../config').rootPath(fileName);
    if (!fs.existsSync(fullPath)) return terms;
    const raw = fs.readFileSync(fullPath, 'utf8').replace(/^\uFEFF/, '');
    const fileTerms = fullPath.toLowerCase().endsWith('.json') ? JSON.parse(raw) : raw.split(/\r?\n/);
    if (Array.isArray(fileTerms)) terms.push(...fileTerms);
  } catch (error) {
    console.error('[gameVoiceRooms] Blad listy blokowanych slow:', error.message);
  }

  return terms
    .map(item => String(item || '').trim())
    .filter(item => item && !item.startsWith('*') && /^[\p{L}\p{N}_-]+$/u.test(item));
}

const blockedTerms = loadBlockedTerms()
  .map(term => {
    const normalized = normalizeForValidation(term);
    return { normalized, compact: normalized.replace(/[\s\-_+]/g, '') };
  })
  .sort((a, b) => b.compact.length - a.compact.length);

function validateGameName(input) {
  const normalizedInput = String(input || '').trim().replace(/\s+/g, ' ');
  const validationInput = normalizeForValidation(normalizedInput);
  const compactInput = validationInput.replace(/[\s\-_+]/g, '');
  const minLength = Number(voiceConfig.allowedGameNameMinLength || 3);
  const maxLength = Number(voiceConfig.allowedGameNameMaxLength || 24);
  const maxWords = Number(voiceConfig.maxGameNameWords || 3);

  const result = {
    rawInput: input,
    normalizedInput,
    displayName: normalizedInput,
    decision: 'accepted',
    reasonCode: 'accepted'
  };

  if (!normalizedInput) return { ...result, decision: 'rejected', reasonCode: 'empty' };
  if (/(https?:\/\/|www\.|discord\.gg|\.com|\.pl)/i.test(normalizedInput)) return { ...result, decision: 'rejected', reasonCode: 'link' };
  if (/(@everyone|@here|<@|<#|<@&)/i.test(normalizedInput)) return { ...result, decision: 'rejected', reasonCode: 'mention' };
  if (normalizedInput.length < minLength) return { ...result, decision: 'rejected', reasonCode: 'too_short' };
  if (normalizedInput.length > maxLength) return { ...result, decision: 'rejected', reasonCode: 'too_long' };
  if (normalizedInput.split(/\s+/).filter(Boolean).length > maxWords) return { ...result, decision: 'rejected', reasonCode: 'too_many_words' };
  if (!/^[\p{L}\p{N}\s\-+]+$/u.test(normalizedInput)) return { ...result, decision: 'rejected', reasonCode: 'invalid_characters' };

  const tokens = new Set(validationInput.match(/[\p{L}\p{N}_-]+/gu) || []);
  const blocked = blockedTerms.find(term =>
    tokens.has(term.normalized) ||
    compactInput === term.compact ||
    (term.compact.length >= 4 && compactInput.includes(term.compact))
  );
  if (blocked) return { ...result, decision: 'rejected', reasonCode: 'blocked_term' };

  const lowQualityNames = (voiceConfig.lowQualityNames || []).map(normalizeForValidation);
  if (
    lowQualityNames.includes(validationInput) ||
    lowQualityNames.includes(compactInput) ||
    /^(\p{L}|\p{N})\1{2,}$/u.test(compactInput) ||
    /^\d+$/.test(compactInput)
  ) {
    return {
      ...result,
      decision: 'sanitized',
      displayName: voiceConfig.fallbackGameName,
      reasonCode: 'low_quality'
    };
  }

  return result;
}

function cooldownRemainingMs(flowKey) {
  const until = cooldowns.get(flowKey) || 0;
  const remaining = until - Date.now();
  if (remaining <= 0) {
    cooldowns.delete(flowKey);
    return 0;
  }
  return remaining;
}

async function findInstructionChannel(guild, technicalChannel) {
  const canSend = channel =>
    channel?.type === ChannelType.GuildText &&
    channel.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.SendMessages);

  if (voiceConfig.instructionChannelId) {
    const byId = await guild.channels.fetch(voiceConfig.instructionChannelId).catch(() => null);
    if (canSend(byId)) return byId;
  }

  const expectedName = normalizeForValidation(voiceConfig.instructionChannelName || '');
  if (expectedName) {
    const byName = guild.channels.cache.find(channel =>
      canSend(channel) && normalizeForValidation(channel.name) === expectedName
    );
    if (byName) return byName;
  }

  if (technicalChannel?.parentId) {
    const sameCategory = guild.channels.cache.find(channel =>
      channel.parentId === technicalChannel.parentId && canSend(channel)
    );
    if (sameCategory) return sameCategory;
  }

  return canSend(guild.systemChannel) ? guild.systemChannel : null;
}

function clearFlow(flowKey, client, shouldDeleteMessage = false) {
  const flow = pendingFlows.get(flowKey);
  if (!flow) return;
  if (flow.timeout) clearTimeout(flow.timeout);
  pendingFlows.delete(flowKey);

  if (shouldDeleteMessage && flow.messageId && flow.instructionChannelId) {
    client.channels.fetch(flow.instructionChannelId)
      .then(channel => channel?.messages?.fetch(flow.messageId).catch(() => null))
      .then(message => message?.delete().catch(() => {}))
      .catch(() => {});
  }
}

async function disconnectFromTechnicalVoice(member) {
  if (member?.voice?.channelId === technicalChannelId) {
    await member.voice.disconnect('Nie zakonczono tworzenia kanalu tymczasowego na czas.').catch(() => {});
  }
}

function sanitizePart(value, fallback, maxLength = 32) {
  let safe = String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N}\s\-_+|]/gu, '')
    .trim();
  if (!safe) safe = fallback;
  if (safe.length > maxLength) safe = safe.slice(0, maxLength).trim();
  return safe || fallback;
}

function buildChannelName(gameName, member) {
  const gamePart = sanitizePart(gameName, voiceConfig.fallbackGameName, 32);
  const nickPart = sanitizePart(member.displayName || member.user.username, 'Gracz', 24);
  const name = `${gamePart} | ${nickPart}`;
  return name.length > 90 ? name.slice(0, 90).trim() : name;
}

async function startFlow(client, member, technicalChannel) {
  const guild = member.guild;
  const flowKey = key(guild.id, member.id);
  const instructionChannel = await findInstructionChannel(guild, technicalChannel);
  if (!instructionChannel) {
    await disconnectFromTechnicalVoice(member);
    return;
  }

  const popularGames = (voiceConfig.popularGames || []).slice(0, 24);
  const select = new StringSelectMenuBuilder()
    .setCustomId(`${SELECT_PREFIX}${member.id}`)
    .setPlaceholder('Wybierz gre albo opcje "Inna gra"')
    .addOptions(
      ...popularGames.map(game => ({ label: game, value: game })),
      { label: 'Inna gra', value: 'OTHER' }
    );

  const message = await instructionChannel.send({
    content: `${member}, Wybierz grę dla której chcesz pokój. Klknij na ikonę poniżej aby go utworzyć.`,
    components: [new ActionRowBuilder().addComponents(select)]
  }).catch(() => null);

  if (!message) {
    await disconnectFromTechnicalVoice(member);
    return;
  }

  const flow = {
    guildId: guild.id,
    userId: member.id,
    instructionChannelId: instructionChannel.id,
    messageId: message.id,
    timeout: setTimeout(async () => {
      clearFlow(flowKey, client, true);
      await disconnectFromTechnicalVoice(member);
    }, flowTimeoutMs)
  };

  pendingFlows.set(flowKey, flow);
}

function registerFailedAttempt(flowKey) {
  const now = Date.now();
  const current = failedAttempts.get(flowKey);
  const fresh = !current || now - current.firstAttemptAt > failedWindowMs;
  const next = fresh
    ? { count: 1, firstAttemptAt: now }
    : { count: current.count + 1, firstAttemptAt: current.firstAttemptAt };
  failedAttempts.set(flowKey, next);
  return { ...next, shouldCooldown: next.count >= Number(voiceConfig.failedAttemptLimit || 3) };
}

async function createTemporaryChannel(member, channelName) {
  const botId = member.guild.members.me?.id;
  const permissionOverwrites = [
    { id: member.guild.id, allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel] },
    { id: member.id, allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ManageChannels] }
  ];

  if (botId) {
    permissionOverwrites.push({
      id: botId,
      allow: [
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.MoveMembers
      ]
    });
  }

  return member.guild.channels.create({
    name: channelName,
    type: ChannelType.GuildVoice,
    parent: temporaryCategoryId,
    permissionOverwrites
  });
}

async function moveMemberToTemporaryChannel(member, channel) {
  const freshMember = await member.guild.members.fetch(member.id);
  if (!freshMember.voice.channelId) {
    throw new Error('Uzytkownik nie jest juz na kanale glosowym.');
  }

  if (freshMember.voice.channelId === channel.id) return;
  await freshMember.voice.setChannel(channel, 'Utworzono kanal tymczasowy Inna gra');
}

async function completeCreation(client, interaction, member, gameName) {
  const flowKey = key(interaction.guild.id, member.id);
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ ephemeral: true });
  }

  const channel = await createTemporaryChannel(member, buildChannelName(gameName, member));
  try {
    await moveMemberToTemporaryChannel(member, channel);
  } catch (error) {
    logToFile(`[voice] Utworzono kanal ${channel.name}, ale nie udalo sie przeniesc ${member.displayName}: ${error.message}`);
    console.error('[gameVoiceRooms] Blad przenoszenia uzytkownika:', error);
    if (channel.members.size === 0) {
      await channel.delete().catch(() => {});
    }
    await interaction.editReply({
      content:
        'Utworzylem pokoj, ale nie moge Cie do niego przeniesc. ' +
        'Sprawdz uprawnienie bota "Przenoszenie czlonkow" i sprobuj ponownie.'
    });
    return;
  }

  failedAttempts.delete(flowKey);
  if (createCooldownMs > 0) cooldowns.set(flowKey, Date.now() + createCooldownMs);
  clearFlow(flowKey, client, true);
  logToFile(`[voice] Utworzono kanal innej gry: ${channel.name}`);
  await interaction.editReply({ content: `Utworzono kanal i przeniesiono Cie do: **${channel.name}**` });
}

async function handleSelect(client, interaction) {
  const userId = interaction.customId.slice(SELECT_PREFIX.length);
  if (interaction.user.id !== userId) {
    await interaction.reply({ content: 'To menu jest przypisane do innego uzytkownika.', ephemeral: true });
    return;
  }

  const flowKey = key(interaction.guild.id, userId);
  if (!pendingFlows.has(flowKey)) {
    await interaction.reply({ content: 'Ten wybor wygasl. Wejdz ponownie na kanal Inna gra.', ephemeral: true });
    return;
  }

  const member = await interaction.guild.members.fetch(userId).catch(() => null);
  if (!member || member.voice.channelId !== technicalChannelId) {
    clearFlow(flowKey, client, true);
    await interaction.reply({ content: 'Wejdz na kanal Inna gra, zeby utworzyc pokoj.', ephemeral: true });
    return;
  }

  const chosen = interaction.values[0];
  if (chosen === 'OTHER') {
    const modal = new ModalBuilder()
      .setCustomId(`${MODAL_PREFIX}${userId}`)
      .setTitle('Podaj nazwe gry');
    const input = new TextInputBuilder()
      .setCustomId('gameName')
      .setLabel('Nazwa gry')
      .setStyle(TextInputStyle.Short)
      .setMinLength(Number(voiceConfig.allowedGameNameMinLength || 3))
      .setMaxLength(Number(voiceConfig.allowedGameNameMaxLength || 24))
      .setRequired(true);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
    return;
  }

  await completeCreation(client, interaction, member, chosen);
}

async function handleModal(client, interaction) {
  const userId = interaction.customId.slice(MODAL_PREFIX.length);
  if (interaction.user.id !== userId) {
    await interaction.reply({ content: 'Ten formularz jest przypisany do innego uzytkownika.', ephemeral: true });
    return;
  }

  const flowKey = key(interaction.guild.id, userId);
  const member = await interaction.guild.members.fetch(userId).catch(() => null);
  if (!pendingFlows.has(flowKey) || !member || member.voice.channelId !== technicalChannelId) {
    clearFlow(flowKey, client, true);
    await interaction.reply({ content: 'Wejdz na kanal Inna gra, zeby utworzyc pokoj.', ephemeral: true });
    return;
  }

  const validation = validateGameName(interaction.fields.getTextInputValue('gameName'));
  if (validation.decision === 'rejected') {
    const attempt = registerFailedAttempt(flowKey);
    if (attempt.shouldCooldown) {
      cooldowns.set(flowKey, Date.now() + failedCooldownMs);
      failedAttempts.delete(flowKey);
      clearFlow(flowKey, client, true);
      await disconnectFromTechnicalVoice(member);
    }
    await interaction.reply({
      content: attempt.shouldCooldown
        ? 'Ta nazwa nie przeszla walidacji. Wlaczono dluzszy cooldown.'
        : 'Ta nazwa nie przeszla walidacji. Sprobuj wpisac inna nazwe.',
      ephemeral: true
    });
    return;
  }

  await completeCreation(client, interaction, member, validation.displayName);
}

function scheduleDelete(client, channel) {
  if (!channel || channel.id === technicalChannelId || channel.parentId !== temporaryCategoryId) return;
  if (channel.members.size > 0 || deleteTimers.has(channel.id)) return;

  const timeout = setTimeout(async () => {
    deleteTimers.delete(channel.id);
    const freshChannel = await client.channels.fetch(channel.id).catch(() => null);
    if (!freshChannel || freshChannel.members.size > 0) return;
    await freshChannel.delete().catch(error => console.error('[gameVoiceRooms] Blad usuwania:', error));
  }, deleteDelayMs);

  deleteTimers.set(channel.id, timeout);
}

function cancelDelete(channelId) {
  const timeout = deleteTimers.get(channelId);
  if (!timeout) return;
  clearTimeout(timeout);
  deleteTimers.delete(channelId);
}

function setupGameVoiceRooms(client) {
  client.on('voiceStateUpdate', async (oldState, newState) => {
    if (oldState.channel && oldState.channel.parentId === temporaryCategoryId && oldState.channel.members.size === 0) {
      scheduleDelete(client, oldState.channel);
    }

    if (newState.channel && newState.channel.parentId === temporaryCategoryId) {
      cancelDelete(newState.channel.id);
    }

    if (newState.channelId === technicalChannelId && newState.member && !newState.member.user.bot) {
      const flowKey = key(newState.guild.id, newState.member.id);
      const remaining = cooldownRemainingMs(flowKey);
      if (remaining > 0) {
        await disconnectFromTechnicalVoice(newState.member);
        return;
      }

      if (!pendingFlows.has(flowKey)) {
        await startFlow(client, newState.member, newState.channel);
      }
    }
  });

  client.on('interactionCreate', async interaction => {
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith(SELECT_PREFIX)) {
      await handleSelect(client, interaction);
      return;
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith(MODAL_PREFIX)) {
      await handleModal(client, interaction);
    }
  });
}

module.exports = { setupGameVoiceRooms };
