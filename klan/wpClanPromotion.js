// Wysyla informacje o awansie klanu do WordPressa.
const fetch = global.fetch;
const { config } = require('../src/config');

const WP_PROMO_URL = config.wordpress.clanPromotionEndpoint;

async function sendClanPromotionToWP(oldLevel, newLevel) {
  try {
    await fetch(WP_PROMO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game: 'PUBG',
        old_level: oldLevel,
        new_level: newLevel
      })
    });

    console.log('🌍 WP: awans klanu wysłany');
  } catch (err) {
    console.error('❌ WP awans – błąd:', err.message);
  }
}

module.exports = { sendClanPromotionToWP };
