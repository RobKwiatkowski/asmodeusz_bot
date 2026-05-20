// Slash command do dodawania i usuwania obserwowanych kanalow YouTube.
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { config } = require('../src/config');
const { readJson, writeJson } = require('../src/jsonStore');
const { resolveChannelId } = require('../src/features/youtube');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('youtube')
    .setDescription('Zarzadzanie powiadomieniami YouTube')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand(sub =>
      sub
        .setName('dodaj')
        .setDescription('Dodaje kanal YouTube do obserwowania')
        .addStringOption(option =>
          option
            .setName('nazwa')
            .setDescription('Nazwa widoczna w powiadomieniu')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('kanal')
            .setDescription('@alias, link albo channel ID')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('usun')
        .setDescription('Usuwa kanal z obserwowanych')
        .addStringOption(option =>
          option
            .setName('nazwa')
            .setDescription('Nazwa dodana w /youtube dodaj')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const sub = interaction.options.getSubcommand();
    const data = readJson(config.files.youtube, { users: {} });

    if (sub === 'dodaj') {
      const name = interaction.options.getString('nazwa');
      const input = interaction.options.getString('kanal');
      const channelId = await resolveChannelId(input).catch(() => null);
      if (!channelId) {
        await interaction.editReply('Nie udalo sie odnalezc kanalu YouTube.');
        return;
      }

      data.users[name] = { channelId, lastVideoId: null };
      writeJson(config.files.youtube, data);
      await interaction.editReply(`Kanal YouTube **${name}** zostal dodany.`);
      return;
    }

    if (sub === 'usun') {
      const name = interaction.options.getString('nazwa');
      delete data.users[name];
      writeJson(config.files.youtube, data);
      await interaction.editReply(`Kanal YouTube **${name}** zostal usuniety.`);
    }
  }
};
