// Komenda /statystyki korzysta z oficjalnego PUBG API i pokazuje podstawowe
// statystyki solo/duo/squad dla podanego nicku.
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { config } = require('../src/config');
const { getCurrentSeason, getPlayerByName, pubgRequest } = require('../src/pubgApi');

function formatKD(kills, deaths) {
  if (!deaths) return Number(kills || 0).toFixed(2);
  return (kills / deaths).toFixed(2);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('statystyki')
    .setDescription('Statystyki gracza PUBG')
    .addStringOption(option =>
      option
        .setName('nick')
        .setDescription('Nick gracza PUBG')
        .setRequired(true)
    ),

  async execute(interaction) {
    const nick = interaction.options.getString('nick');
    await interaction.deferReply();

    try {
      const player = await getPlayerByName(nick);
      if (!player) {
        await interaction.editReply(`Nie znaleziono gracza **${nick}**.`);
        return;
      }

      const seasonId = await getCurrentSeason();
      if (!seasonId) {
        await interaction.editReply('Nie znaleziono aktualnego sezonu PUBG.');
        return;
      }

      const statsData = await pubgRequest(
        `https://api.pubg.com/shards/${config.pubg.platform}/players/${player.id}/seasons/${seasonId}`
      );

      const gameModeStats = statsData.data.attributes.gameModeStats;
      const solo = gameModeStats.solo;
      const duo = gameModeStats.duo;
      const squad = gameModeStats.squad;

      const embed = new EmbedBuilder()
        .setTitle(`PUBG - ${nick}`)
        .setColor(0xF2A900)
        .setDescription(`Platforma: **${config.pubg.platform.toUpperCase()}**\nSezon: **${seasonId}**`)
        .addFields(
          {
            name: 'SOLO',
            value:
              `Mecze: **${solo.roundsPlayed}**\n` +
              `Wygrane: **${solo.wins}**\n` +
              `Top 10: **${solo.top10s}**\n` +
              `Kille: **${solo.kills}**\n` +
              `KD: **${formatKD(solo.kills, solo.losses)}**\n` +
              `DMG: **${Math.round(solo.damageDealt)}**`,
            inline: true
          },
          {
            name: 'DUO',
            value:
              `Mecze: **${duo.roundsPlayed}**\n` +
              `Wygrane: **${duo.wins}**\n` +
              `Top 10: **${duo.top10s}**\n` +
              `Kille: **${duo.kills}**\n` +
              `KD: **${formatKD(duo.kills, duo.losses)}**\n` +
              `DMG: **${Math.round(duo.damageDealt)}**`,
            inline: true
          },
          {
            name: 'SQUAD',
            value:
              `Mecze: **${squad.roundsPlayed}**\n` +
              `Wygrane: **${squad.wins}**\n` +
              `Top 10: **${squad.top10s}**\n` +
              `Kille: **${squad.kills}**\n` +
              `KD: **${formatKD(squad.kills, squad.losses)}**\n` +
              `DMG: **${Math.round(squad.damageDealt)}**`,
            inline: true
          }
        )
        .setFooter({ text: 'National Devils - oficjalne PUBG API' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('[statystyki] Blad:', error);
      await interaction.editReply('Blad pobierania danych PUBG.');
    }
  }
};
