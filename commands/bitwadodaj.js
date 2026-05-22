// Dodaje wynik bitwy klanowej do Google Sheets i publikuje ogloszenie na Discordzie.
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { sheets, SPREADSHEET_ID } = require('../utils/googleSheets');

const MAP_CHOICES = [
  { name: 'Erangel', value: 'Erangel' },
  { name: 'Miramar', value: 'Miramar' },
  { name: 'Sanhok', value: 'Sanhok' },
  { name: 'Vikendi', value: 'Vikendi' },
  { name: 'Taego', value: 'Taego' },
  { name: 'Deston', value: 'Deston' },
  { name: 'Karakin', value: 'Karakin' },
  { name: 'Paramo', value: 'Paramo' },
  { name: 'Rondo', value: 'Rondo' },
];

module.exports = {
data: new SlashCommandBuilder()
  .setName('bitwadodaj')
  .setDescription('Dodaje wynik Bitwy Klanowej')

  // 🔹 NAJPIERW WSZYSTKIE WYMAGANE
  .addStringOption(o => o.setName('klan_a').setDescription('Klan A').setRequired(true))
  .addStringOption(o => o.setName('klan_b').setDescription('Klan B').setRequired(true))
  .addStringOption(o => o.setName('rozgrzewka').setDescription('np. 8-6').setRequired(true))
  .addStringOption(o => o.setName('gra1').setDescription('np. 10-5').setRequired(true))
  .addStringOption(o => o.setName('gra2').setDescription('np. 6-8').setRequired(true))

  .addStringOption(o => o.setName('mapa1').setDescription('Mapa 1').setRequired(true).addChoices(...MAP_CHOICES))
  .addStringOption(o => o.setName('mapa2').setDescription('Mapa 2').setRequired(true).addChoices(...MAP_CHOICES))
  .addStringOption(o => o.setName('mapa3').setDescription('Mapa 3').setRequired(true).addChoices(...MAP_CHOICES))
  .addStringOption(o => o.setName('mapa4').setDescription('Mapa 4').setRequired(true).addChoices(...MAP_CHOICES))

  // 🔹 NA KOŃCU OPCJONALNE
  .addStringOption(o => o.setName('gra3').setDescription('opcjonalnie')),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    // 🔒 Sprawdzenie roli
    const requiredRole = interaction.guild.roles.cache.find(r => r.name === 'Bitwy Klanowe Support');
    if (!requiredRole || !interaction.member.roles.cache.has(requiredRole.id)) {
      return interaction.editReply('❌ Nie masz uprawnień do użycia tej komendy.');
    }

    try {
      const klanA = interaction.options.getString('klan_a').toUpperCase();
      const klanB = interaction.options.getString('klan_b').toUpperCase();
      const roz = interaction.options.getString('rozgrzewka');
      const g1 = interaction.options.getString('gra1');
      const g2 = interaction.options.getString('gra2');
      const g3 = interaction.options.getString('gra3') || '';

      const mapy = [
        interaction.options.getString('mapa1'),
        interaction.options.getString('mapa2'),
        interaction.options.getString('mapa3'),
        interaction.options.getString('mapa4'),
      ];

      if (new Set(mapy).size !== 4) {
        return interaction.editReply('❌ Nie możesz wybrać tej samej mapy więcej niż raz.');
      }

      const mapyTekst = mapy.join(', ');

      // 🔎 znajdź pierwszy wolny wiersz
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Mecze!B:B',
      });

      const nextRow = (res.data.values?.length || 1) + 1;

      // ✍️ wpisz dane meczu (B–H)
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Mecze!B${nextRow}:H${nextRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            new Date().toISOString().slice(0, 10),
            klanA,
            klanB,
            roz,
            g1,
            g2,
            g3
          ]],
        },
      });

      // 🗺️ mapy do kolumny N
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Mecze!N${nextRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[mapyTekst]],
        },
      });

      await interaction.editReply(`✅ Bitwa ${klanA} vs ${klanB} została dodana.`);

      // 📢 OGŁOSZENIE
      const channel = interaction.guild.channels.cache.find(c => c.name === '👩🏻‍💻︱główny');
      if (channel) {
        const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');

// 📥 pobierz wynik i zwycięzcę z arkusza
const wynikRes = await sheets.spreadsheets.values.get({
  spreadsheetId: SPREADSHEET_ID,
  range: `Mecze!K${nextRow}:L${nextRow}`,
});

const wynik = wynikRes.data.values?.[0]?.[0] || 'brak';
const zwyciezca = wynikRes.data.values?.[0]?.[1] || 'nieznany';

// 🖼️ załącznik z grafiką
const imagePath = path.join(__dirname, '../assets/bitwa.png');
const attachment = new AttachmentBuilder(imagePath);

// 🎨 embed
const embed = new EmbedBuilder()
  .setColor(0xff0000)
  .setTitle('🏆 Kolejna Bitwa Klanowa za nami!')
  .setDescription(
    `Rozegrana pomiędzy **${klanA}** i **${klanB}**.\n\n` +
    `🥇 Zwycięzca: **${zwyciezca}**\n` +
    `🔥 Wynik: **${wynik}**\n\n` +
    `🗺️ Mapy: ${mapyTekst}`
  )
  .setImage('attachment://bitwa.png')
  .setFooter({ text: 'System Bitw Klanowych DEVS' })
  .setTimestamp();

// 📢 wyślij na kanał
const channel = interaction.guild.channels.cache.find(c => c.name === '👩🏻‍💻︱główny');
if (channel) {
  channel.send({ embeds: [embed], files: [attachment] });
}

      }

    } catch (err) {
      console.error(err);
      await interaction.editReply('❌ Wystąpił błąd podczas zapisu do arkusza.');
    }
  },
};
