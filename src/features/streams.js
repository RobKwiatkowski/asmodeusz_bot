// Monitoring Twitcha. Lista streamerow siedzi w JSON, a bot wysyla/usuwa
// komunikaty na kanale, gdy streamer przechodzi online/offline.
const fetch = (...args) => import('node-fetch').then(({ default: fetchImpl }) => fetchImpl(...args));
const { config } = require('../config');
const { readJson } = require('../jsonStore');

const streamMessages = {};
let twitchTokenCache = {
  token: config.twitch.accessToken,
  expiresAt: 0
};

async function getTwitchToken() {
  if (twitchTokenCache.token && Date.now() < twitchTokenCache.expiresAt) {
    return twitchTokenCache.token;
  }

  if (config.twitch.accessToken && !config.twitch.clientSecret) {
    return config.twitch.accessToken;
  }

  if (!config.twitch.clientId || !config.twitch.clientSecret) {
    return null;
  }

  const params = new URLSearchParams({
    client_id: config.twitch.clientId,
    client_secret: config.twitch.clientSecret,
    grant_type: 'client_credentials'
  });

  const res = await fetch(`https://id.twitch.tv/oauth2/token?${params}`, { method: 'POST' });
  if (!res.ok) throw new Error(`Twitch auth ${res.status}`);
  const data = await res.json();

  twitchTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(60, data.expires_in - 60) * 1000
  };
  return twitchTokenCache.token;
}

async function checkStreams(client) {
  const guild = client.guilds.cache.get(config.discord.guildId) || client.guilds.cache.first();
  if (!guild) return;

  const channel = guild.channels.cache.find(item => item.name === config.notifications.twitchChannelName);
  if (!channel) return;

  const streamers = readJson(config.files.streamers, []);
  if (streamers.length === 0) return;

  const token = await getTwitchToken();
  if (!token || !config.twitch.clientId) return;

  const usernames = streamers.map(item => item.twitchName);
  const query = usernames.map(name => `user_login=${encodeURIComponent(name)}`).join('&');
  const res = await fetch(`https://api.twitch.tv/helix/streams?${query}`, {
    headers: {
      'Client-ID': config.twitch.clientId,
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();
  if (!Array.isArray(data.data)) return;

  const onlineNames = data.data.map(stream => stream.user_login);
  for (const name in streamMessages) {
    if (!onlineNames.includes(name)) {
      const msg = await channel.messages.fetch(streamMessages[name]).catch(() => null);
      await msg?.delete().catch(() => {});
      delete streamMessages[name];
    }
  }

  for (const stream of data.data) {
    const { user_name, user_login, title, thumbnail_url } = stream;
    if (streamMessages[user_login]) continue;

    const thumb = thumbnail_url.replace('{width}', '1280').replace('{height}', '720');
    const msg = await channel.send({
      content: `🔴 **${user_name}** jest teraz na zywo!\n🎮 ${title}\n📺 https://twitch.tv/${user_login}`,
      embeds: [{ image: { url: thumb } }]
    });
    streamMessages[user_login] = msg.id;
  }
}

function setupStreams(client) {
  client.once('ready', () => {
    checkStreams(client).catch(error => console.error('[streams] Blad:', error));
    setInterval(() => checkStreams(client).catch(error => console.error('[streams] Blad:', error)), config.notifications.twitchCheckMs);
  });
}

module.exports = {
  setupStreams,
  checkStreams
};
