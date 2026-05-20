// Role za staz na Discordzie. Bot tworzy brakujace role i raz dziennie
// sprawdza, komu nalezy nadac kolejny prog.
const { config } = require('../config');
const { readJson, writeJson } = require('../jsonStore');

const anniversaryRoles = [
  '🗣️ Stały Bywalec',
  '⭐ Znany Gość',
  '💬 Filar Społeczności',
  '🏅 Weteran Serwera',
  '👑 Legenda Społeczności'
];

async function ensureRoles(guild) {
  for (const roleName of anniversaryRoles) {
    let role = guild.roles.cache.find(item => item.name === roleName);
    if (!role) {
      role = await guild.roles.create({
        name: roleName,
        color: 'Gold',
        reason: 'Automatyczne role za staz na serwerze'
      });
      console.log(`[anniversaries] Utworzono role: ${role.name}`);
    }
  }
}

function getYearWord(years) {
  const m10 = years % 10;
  const m100 = years % 100;
  if (m10 === 1 && m100 !== 11) return 'rok';
  if ([2, 3, 4].includes(m10) && ![12, 13, 14].includes(m100)) return 'lata';
  return 'lat';
}

async function checkAnniversaries(client, initialRun = false) {
  const guild = await client.guilds.fetch(config.discord.guildId);
  await guild.members.fetch();
  await ensureRoles(guild);

  const awarded = readJson(config.files.anniversaries, {});
  const now = new Date();
  const newAwarded = [];

  for (const member of guild.members.cache.values()) {
    if (member.user.bot || !member.joinedAt) continue;

    const years = Math.floor((now - member.joinedAt) / (1000 * 60 * 60 * 24 * 365));
    if (years < 1) continue;

    const joinedMD = member.joinedAt.toISOString().slice(5, 10);
    const todayMD = now.toISOString().slice(5, 10);
    const daysPassed = Math.floor((now - member.joinedAt) / (1000 * 60 * 60 * 24)) % 365;
    const closeToAnniversary = daysPassed <= 3 && daysPassed >= 0;
    const roleName = anniversaryRoles[years >= 5 ? 4 : years - 1];
    const role = guild.roles.cache.find(item => item.name === roleName);

    const shouldAward = initialRun || joinedMD === todayMD || closeToAnniversary;
    if (!shouldAward || awarded[member.id]?.includes(roleName)) continue;

    for (const oldRoleName of anniversaryRoles) {
      const oldRole = guild.roles.cache.find(item => item.name === oldRoleName);
      if (oldRole && member.roles.cache.has(oldRole.id)) {
        await member.roles.remove(oldRole).catch(() => {});
      }
    }

    await member.roles.add(role).catch(() => {});
    if (!awarded[member.id]) awarded[member.id] = [];
    awarded[member.id].push(roleName);
    newAwarded.push({ member, years, roleName });
  }

  writeJson(config.files.anniversaries, awarded);

  const channel = guild.channels.cache.find(item =>
    item.name === config.discord.generalChannelName && item.isTextBased()
  );
  if (!channel || newAwarded.length === 0) return;

  let content = initialRun
    ? 'Wyróżnienia dla naszych weteranów!\n\n'
    : 'Dzisiejsze rocznice na serwerze!\n\n';

  for (const item of newAwarded.sort((a, b) => b.years - a.years)) {
    content += `<@${item.member.id}> - ${item.years} ${getYearWord(item.years)} z nami! (${item.roleName})\n`;
  }

  await channel.send({ content });
}

function setupAnniversaries(client) {
  client.once('clientReady', async () => {
    await checkAnniversaries(client, true).catch(error => console.error('[anniversaries] Blad:', error));
    setInterval(() => {
      checkAnniversaries(client, false).catch(error => console.error('[anniversaries] Blad:', error));
    }, 24 * 60 * 60 * 1000);
  });
}

module.exports = {
  setupAnniversaries,
  checkAnniversaries
};
