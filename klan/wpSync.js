//const fetch = require('node-fetch');
// Synchronizacja lokalnej listy klanu z WordPressem.
const { loadData } = require('./clanStore');
const { config } = require('../src/config');

const WP_ENDPOINT = config.wordpress.clanEndpoint;

async function syncClanToWP() {
  const data = loadData();

  const res = await fetch(WP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(`WP error: ${JSON.stringify(json)}`);
  }

  return json;
}

// ⬇️ FUNKCJA

const WP_PROMOTION_ENDPOINT =
  config.wordpress.clanPromotionEndpoint;
async function sendClanPromotionToWP({
  game,
  clanName,
  oldLevel,
  newLevel,
  members
}) {
  const res = await fetch(WP_PROMOTION_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      game,
      clan_name: clanName,
      old_level: oldLevel,
      new_level: newLevel,
      members
    })
  });

  if (!res.ok) {
    const json = await res.json();
    throw new Error(
      `[WP] Clan promotion error: ${JSON.stringify(json)}`
    );
  }
}

module.exports = {
	syncClanToWP,
    sendClanPromotionToWP
	};
