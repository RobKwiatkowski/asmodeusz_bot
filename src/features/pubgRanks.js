// Reset rang po zmianie sezonu PUBG. Komendy uzytkownika sa w /pubg.
const fs = require('fs');
const { config } = require('../config');
const { readJson, writeJson } = require('../jsonStore');
const { logToFile } = require('../logger');
const { getCurrentSeason, getPlayerByName, pubgRequest } = require('../pubgApi');

const RANK_ROLES = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Crystal', 'Survivor'];

async function ensureRole(guild, baseRank) {
  let role = guild.roles.cache.find(item => item.name.toUpperCase() === baseRank.toUpperCase());
  if (!role) {
    role = await guild.roles.create({ name: baseRank, reason: 'PUBG Rank Sync' });
    logToFile(`Utworzono role PUBG: ${baseRank}`);
  }
  return role;
}

async function fetchPubgRank(nickname) {
  const player = await getPlayerByName(nickname);
  if (!player) throw new Error('Nie znaleziono gracza.');

  const seasonId = await getCurrentSeason();
  if (!seasonId) throw new Error('Nie znaleziono biezacego sezonu.');

  const rankData = await pubgRequest(
    `https://api.pubg.com/shards/${config.pubg.region}/players/${player.id}/seasons/${seasonId}/ranked`
  );

  const statsObj = rankData.data?.attributes?.rankedGameModeStats;
  if (!statsObj || Object.keys(statsObj).length === 0) {
    throw new Error('Nie rozegrano gier ranked w biezacym sezonie.');
  }

  let maxMatches = 0;
  let bestMode = null;
  let bestModeName = '';

  for (const mode in statsObj) {
    const stats = statsObj[mode];
    if (!stats.currentTier?.tier || stats.roundsPlayed === 0) continue;
    if (stats.roundsPlayed > maxMatches) {
      maxMatches = stats.roundsPlayed;
      bestMode = stats;
      bestModeName = mode;
    }
  }

  if (!bestMode?.currentTier?.tier) {
    throw new Error('Nie znaleziono rangi ranked.');
  }

  return {
    tier: bestMode.currentTier.tier.toUpperCase(),
    mode: bestModeName,
    matches: maxMatches
  };
}

async function resetRankRolesIfSeasonChanged(client) {
  const state = readJson(config.files.season, { currentSeason: null });
  const currentSeason = await getCurrentSeason().catch(error => {
    console.error('[pubgRanks] Blad pobierania sezonu:', error.message);
    return null;
  });

  if (!currentSeason || currentSeason === state.currentSeason) return;

  writeJson(config.files.season, { currentSeason });
  if (fs.existsSync(config.files.statsCache)) {
    fs.unlinkSync(config.files.statsCache);
  }

  const guild = await client.guilds.fetch(config.discord.guildId).catch(() => null);
  if (!guild) return;

  const channel = guild.channels.cache.find(item =>
    item.name === config.discord.generalChannelName && item.isTextBased()
  );
  await channel?.send(`Wykryto nowy sezon PUBG: **${currentSeason}**. Resetuje role rang.`);

  const rankRoles = guild.roles.cache.filter(role => RANK_ROLES.includes(role.name));
  for (const role of rankRoles.values()) {
    for (const member of role.members.values()) {
      await member.roles.remove(role).catch(error => {
        console.error(`[pubgRanks] Nie moge usunac roli ${role.name}:`, error.message);
      });
    }
  }

  logToFile(`Reset rang PUBG po wykryciu sezonu ${currentSeason}`);
}

function setupPubgRanks(client) {
  client.once('clientReady', async () => {
    await resetRankRolesIfSeasonChanged(client);
    setInterval(() => resetRankRolesIfSeasonChanged(client), 60 * 60 * 1000);
  });
}

module.exports = {
  setupPubgRanks,
  ensureRole,
  fetchPubgRank,
  resetRankRolesIfSeasonChanged
};
