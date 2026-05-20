// Reaction roles: klikniecie emoji nadaje role, a usuniecie reakcji odbiera role.
const { config } = require('../src/config');
const REACTION_CHANNEL_ID = config.reactionRoles.channelId;

const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits
} = require('discord.js');

// ======================================================
// MAPA EMOJI → ROLE 
// ======================================================
const roleMap = {
    "<:drop:1442243495019413639>": "1442234861627773030", // PUBG
    "🚜": "1423546933993279508", // FS25
    "❄️": "1437733867413835938", // SnowRunner
    "🪖": "1441742123216011314", // Battlefield
    "⛏️": "1421592650460430366", // Minecraft
    "🔍": "1452803163815153929", // Szukajka graczy
    "🏆": "1452803259239497788", // Eventy
    "<:blindspot:1473619199338352745>": "1470022146448293974", // PUBG Blindspot
    "<:quake3:1473618320652763269>": "1474143428177694761" // Quake 3
};

// ======================================================
// ID WIADOMOŚCI Z REACTION ROLES (AKTUALNE!)
// ======================================================
let reactionMessageId = "1442246944499175524";

module.exports = {

    // ======================================================
    // SLASH COMMAND
    // ======================================================
    data: new SlashCommandBuilder()
        .setName('reactionroles')
        .setDescription('Zarządzanie reaction roles')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand(sub =>
            sub
                .setName('create')
                .setDescription('Tworzy wiadomość z reakcjami do nadawania ról')
        )
        .addSubcommand(sub =>
            sub
                .setName('sync')
                .setDescription('Synchronizuje role z istniejących reakcji')
        ),

    // ======================================================
    // OBSŁUGA KOMENDY
    // ======================================================
    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({
                content: "❌ Ta komenda działa tylko na serwerze.",
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        const sub = interaction.options.getSubcommand();

        // --------------------------------------------------
        // /reactionroles create
        // --------------------------------------------------
        if (sub === 'create') {
            try {
                const embed = new EmbedBuilder()
                    .setTitle('🎮 Wybierz gry, które Cię interesują')
                    .setDescription(
                        'Kliknij ikonę reakcji, aby otrzymać rolę:\n\n' +
                        '<:drop:1442243495019413639> — PUBG\n' +
                        '🚜 — Farming Simulator 25\n' +
                        '❄️ — SnowRunner\n' +
                        '🪖 — Battlefield\n' +
                        '⛏️ — Minecraft\n' +
                        '🔍 — Szukajka graczy\n' +
                        '🏆 — Eventy / turnieje\n' +
                        '<:blindspot:1473619199338352745> — PUBG Blindspot\n' +
                        '<:quake3:1473618320652763269> — Quake 3 Arena'
                    )
                    .setColor('Blue');

                const msg = await interaction.channel.send({ embeds: [embed] });
                reactionMessageId = msg.id;

                for (const emoji of Object.keys(roleMap)) {
                    await msg.react(emoji).catch(() => {});
                }

                await interaction.editReply({
                    content: "✔️ Wiadomość reaction roles została utworzona!"
                });

            } catch (e) {
                console.error(e);
                await interaction.editReply({
                    content: "❌ Błąd podczas tworzenia reaction roles."
                });
            }
        }

        // --------------------------------------------------
        // /reactionroles sync
        // --------------------------------------------------
        if (sub === 'sync') {
            let added = 0;
            let skipped = 0;

            try {
                const channel = await interaction.guild.channels.fetch(REACTION_CHANNEL_ID);
                const message = await channel.messages.fetch(reactionMessageId);

                for (const [emojiKey, roleId] of Object.entries(roleMap)) {
                    const reaction = message.reactions.cache.find(r => {
                        if (r.emoji.id) {
                            return `<:${r.emoji.name}:${r.emoji.id}>` === emojiKey;
                        }
                        return r.emoji.name === emojiKey;
                    });

                    if (!reaction) continue;

                    const users = await reaction.users.fetch();

                    for (const [userId, user] of users) {
                        if (user.bot) continue;

                        const member = await interaction.guild.members.fetch(userId).catch(() => null);
                        if (!member) continue;

                        if (member.roles.cache.has(roleId)) {
                            skipped++;
                            continue;
                        }

                        await member.roles.add(roleId);
                        added++;
                    }
                }

                await interaction.editReply({
                    content:
                        `🔄 **Synchronizacja zakończona**\n\n` +
                        `✅ Nadano ról: **${added}**\n` +
                        `⏭️ Pominięto (już mieli): **${skipped}**`
                });

            } catch (e) {
                console.error(e);
                await interaction.editReply({
                    content: "❌ Błąd podczas synchronizacji reaction roles."
                });
            }
        }
    },

    // ======================================================
    // OBSŁUGA REAKCJI (LIVE)
    // ======================================================
    registerReactionHandler(client) {

        // ---------------------------
        // DODANIE REAKCJI
        // ---------------------------
        client.on('messageReactionAdd', async (reaction, user) => {
            if (user.bot) return;

            try {
                if (reaction.partial) await reaction.fetch();
                if (reaction.message.partial) await reaction.message.fetch();
            } catch {
                return;
            }

            console.log(
                "REACTION ADD:",
                reaction.emoji.name,
                reaction.emoji.id,
                reaction.message.id
            );

            if (reaction.message.id !== reactionMessageId) return;

            const emojiKey = reaction.emoji.id
                ? `<:${reaction.emoji.name}:${reaction.emoji.id}>`
                : reaction.emoji.name;

            const roleId = roleMap[emojiKey];
            if (!roleId) return;

            const member = await reaction.message.guild.members.fetch(user.id).catch(() => null);
            if (!member) return;

            await member.roles.add(roleId).catch(() => {});
        });

        // ---------------------------
        // USUNIĘCIE REAKCJI
        // ---------------------------
        client.on('messageReactionRemove', async (reaction, user) => {
            if (user.bot) return;

            try {
                if (reaction.partial) await reaction.fetch();
                if (reaction.message.partial) await reaction.message.fetch();
            } catch {
                return;
            }

            if (reaction.message.id !== reactionMessageId) return;

            const emojiKey = reaction.emoji.id
                ? `<:${reaction.emoji.name}:${reaction.emoji.id}>`
                : reaction.emoji.name;

            const roleId = roleMap[emojiKey];
            if (!roleId) return;

            const member = await reaction.message.guild.members.fetch(user.id).catch(() => null);
            if (!member) return;

            await member.roles.remove(roleId).catch(() => {});
        });

        console.log("🔧 ReactionRoles: eventy reakcji załadowane.");
    }
};
