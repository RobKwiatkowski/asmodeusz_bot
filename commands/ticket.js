// Slash command tworzy panel z przyciskiem do otwierania ticketow.
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Publikuje przycisk do otwierania zgloszenia'),

  async execute(interaction) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_ticket')
        .setLabel('Otworz zgloszenie')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.channel.send({
      content: 'Kliknij przycisk, aby otworzyc zgloszenie:',
      components: [row]
    });

    await interaction.reply({ content: 'Panel ticketow zostal opublikowany.', ephemeral: true });
  }
};
