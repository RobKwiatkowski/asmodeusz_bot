// Pokazuje ranking klanow w bitwach klanowych na podstawie Google Sheets.
const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { sheets, SPREADSHEET_ID } = require('../utils/googleSheets');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ranking')
    .setDescription('Pokazuje ranking TOP klanów w Bitwach Klanowych'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Klany!A2:H',
      });

      let clans = res.data.values || [];

      clans = clans
        .filter(r => r[0]) // musi mieć nazwę
        .map(r => ({
          nazwa: r[0],
          rozegrane: parseInt(r[1]) || 0,
          wygrane: parseInt(r[2]) || 0,
          przegrane: parseInt(r[3]) || 0,
          skut: parseFloat(r[4]) || 0,
          bilans: parseInt(r[7]) || 0
        }));

      // 🏆 SORTOWANIE Z TIEBREAKERAMI
      clans.sort((a, b) =>
        b.wygrane - a.wygrane ||     // 1️⃣ wygrane bitwy
        b.skut - a.skut ||           // 2️⃣ skuteczność
        b.bilans - a.bilans ||       // 3️⃣ bilans gier
        a.nazwa.localeCompare(b.nazwa) // 4️⃣ alfabet
      );

      const top = clans.slice(0, 10);

      if (top.length === 0) {
        return interaction.editReply('Brak danych do wyświetlenia rankingu.');
      }

      const medals = ['🥇', '🥈', '🥉'];

      // 📏 najdłuższa nazwa do wyrównania kolumn
      const maxNameLength = Math.max(...top.map(c => c.nazwa.length));

      const lines = top.map((c, i) => {
        const medal = medals[i] || `${i + 1}.`;
        const skut = c.rozegrane > 0
          ? ((c.wygrane / c.rozegrane) * 100).toFixed(0)
          : 0;

        const namePadded = c.nazwa.padEnd(maxNameLength, ' ');

        return `${medal} ${namePadded} — ${c.wygrane} Wygrane / ${c.przegrane} Przegrane (${skut}%)`;
      });

      const desc = '```yaml\n' + lines.join('\n') + '\n```';

      // 🖼️ Logo
      const imagePath = path.join(__dirname, '../assets/ranking.png');
      const attachment = new AttachmentBuilder(imagePath);

      const embed = new EmbedBuilder()
        .setColor(0xF1C40F)
        .setTitle('🏆 Ranking Klanów — Bitwy Klanowe')
        .setDescription(desc)
        .setImage('attachment://ranking.png')
        .setFooter({ text: 'Ranking na podstawie wygranych bitew klanowych' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed], files: [attachment] });

    } catch (err) {
      console.error(err);
      await interaction.editReply('❌ Błąd podczas pobierania danych z arkusza.');
    }
  },
};
