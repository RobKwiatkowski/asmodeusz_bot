// Centralna konfiguracja bota. Ten plik zbiera ID kanalow/rol oraz sekrety z ENV,
// zeby logika funkcji nie trzymala hasel ani tokenow na sztywno w kodzie.
const path = require('path');
const envFilePath = process.env.ENV_FILE || '.env';
require('dotenv').config({ path: envFilePath });

const rootDir = path.resolve(__dirname, '..');
const dataDir = path.resolve(env('DATA_DIR', rootDir));
const logsDir = path.resolve(env('LOG_DIR', path.join(dataDir, 'logs')));

function env(name, fallback = '') {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

function envNumber(name, fallback) {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function envList(name, fallback = []) {
  const value = env(name);
  if (!value) return fallback;
  return value.split(',').map(item => item.trim()).filter(Boolean);
}

function rootPath(...parts) {
  return path.join(rootDir, ...parts);
}

const config = {
  rootDir,
  paths: {
    logsDir,
    commandsDir: rootPath('commands'),
    eventsDir: rootPath('events'),
    dataDir
  },
  discord: {
    token: env('DISCORD_TOKEN'),
    clientId: env('DISCORD_CLIENT_ID', '1335378256953606154'),
    guildId: env('DISCORD_GUILD_ID', '771352465346002944'),
    generalChannelName: env('GENERAL_CHANNEL_NAME', '💬『ogólny』'),
    defaultRoleName: env('DEFAULT_ROLE_NAME', 'Gracz'),
    moderatorRoleId: env('MODERATOR_ROLE_ID', '1369777784552947792'),
    adminRoleIds: envList('ADMIN_ROLE_IDS', [
      '1369777784552947792',
      '803986035855982642',
      '803987493296668732'
    ]),
    botActivity: env('BOT_ACTIVITY', 'NPC z uprawnieniami admina')
  },
  files: {
    lottery: path.join(dataDir, 'loteria.json'),
    bindings: path.join(dataDir, 'bindings.json'),
    clanList: path.join(dataDir, 'klan.json'),
    clanMembers: path.join(dataDir, 'listaklanu.json'),
    statsCache: path.join(dataDir, 'stats_cache.json'),
    season: path.join(dataDir, 'season.json'),
    streamers: path.join(dataDir, 'streamers.json'),
    temporaryVoiceConfig: path.join(dataDir, 'temporary_voice_config.json'),
    tickets: path.join(dataDir, 'tickets.json'),
    youtube: path.join(dataDir, 'youtube.json'),
    anniversaries: path.join(dataDir, 'rocznice.json'),
    clanStats: path.join(dataDir, 'clan_stats.json'),
    tempRoles: path.join(dataDir, 'tempRoles.json'),
    top25Background: rootPath('top25.png'),
    googleServiceAccount: env('GOOGLE_SERVICE_ACCOUNT_FILE', rootPath('google-service-account.json'))
  },
  pubg: {
    apiKey: env('PUBG_API_KEY'),
    platform: env('PUBG_PLATFORM', env('PLATFORM', 'steam')),
    region: env('PUBG_REGION', 'steam'),
    clanId: env('PUBG_CLAN_ID', 'clan.4708615947dc483c871621fc3b24590f'),
    rankedRequestDelayMs: envNumber('PUBG_REQUEST_DELAY_MS', 15000),
    statsCacheTtlMs: envNumber('PUBG_STATS_CACHE_TTL_MS', 60 * 60 * 1000),
    clanLevelCheckMs: envNumber('PUBG_CLAN_LEVEL_CHECK_MS', 60 * 1000)
  },
  voice: {
    standardCategoryId: env('VOICE_STANDARD_CATEGORY_ID', '1393980909857935442'),
    otherGamesCategoryId: env('VOICE_OTHER_GAMES_CATEGORY_ID', '1388858987507880027'),
    technicalChannelId: env('VOICE_TECHNICAL_CHANNEL_ID', '1390991172754997309'),
    logChannelId: env('VOICE_LOG_CHANNEL_ID', '1426515984122122260'),
    creatorNames: envList('VOICE_CREATOR_NAMES', [
      '➕ Normal DUO',
      '➕ Normal SQUAD',
      '➕ Ranked DUO',
      '➕ Ranked SQUAD',
      '➕ FPP SQUAD'
    ])
  },
  tickets: {
    categoryId: env('TICKET_CATEGORY_ID', '1423771690579787856'),
    archiveCategoryId: env('TICKET_ARCHIVE_CATEGORY_ID', '1423772048525885571')
  },
  reactionRoles: {
    channelId: env('REACTION_ROLES_CHANNEL_ID', '1165037966159253524')
  },
  notifications: {
    leaveLogChannelId: env('LEAVE_LOG_CHANNEL_ID', '1370656766651797544'),
    boostSystemChannelId: env('BOOST_SYSTEM_CHANNEL_ID', '1370656766651797544'),
    thankChannelId: env('THANK_CHANNEL_ID', '771352465346002947'),
    youtubeChannelId: env('YOUTUBE_NOTIFY_CHANNEL_ID', '1371120729592037416'),
    youtubeCheckMs: envNumber('YOUTUBE_CHECK_MS', 30 * 60 * 1000),
    twitchChannelName: env('TWITCH_NOTIFY_CHANNEL_NAME', '🔴『stream-online』'),
    streamerRoleName: env('STREAMER_ROLE_NAME', 'Streamer'),
    twitchCheckMs: envNumber('TWITCH_CHECK_MS', 60 * 1000)
  },
  twitch: {
    clientId: env('TWITCH_CLIENT_ID'),
    clientSecret: env('TWITCH_CLIENT_SECRET'),
    accessToken: env('TWITCH_ACCESS_TOKEN')
  },
  google: {
    spreadsheetId: env('GOOGLE_SPREADSHEET_ID', '1jVPsfu08neQOcmK_A47Hp_BhbZubHs2XvsZc0BLaluY')
  },
  wordpress: {
    clanEndpoint: env('WP_CLAN_ENDPOINT', 'http://192.168.0.121/wp-json/devs/v1/klan'),
    clanPromotionEndpoint: env('WP_CLAN_PROMOTION_ENDPOINT', 'http://192.168.0.121/wp-json/devs/v1/klan-promotion'),
    tipEndpoint: env('WP_TIP_ENDPOINT', 'http://192.168.0.121/wp-json/nationaldevils/v1/tip'),
    pageUrl: env('WP_PAGE_URL', 'https://nationaldevils.eu/wp-json/wp/v2/pages/123'),
    user: env('WP_USER'),
    appPassword: env('WP_APP_PASSWORD'),
    eventsUrl: env('WP_EVENTS_URL'),
    eventsToken: env('WP_EVENTS_TOKEN')
  },
  tipply: {
    channelId: env('TIPPLY_CHANNEL_ID', '771352465346002947'),
    widgetUrl: env('TIPPLY_WIDGET_URL'),
    browserExecutablePath: env('PUPPETEER_EXECUTABLE_PATH')
  },
  clan: {
    roleId: env('CLAN_ROLE_ID', '935670014999158815'),
    statsChannelName: env('CLAN_STATS_CHANNEL_NAME', '💬『ogólny』')
  },
  search: {
    allowedChannelId: env('SEARCH_ALLOWED_CHANNEL_ID', '1413600575618285679'),
    pingRoleId: env('SEARCH_PING_ROLE_ID', '1452803163815153929')
  },
  vipRoom: {
    categoryId: env('VIPROOM_CATEGORY_ID', '1393980909857935442'),
    allowedRoleIds: envList('VIPROOM_ALLOWED_ROLE_IDS', [
      '1482730862918500465',
      '874313255802245162'
    ])
  }
};

function requireEnv(name, friendlyName = name) {
  if (!env(name)) {
    throw new Error(`Brakuje zmiennej srodowiskowej: ${friendlyName}`);
  }
}

module.exports = {
  config,
  env,
  envList,
  envNumber,
  requireEnv,
  rootPath
};
