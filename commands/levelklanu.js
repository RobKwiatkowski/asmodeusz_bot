// Reczna komenda do odswiezenia poziomu klanu na stronie WordPress.
const { SlashCommandBuilder } = require("discord.js");
const updateWordpressKlanLvl = require("../utils/updateWordpressKlanLvl");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("levelklanu")
    .setDescription("Ręcznie aktualizuje poziom klanu DEVS na stronie"),

  async execute(interaction) {
  console.log("🧪 /levelklanu START");

  await interaction.deferReply({ ephemeral: true });

  try {
    console.log("🧪 Wywołuję updateWordpressKlanLvl()");
    const result = await updateWordpressKlanLvl();
    console.log("🧪 Funkcja zakończona, result =", result);

    if (result) {
      await interaction.editReply("✅ OK – strona zaktualizowana");
    } else {
      await interaction.editReply("❌ BŁĄD – sprawdź konsolę bota");
    }

  } catch (err) {
    console.error("❌ Błąd w execute():", err);
    await interaction.editReply("❌ Wyjątek – sprawdź konsolę");
  }
}

};
