// Pokazuje ranking klanow w bitwach klanowych na podstawie Google Sheets.
const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const {
  formatGoogleSheetsError,
  getGoogleSheetsDebugInfo,
  getSheetValues,
} = require('../utils/googleSheets');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ranking')
    .setDescription('Pokazuje ranking TOP klanow w Bitwach Klanowych'),

  async execute(interaction) {
    await interaction.deferReply();

    const range = 'Klany!A2:H';

    try {
      const debugInfo = getGoogleSheetsDebugInfo();
      console.log(
        `[ranking] Start /ranking | guild=${interaction.guildId} | ` +
        `user=${interaction.user?.tag || interaction.user?.id} | ` +
        `spreadsheet=${debugInfo.spreadsheetId} | range=${range}`
      );

      let clans = await getSheetValues(range, 'ranking');

      clans = clans
        .filter(row => row[0])
        .map(row => ({
          nazwa: row[0],
          rozegrane: parseInt(row[1], 10) || 0,
          wygrane: parseInt(row[2], 10) || 0,
          przegrane: parseInt(row[3], 10) || 0,
          skut: parseFloat(row[4]) || 0,
          bilans: parseInt(row[7], 10) || 0
        }));

      clans.sort((a, b) =>
        b.wygrane - a.wygrane ||
        b.skut - a.skut ||
        b.bilans - a.bilans ||
        a.nazwa.localeCompare(b.nazwa)
      );

      const top = clans.slice(0, 10);

      if (top.length === 0) {
        console.warn('[ranking] Brak danych po przefiltrowaniu arkusza.');
        return interaction.editReply('Brak danych do wyswietlenia rankingu.');
      }

      const medals = ['🥇', '🥈', '🥉'];
      const maxNameLength = Math.max(...top.map(clan => clan.nazwa.length));

      const lines = top.map((clan, index) => {
        const medal = medals[index] || `${index + 1}.`;
        const skut = clan.rozegrane > 0
          ? ((clan.wygrane / clan.rozegrane) * 100).toFixed(0)
          : 0;
        const namePadded = clan.nazwa.padEnd(maxNameLength, ' ');

        return `${medal} ${namePadded} - ${clan.wygrane} Wygrane / ${clan.przegrane} Przegrane (${skut}%)`;
      });

      console.log(`[ranking] Przygotowano TOP ${top.length} klanow.`);

      const desc = '```yaml\n' + lines.join('\n') + '\n```';
      const imagePath = path.join(__dirname, '../assets/ranking.png');
      console.log(`[ranking] Uzywam grafiki: ${imagePath}`);
      const attachment = new AttachmentBuilder(imagePath);

      const embed = new EmbedBuilder()
        .setColor(0xF1C40F)
        .setTitle('Ranking Klanow - Bitwy Klanowe')
        .setDescription(desc)
        .setImage('attachment://ranking.png')
        .setFooter({ text: 'Ranking na podstawie wygranych bitew klanowych' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed], files: [attachment] });
      console.log('[ranking] Odpowiedz wyslana poprawnie.');
    } catch (error) {
      console.error(`[ranking] Blad wykonania: ${formatGoogleSheetsError(error)}`);
      console.error(error);
      await interaction.editReply('❌ Blad podczas pobierania danych z arkusza.');
    }
  },
};
