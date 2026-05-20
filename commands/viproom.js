// Tworzy tymczasowy VIPROOM dla rol wspierajacych serwer.
const {
    SlashCommandBuilder,
    ChannelType
} = require('discord.js');
const { config } = require('../src/config');

const CATEGORY_ID = config.vipRoom.categoryId;

// userID -> channelID
const activeRooms = new Map();

module.exports = {

data: new SlashCommandBuilder()
    .setName('viproom')
    .setDescription('Tworzy tymczasowy VIP pokój głosowy')
    .addIntegerOption(option =>
        option.setName('liczba_osob')
        .setDescription('Limit osób w pokoju')
        .setRequired(false)
    ),

async execute(interaction) {

    const member = interaction.member;

    // sprawdzanie ról
    if (!config.vipRoom.allowedRoleIds.some(role => member.roles.cache.has(role))) {
        return interaction.reply({
            content: "❌ Nie masz uprawnień do tworzenia VIPROOM.",
            flags: 64
        });
    }

    // blokada jednego pokoju
    if (activeRooms.has(member.id)) {

        const existingChannel = interaction.guild.channels.cache.get(
            activeRooms.get(member.id)
        );

        if (existingChannel) {
            return interaction.reply({
                content: `❌ Masz już aktywny VIPROOM: ${existingChannel}`,
                flags: 64
            });
        }

        activeRooms.delete(member.id);
    }

    const limit = interaction.options.getInteger('liczba_osob') || 4;

    const channelName = `VIPROOM | ${interaction.member.displayName}`;

    try {

        const channel = await interaction.guild.channels.create({
            name: channelName,
            type: ChannelType.GuildVoice,
            parent: CATEGORY_ID,
            userLimit: limit
        });

        // zapis aktywnego pokoju
        activeRooms.set(member.id, channel.id);

        // przeniesienie użytkownika
        await member.voice.setChannel(channel).catch(()=>{});

        await interaction.reply({
            content: `✅ Utworzono kanał ${channel}`,
            flags: 64
        });

    } catch (error) {

        console.error("VIPROOM error:", error);

        if (!interaction.replied) {
            await interaction.reply({
                content: "❌ Nie udało się utworzyć kanału.",
                flags: 64
            });
        }

    }

},

registerVoiceListener(client) {
    // Usuwa VIPROOM, kiedy ostatnia osoba wyjdzie z kanalu.
    client.on("voiceStateUpdate", async (oldState, newState) => {
        const channel = newState.channel || oldState.channel;
        if (!channel) return;

        const entry = [...activeRooms.entries()].find(([, channelId]) => channelId === channel.id);
        if (!entry) return;

        if (channel.members.size === 0) {
            activeRooms.delete(entry[0]);
            await channel.delete().catch(() => {});
        }
    });
}
};
