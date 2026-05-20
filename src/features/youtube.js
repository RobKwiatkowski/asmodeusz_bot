// Monitoring YouTube przez RSS. Komendy tekstowe dodaja/usuwaja kanaly,
// a interwal wysyla embed przy nowym filmie.
const axios = require('axios');
const xml2js = require('xml2js');
const { EmbedBuilder } = require('discord.js');
const { config } = require('../config');
const { readJson, writeJson } = require('../jsonStore');

async function resolveChannelId(input) {
  const idMatch = input.match(/channel\/(UC[0-9A-Za-z_-]+)/);
  if (idMatch) return idMatch[1];

  const handleMatch = input.match(/@([\w.-]+)/);
  const handle = handleMatch ? handleMatch[1] : input;

  const res = await axios.get(`https://www.youtube.com/@${handle}`, {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' }
  });
  return res.data.match(/"channelId":"(UC[0-9A-Za-z_-]+)"/)?.[1] || null;
}

async function checkAllChannels(client) {
  const data = readJson(config.files.youtube, { users: {} });
  const notifyChannel = await client.channels.fetch(config.notifications.youtubeChannelId).catch(() => null);
  if (!notifyChannel) return;

  for (const [username, info] of Object.entries(data.users)) {
    try {
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${info.channelId}`;
      const res = await axios.get(rssUrl);
      const result = await xml2js.parseStringPromise(res.data);
      const latestVideo = result.feed.entry?.[0];
      if (!latestVideo) continue;

      const videoId = latestVideo['yt:videoId'][0];
      if (info.lastVideoId === videoId) continue;

      const title = latestVideo.title[0];
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const published = new Date(latestVideo.published[0]);
      const channelTitle = result.feed.author?.[0]?.name?.[0] || 'Nieznany kanal';

      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle(title)
        .setURL(videoUrl)
        .setAuthor({
          name: channelTitle,
          iconURL: 'https://www.youtube.com/s/desktop/2b6b7e31/img/favicon_144x144.png'
        })
        .setDescription(`Nowy film od ${username}. Kliknij tytul, aby obejrzec.`)
        .setImage(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`)
        .setFooter({ text: `Opublikowano: ${published.toLocaleString('pl-PL')}` });

      await notifyChannel.send({ embeds: [embed] });
      data.users[username].lastVideoId = videoId;
      writeJson(config.files.youtube, data);
    } catch (error) {
      console.error(`[youtube] Blad dla ${username}:`, error.message);
    }
  }
}

function setupYoutube(client) {
  client.once('ready', () => {
    checkAllChannels(client).catch(error => console.error('[youtube] Blad:', error));
    setInterval(() => checkAllChannels(client), config.notifications.youtubeCheckMs);
  });
}

module.exports = {
  setupYoutube,
  resolveChannelId,
  checkAllChannels
};
