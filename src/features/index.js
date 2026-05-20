// Jedna lista modulow funkcjonalnych. Glowny plik startowy tylko ja przechodzi
// i odpala setup, zamiast trzymac wszystkie listenery w jednym monolicie.
const { setupPubgRanks } = require('./pubgRanks');
const { setupPubgTop } = require('./pubgTop');
const { setupMessageLogger } = require('./messageLogger');
const { setupStreams } = require('./streams');
const { setupAutoRole } = require('./autoRole');
const { setupStandardVoiceRooms } = require('./standardVoiceRooms');
const { setupGameVoiceRooms } = require('./gameVoiceRooms');
const { setupTickets } = require('./tickets');
const { setupYoutube } = require('./youtube');
const { setupVoiceLogs } = require('./voiceLogs');
const { setupMemberLeaveLogs } = require('./memberLeaveLogs');
const { setupEmptyVoiceCleanup } = require('./emptyVoiceCleanup');
const { setupAnniversaries } = require('./anniversaries');
const { setupClanLevelMonitor } = require('./clanLevelMonitor');
const { setupBoostThanks } = require('./boostThanks');
const { setupPresence } = require('./presence');
const { setupTipply } = require('./tipply');

const features = [
  setupPubgRanks,
  setupPubgTop,
  setupMessageLogger,
  setupStreams,
  setupAutoRole,
  setupStandardVoiceRooms,
  setupGameVoiceRooms,
  setupTickets,
  setupYoutube,
  setupVoiceLogs,
  setupMemberLeaveLogs,
  setupEmptyVoiceCleanup,
  setupAnniversaries,
  setupClanLevelMonitor,
  setupBoostThanks,
  setupPresence,
  setupTipply
];

function setupFeatures(client) {
  for (const setup of features) {
    setup(client);
  }
}

module.exports = { setupFeatures };
