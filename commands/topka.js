// Slash command dla listy klanowiczow i rankingu TOP25 PUBG.
const { AttachmentBuilder, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { config } = require('../src/config');
const { readJson, writeJson } = require('../src/jsonStore');
const { generateTopka, renderTop25Buffer } = require('../src/features/pubgTop');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('topka')
    .setDescription('Zarzadzanie topka PUBG klanu')
    .addSubcommand(sub =>
      sub
        .setName('dodaj')
        .setDescription('Dodaje nick PUBG do listy klanowej topki')
        .addStringOption(option =>
          option
            .setName('nick')
            .setDescription('Nick PUBG')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('usun')
        .setDescription('Usuwa nick PUBG z listy klanowej topki')
        .addStringOption(option =>
          option
            .setName('nick')
            .setDescription('Nick PUBG')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('odswiez')
        .setDescription('Odswieza cache danych z PUBG API')
    )
    .addSubcommand(sub =>
      sub
        .setName('top25')
        .setDescription('Wysyla obrazek TOP25')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (['dodaj', 'usun', 'odswiez'].includes(sub) && !interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      await interaction.reply({ content: 'Ta akcja jest tylko dla moderatorow.', ephemeral: true });
      return;
    }

    if (sub === 'dodaj') {
      const nick = interaction.options.getString('nick');
      const clanList = readJson(config.files.clanList, []);
      if (clanList.includes(nick)) {
        await interaction.reply({ content: 'Ten nick juz jest na liscie.', ephemeral: true });
        return;
      }

      clanList.push(nick);
      writeJson(config.files.clanList, clanList);
      await interaction.reply({ content: `Dodano **${nick}** do listy topki.`, ephemeral: true });
      return;
    }

    if (sub === 'usun') {
      const nick = interaction.options.getString('nick');
      const clanList = readJson(config.files.clanList, []);
      writeJson(config.files.clanList, clanList.filter(item => item !== nick));
      await interaction.reply({ content: `Usunieto **${nick}** z listy topki.`, ephemeral: true });
      return;
    }

    if (sub === 'odswiez') {
      await interaction.deferReply({ ephemeral: true });
      await generateTopka();
      await interaction.editReply('Topka zostala odswiezona.');
      return;
    }

    if (sub === 'top25') {
      await interaction.deferReply();
      const buffer = await renderTop25Buffer();
      if (!buffer) {
        await interaction.editReply('Brak danych w cache. Uzyj `/topka odswiez`.');
        return;
      }

      const attachment = new AttachmentBuilder(buffer, { name: 'top25.png' });
      await interaction.editReply({ files: [attachment] });
    }
  }
};
