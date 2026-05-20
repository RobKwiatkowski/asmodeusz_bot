// Losowo dzieli osoby z kanalu glosowego na zespoly i publikuje wynik.
const { SlashCommandBuilder, ChannelType } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("losuj")
    .setDescription("Losowo dzieli graczy z kanału głosowego na teamy")
    .addChannelOption(option =>
      option
        .setName("kanal")
        .setDescription("Kanał głosowy z graczami")
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("ilosc")
        .setDescription("Liczba osób w teamie (2–10)")
        .setMinValue(2)
        .setMaxValue(10)
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      // ⏳ Rezerwujemy interakcję
      await interaction.deferReply({ ephemeral: true });

      const voiceChannel = interaction.options.getChannel("kanal");
      const teamSize = interaction.options.getInteger("ilosc");

      // Walidacja kanału
      if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
        return interaction.editReply(
          "❌ Wybrany kanał nie jest kanałem głosowym."
        );
      }

      // Pobranie użytkowników (bez botów)
      const members = [...voiceChannel.members.values()]
        .filter(member => !member.user.bot);

      if (members.length < teamSize) {
        return interaction.editReply(
          "❌ Za mało osób na kanale do losowania."
        );
      }

      // 🔀 Tasowanie (Fisher–Yates)
      for (let i = members.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [members[i], members[j]] = [members[j], members[i]];
      }

      // 👥 Podział na teamy
      const teams = [];
      for (let i = 0; i < members.length; i += teamSize) {
        teams.push(members.slice(i, i + teamSize));
      }

      // 📝 Budowa wiadomości (bez pingów)
      let message = `🎲 LOSOWANIE (teamy ${teamSize}-osobowe)\n\n`;

      teams.forEach((team, index) => {
        message += `**Team ${index + 1}**:\n`;
        team.forEach(member => {
          message += `- ${member.displayName}\n`;
        });
        message += "\n";
      });

      // 📤 Kanał docelowy
      const TARGET_CHANNEL_ID = "1378268584542736414"; //info poprawny kanal
	//  const TARGET_CHANNEL_ID = "1397269748286488586"; //testowy
	  

      const targetChannel = await interaction.guild.channels
        .fetch(TARGET_CHANNEL_ID)
        .catch(() => null);

      if (!targetChannel || !targetChannel.isTextBased()) {
        return interaction.editReply(
          "❌ Nie znaleziono kanału docelowego lub bot nie ma do niego dostępu."
        );
      }

      await targetChannel.send({ content: message });

      // ✅ Finalna odpowiedź
      await interaction.editReply(
        "✅ Teamy zostały wylosowane."
      );

    } catch (err) {
      console.error("❌ Błąd /losuj:", err);

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(
          "❌ Wystąpił błąd podczas losowania."
        );
      }
    }
  }
};
