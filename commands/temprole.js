// Nadaje role tymczasowa i codziennie usuwa role po terminie wygasniecia.
const { SlashCommandBuilder } = require('discord.js')
const fs = require('fs')
const cron = require('node-cron')
const { config } = require('../src/config')

const FILE = config.files.tempRoles

// ID minimalnej roli (Moderator)
const MIN_ROLE_ID = config.discord.moderatorRoleId

// upewnij się że plik istnieje
function ensureFile() {
    if (!fs.existsSync(FILE)) {
        fs.writeFileSync(FILE, JSON.stringify([], null, 2))
    }
}

function loadData() {
    ensureFile()
    return JSON.parse(fs.readFileSync(FILE, 'utf8'))
}

function saveData(data) {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2))
}

module.exports = {

    data: new SlashCommandBuilder()
        .setName('temprole')
        .setDescription('Nadaje rolę na określony czas')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Użytkownik')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('rola')
                .setDescription('Rola do nadania')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('dni')
                .setDescription('Ile dni ma trwać rola')
                .setRequired(true)),

    async execute(interaction) {

        const member = interaction.member
        const guild = interaction.guild

        // sprawdzenie minimalnej roli moderatora
        const minRole = guild.roles.cache.get(MIN_ROLE_ID)

        if (!member.roles.cache.some(role => role.position >= minRole.position)) {
            return interaction.reply({
                content: "❌ Ta komenda jest dostępna tylko dla moderatora lub wyższej roli.",
                ephemeral: true
            })
        }

        const user = interaction.options.getUser('user')
        const role = interaction.options.getRole('rola')
        const days = interaction.options.getInteger('dni')

        const botMember = guild.members.me

        const target = await guild.members.fetch(user.id).catch(() => null)

        if (!target) {
            return interaction.reply({
                content: '❌ Użytkownik nie jest na tym serwerze.',
                ephemeral: true
            })
        }

        // zabezpieczenie hierarchii ról bota
        if (role.position >= botMember.roles.highest.position) {
            return interaction.reply({
                content: '❌ Nie mogę nadać roli wyższej od mojej.',
                ephemeral: true
            })
        }

        await target.roles.add(role)

        const data = loadData()

        const expires = Date.now() + (days * 24 * 60 * 60 * 1000)

        data.push({
            guildId: guild.id,
            userId: target.id,
            roleId: role.id,
            expires: expires
        })

        saveData(data)

        await interaction.reply(
            `✅ Nadano rolę **${role.name}** użytkownikowi ${target} na **${days} dni.**`
        )
    },

    startCron(client) {

        ensureFile()

        cron.schedule('0 3 * * *', async () => {

            const data = loadData()
            const now = Date.now()
            const remaining = []

            for (const entry of data) {

                const guild = client.guilds.cache.get(entry.guildId)
                if (!guild) continue

                const member = await guild.members.fetch(entry.userId).catch(() => null)
                if (!member) continue

                if (now >= entry.expires) {

                    const role = guild.roles.cache.get(entry.roleId)

                    if (role && member.roles.cache.has(role.id)) {
                        await member.roles.remove(role)
                    }

                } else {
                    remaining.push(entry)
                }
            }

            saveData(remaining)

        })

    }
}
