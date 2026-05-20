// Wysyla lokalna liste klanu do WordPressa.
const { SlashCommandBuilder } = require('discord.js');
const { syncClanToWP } = require('../klan/wpSync');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('klansyncwp')
    .setDescription('Synchronizuje listę klanu z WordPressem'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const result = await syncClanToWP();
      await interaction.editReply(
        `✅ Wysłano listę klanu do WP (${result.count} osób)`
      );
    } catch (err) {
      console.error(err);
      await interaction.editReply(
        '❌ Błąd synchronizacji z WordPressem'
      );
    }
  }
};
