// Reczne dodanie wplaty, gdy automatyczny listener Tipply nie zlapal zdarzenia.
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { config } = require('../src/config');

module.exports = {

data: new SlashCommandBuilder()
.setName('tipmanual')
.setDescription('Dodaj ręcznie wpłatę z Tipply')
.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)

.addStringOption(option =>
option.setName('nick')
.setDescription('Nick wspierającego')
.setRequired(true))

.addNumberOption(option =>
option.setName('kwota')
.setDescription('Kwota wpłaty')
.setRequired(true))

.addStringOption(option =>
option.setName('wiadomosc')
.setDescription('Wiadomość od wspierającego')
.setRequired(false)),

async execute(interaction) {

const MOD_ROLE_ID = config.discord.moderatorRoleId;

if (!interaction.member.roles.cache.has(MOD_ROLE_ID)) {

return interaction.reply({
content: "❌ Nie masz uprawnień do użycia tej komendy.",
ephemeral: true
});

}

const nick = interaction.options.getString('nick');
const amount = interaction.options.getNumber('kwota');
const message = interaction.options.getString('wiadomosc') || "Brak wiadomości";

let color = "#2ecc71";

if (amount >= 100) color = "#f1c40f";
else if (amount >= 50) color = "#9b59b6";
else if (amount >= 10) color = "#3498db";

const embed = new EmbedBuilder()
.setColor(color)
.setTitle("💰 Nowa wpłata!")
.addFields(
{ name: "👤 Wspierający", value: nick, inline: true },
{ name: "💵 Kwota", value: `${amount.toFixed(2)} PLN`, inline: true },
{ name: "💬 Wiadomość", value: message }
)
.setFooter({
text: "Ty też możesz zostać naszym sponsorem! | tipply.pl/@nationaldevils"
})
.setTimestamp();

await interaction.channel.send({ embeds: [embed] });

await interaction.reply({
content: "✅ Ręczna wpłata została dodana.",
ephemeral: true
});

}
};
