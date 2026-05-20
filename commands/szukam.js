// Komenda /szukam publikuje krotkie ogloszenie o szukaniu graczy do PUBG.
const {
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");
const { config } = require("../src/config");

/* ================= KONFIGURACJA ================= */

const ALLOWED_CHANNEL_ID = config.search.allowedChannelId;
const PUBG_ROLE_ID = config.search.pingRoleId;

/* ================= PAMIĘĆ ================= */

const activeSearches = new Map();
// ownerId => { messageId, channelId }

/* ================= KOMENDA ================= */

const data = new SlashCommandBuilder()
  .setName("szukam")
  .setDescription("Szukam graczy do wspólnej gry (PUBG)")
  .addIntegerOption(option =>
    option
      .setName("liczba_graczy")
      .setDescription("Ilu graczy szukasz?")
      .setRequired(true)
      .addChoices(
        { name: "1 gracz", value: 1 },
        { name: "2 graczy", value: 2 },
        { name: "3 graczy", value: 3 }
      )
  )
  .addStringOption(option =>
    option
      .setName("tryb")
      .setDescription("Tryb gry")
      .setRequired(true)
      .addChoices(
        { name: "Normal", value: "normal" },
        { name: "Ranked", value: "ranked" }
      )
  )
  .addStringOption(option =>
    option
      .setName("widok")
      .setDescription("Widok kamery")
      .setRequired(true)
      .addChoices(
        { name: "TPP", value: "TPP" },
        { name: "FPP", value: "FPP" }
      )
  );

/* ================= EXPORT ================= */

module.exports = {
  data,

  async execute(interaction) {
    // tylko właściwy kanał
    if (interaction.channelId !== ALLOWED_CHANNEL_ID) {
      return interaction.reply({
        content: "❌ Ta komenda działa tylko na kanale ➕『szukam-graczy』",
        ephemeral: true
      });
    }

    // tylko jedno aktywne ogłoszenie
    if (activeSearches.has(interaction.user.id)) {
      return interaction.reply({
        content: "⚠️ Masz już aktywne ogłoszenie.",
        ephemeral: true
      });
    }

    // owner musi być na voice
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: "❌ Musisz być na kanale głosowym, aby utworzyć ogłoszenie.",
        ephemeral: true
      });
    }

    const liczba = interaction.options.getInteger("liczba_graczy");
    const tryb = interaction.options.getString("tryb");
    const widok = interaction.options.getString("widok");

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("🎮 Szukam graczy – PUBG")
      .setDescription(
        `Gracz: ${interaction.user} szuka ludzi do gry: \n\n` +
        `👥 Brakująca liczba graczy: **${liczba}** ㅤㅤ ` +
        ` ⚔️ Tryb: **${tryb.toUpperCase()}** ㅤㅤ` +
        ` 👁️ Widok: **${widok}**\n\n ` +
        //`🎧 **Kanał głosowy:** [Dołącz](https://discord.com/channels/${interaction.guild.id}/${voiceChannel.id})`
		`🎧 **Dołącz do kanału głosowego** https://discord.com/channels/${interaction.guild.id}/${voiceChannel.id}`
      )
      .setFooter({ text: "Ogłoszenie aktywne" })
      .setTimestamp();

    await interaction.reply({
      content: "📢 Ogłoszenie zostało opublikowane",
      ephemeral: true
    });

    const message = await interaction.channel.send({
      content: `<@&${PUBG_ROLE_ID}>`,
      embeds: [embed]
    });

    activeSearches.set(interaction.user.id, {
      messageId: message.id,
      channelId: interaction.channel.id
    });

    // auto-usunięcie po 20 minutach (opcjonalne)
    setTimeout(() => {
      message.delete().catch(() => {});
      activeSearches.delete(interaction.user.id);
    }, 20 * 60 * 1000);
  },

  /* ================= EVENT VOICE ================= */

  registerVoiceListener(client) {
    client.on("voiceStateUpdate", async (oldState, newState) => {
      // interesuje nas tylko wyjście z voice
      if (oldState.channelId && !newState.channelId) {
        const search = activeSearches.get(oldState.id);
        if (!search) return;

        try {
          const textChannel = await oldState.guild.channels.fetch(search.channelId);
          const message = await textChannel.messages.fetch(search.messageId);

          const embed = EmbedBuilder.from(message.embeds[0])
            .setColor(0xe74c3c)
            .setFooter({ text: "❌ Ogłoszenie nieaktualne – gracz opuścił kanał głosowy" });

          await message.edit({ embeds: [embed] });
        } catch (err) {}

        activeSearches.delete(oldState.id);
      }
    });
  }
};
