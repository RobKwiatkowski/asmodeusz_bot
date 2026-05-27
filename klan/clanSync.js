// Jednorazowa synchronizacja roli klanowej Discord z lokalnym JSON-em.
const { loadData, saveData } = require('./clanStore');

async function syncClanRole(guild, roleId) {
  const role = await guild.roles.fetch(roleId);
  if (!role) throw new Error('Nie znaleziono roli LEGION');

  // role.members pobiera TYLKO osoby z rolą (bez global fetch)
  const members = role.members;

  const data = loadData();
  const existingIds = new Set(data.members.map(m => m.id));

  members.forEach(member => {
    if (!existingIds.has(member.id)) {
      data.members.push({
        id: member.id,
        tag: member.user.tag,
        username: member.user.username,
        addedAt: new Date().toISOString()
      });
    }
  });

  data.roleId = roleId;
  saveData(data);

  console.log(`Zsynchronizowano ${members.size} członków klanu LEGION`);
}

module.exports = { syncClanRole };
