// Rozroznia zwykle wyjscie z serwera, kick i ban, korzystajac z Audit Logow.
const { AuditLogEvent, EmbedBuilder } = require('discord.js');
const { config } = require('../config');

function setupMemberLeaveLogs(client) {
  client.on('guildMemberRemove', async member => {
    const logChannel = member.guild.channels.cache.get(config.notifications.leaveLogChannelId);
    if (!logChannel) return;

    try {
      const [kickLogs, banLogs] = await Promise.all([
        member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick }),
        member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd })
      ]);

      const kickLog = kickLogs.entries.first();
      const banLog = banLogs.entries.first();
      const now = Date.now();

      let description;
      let color;

      if (kickLog && now - kickLog.createdTimestamp < 5000 && kickLog.target.id === member.id) {
        description = `**${member.displayName}** (${member.user.tag}) zostal wyrzucony przez **${kickLog.executor.tag}**.\nPowod: ${kickLog.reason || 'Brak'}`;
        color = 0xffa500;
      } else if (banLog && now - banLog.createdTimestamp < 5000 && banLog.target.id === member.id) {
        description = `**${member.displayName}** (${member.user.tag}) zostal zbanowany przez **${banLog.executor.tag}**.\nPowod: ${banLog.reason || 'Brak'}`;
        color = 0xff0000;
      } else {
        description = `**${member.displayName}** (${member.user.tag}) opuscil serwer.`;
        color = 0x00bfff;
      }

      const embed = new EmbedBuilder()
        .setTitle('Uzytkownik opuscil serwer')
        .setDescription(description)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setColor(color)
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error('[memberLeaveLogs] Blad:', error);
    }
  });
}

module.exports = { setupMemberLeaveLogs };
