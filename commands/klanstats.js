// Pokazuje statystyki wybranego klanu pobrane z Google Sheets.
const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { sheets, SPREADSHEET_ID } = require('../utils/googleSheets');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('klanstats')
    .setDescription('Pokazuje statystyki wybranego klanu')
    .addStringOption(option =>
      option
        .setName('klan')
        .setDescription('Nazwa klanu (np. DEVS)')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const klan = interaction.options.getString('klan').toUpperCase();

    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Klany!A2:I',
      });

      const rows = res.data.values || [];
      const row = rows.find(r => r[0]?.toUpperCase() === klan);

      if (!row) {
        return interaction.editReply(`❌ Klan **${klan}** nie istnieje w bazie.`);
      }

      const [
        nazwa,
        rozegrane,
        wygrane,
        przegrane,
        skutecznosc,
        wygraneGry,
        przegraneGry,
        bilans,
        ostatniMecz
      ] = row;

      // 🔢 format skuteczności
      let skut = parseFloat(skutecznosc);
      if (isNaN(skut)) skut = 0;
      if (skut <= 1) skut *= 100;
      const skutText = `${skut.toFixed(0)}%`;

      // 🎨 kolor zależny od skuteczności
      let color = 0xED4245; // czerwony
      if (skut >= 70) color = 0x57F287; // zielony
      else if (skut >= 40) color = 0xFEE75C; // żółty

      // 🖼️ grafika
      const imagePath = path.join(__dirname, '../assets/klan.png');
      const attachment = new AttachmentBuilder(imagePath);

      // 📊 pasek skuteczności (ASCII)
const barLength = 10;
const filled = Math.round((skut / 100) * barLength);



const embed = new EmbedBuilder()
  .setColor(color)
  .setTitle('**Aktualne wyniki w systemie Bitw Klanowych**')
  .setDescription(`🏆 Statystyki klanu **${nazwa}** \n ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ `)
  .addFields(
    {
      name: '⚔️ BITWY KLANOWE',
      value:
        `\u200B \u200B \u200B \u200B \u200B \u200B \u200B Rozegrane: **${rozegrane}**\n` +
        `\u200B \u200B \u200B \u200B \u200B \u200B \u200B Wygrane: **${wygrane}**\n` +
        `\u200B \u200B \u200B \u200B \u200B \u200B \u200B Przegrane: **${przegrane || 0}**`,
      inline: true
    },
    {
      name: '🎯 SKUTECZNOŚĆ',
      value:
        `\u200B \u200B \u200B \u200B \u200B \u200B \u200B **${skutText}**\n`,
      inline: true
    },
    {
      name: '🗡️ MECZE',
      value:
        `\u200B \u200B \u200B \u200B \u200B \u200B \u200B Wygrane: **${wygraneGry || 0}**\n` +
        `\u200B \u200B \u200B \u200B \u200B \u200B \u200B Przegrane: **${przegraneGry || 0}**`,
      inline: true
    },
    {
      name: '📈 BILANS GIER',
      value: `\u200B \u200B \u200B \u200B \u200B \u200B \u200B **${bilans || 0}**`,
      inline: true
    },
    {
      name: '🕒 OSTATNI MECZ',
      value: `\u200B \u200B \u200B \u200B \u200B \u200B \u200B **${ostatniMecz || 'Brak danych'}**`,
      inline: true
    },
	{ name: '\u200B',
	value: '\u200B',
	inline: true }
  )
  .setImage('attachment://klan.png')
  .setFooter({ text: 'System Bitw Klanowych' })
  .setTimestamp();


      await interaction.editReply({ embeds: [embed], files: [attachment] });

    } catch (err) {
      console.error(err);
      await interaction.editReply('❌ Błąd podczas pobierania danych z arkusza.');
    }
  },
};
