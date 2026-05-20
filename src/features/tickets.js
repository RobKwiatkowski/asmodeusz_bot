// System ticketow: przycisk otwiera prywatny kanal, a zamkniecie przenosi go
// do kategorii archiwum.
const { ChannelType, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { config } = require('../config');
const { readJson, writeJson } = require('../jsonStore');

const activeTickets = new Map();

function loadCounter() {
  return readJson(config.files.tickets, { lastTicket: 0 }).lastTicket || 0;
}

function saveCounter(lastTicket) {
  writeJson(config.files.tickets, { lastTicket });
}

function setupTickets(client) {
  let ticketCounter = loadCounter();

  client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    const guild = client.guilds.cache.get(config.discord.guildId);
    if (!guild) return;

    if (interaction.customId === 'open_ticket') {
      const existingTicket = activeTickets.get(interaction.user.id);
      if (existingTicket) {
        await interaction.reply({
          content: 'Masz juz otwarte jedno zgloszenie.',
          ephemeral: true
        });
        return;
      }

      ticketCounter++;
      saveCounter(ticketCounter);

      const channel = await guild.channels.create({
        name: `zgloszenie-${String(ticketCounter).padStart(2, '0')}`,
        type: ChannelType.GuildText,
        parent: config.tickets.categoryId,
        permissionOverwrites: [
          { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
          { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
          ...config.discord.adminRoleIds.map(roleId => ({
            id: roleId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels]
          }))
        ]
      });

      activeTickets.set(interaction.user.id, channel.id);
      const closeButton = new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Zamknij zgloszenie')
        .setStyle(ButtonStyle.Danger);

      await channel.send({
        content:
          `Witaj <@${interaction.user.id}>. Opisz dokladnie problem, dodaj screeny lub linki, jesli sa potrzebne.`,
        components: [new ActionRowBuilder().addComponents(closeButton)]
      });

      await interaction.reply({ content: `Utworzono zgloszenie: ${channel}`, ephemeral: true });
    }

    if (interaction.customId === 'close_ticket') {
      const channel = interaction.channel;
      const ticketOwner = [...activeTickets.entries()].find(([, channelId]) => channelId === channel.id)?.[0];
      if (ticketOwner) activeTickets.delete(ticketOwner);

      await channel.setName(channel.name.replace('zgloszenie', 'zgloszenie-zamkniete')).catch(() => {});
      await channel.setParent(config.tickets.archiveCategoryId).catch(() => {});

      const closedBy = interaction.user.id === ticketOwner
        ? 'Zamkniety przez autora'
        : `Zamkniety przez administracje (${interaction.user.tag})`;

      const embed = new EmbedBuilder()
        .setTitle('Zgloszenie zamkniete')
        .setDescription(`${closedBy}\nAutor: <@${ticketOwner}>`)
        .setColor(interaction.user.id === ticketOwner ? 0x00ff00 : 0xff0000)
        .setTimestamp();

      await interaction.message?.edit({ components: [] }).catch(() => {});
      await channel.send({ embeds: [embed] });
      await interaction.reply({ content: 'Zgloszenie zostalo zamkniete i przeniesione do archiwum.', ephemeral: true });
    }
  });
}

module.exports = { setupTickets };
