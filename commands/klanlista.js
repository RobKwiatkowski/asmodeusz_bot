// Wyswietla embed z aktualna lokalna lista czlonkow klanu DEVS.
const { SlashCommandBuilder } = require('discord.js');
const { createClanEmbed } = require('../klan/clanEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('klanlista')
    .setDescription('Wyświetla listę członków klanu DEVS'),

  async execute(interaction) {
    try {
      const embed = createClanEmbed();
      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error('Błąd /klanlista:', err);
      await interaction.reply({
        content: '❌ Nie udało się wygenerować listy klanu.',
        ephemeral: true
      });
    }
  }
};
