// Slash command do zarzadzania lista streamerow Twitch.
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { config } = require('../src/config');
const { readJson, writeJson } = require('../src/jsonStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('streamer')
    .setDescription('Zarzadzanie streamerami Twitch')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(sub =>
      sub
        .setName('dodaj')
        .setDescription('Dodaje streamera')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('Uzytkownik Discord')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('twitch')
            .setDescription('Nazwa kanalu Twitch')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('usun')
        .setDescription('Usuwa streamera')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('Uzytkownik Discord')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('lista')
        .setDescription('Pokazuje liste streamerow')
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const sub = interaction.options.getSubcommand();
    const role = interaction.guild.roles.cache.find(item => item.name === config.notifications.streamerRoleName);
    let streamers = readJson(config.files.streamers, []);

    if (sub === 'dodaj') {
      const user = interaction.options.getUser('user');
      const member = await interaction.guild.members.fetch(user.id);
      const twitchName = interaction.options.getString('twitch');

      if (streamers.find(item => item.id === member.id)) {
        await interaction.editReply('Ten uzytkownik juz jest na liscie.');
        return;
      }

      streamers.push({ id: member.id, twitchName });
      writeJson(config.files.streamers, streamers);
      if (role) await member.roles.add(role).catch(() => {});
      await interaction.editReply(`Dodano ${member.user.tag} jako **${twitchName}**.`);
      return;
    }

    if (sub === 'usun') {
      const user = interaction.options.getUser('user');
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      streamers = streamers.filter(item => item.id !== user.id);
      writeJson(config.files.streamers, streamers);
      if (role && member) await member.roles.remove(role).catch(() => {});
      await interaction.editReply(`Usunieto ${user.tag} z listy streamerow.`);
      return;
    }

    if (sub === 'lista') {
      if (streamers.length === 0) {
        await interaction.editReply('Lista streamerow jest pusta.');
        return;
      }
      await interaction.editReply(streamers.map(item => `- ${item.twitchName}`).join('\n'));
    }
  }
};
