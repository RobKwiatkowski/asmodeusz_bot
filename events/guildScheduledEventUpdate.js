// Synchronizuje aktualizacje wydarzenia Discord z WordPressem.
const axios = require('axios');
const { config } = require('../src/config');

module.exports = {
    name: 'guildScheduledEventUpdate',
    async execute(oldEvent, newEvent) {
console.log("🔥 UPDATE TRIGGERED:", newEvent.name);
        try {
            if (!config.wordpress.eventsUrl || !config.wordpress.eventsToken) return;

            const payload = {
                title: newEvent.name,
                date: newEvent.scheduledStartAt,
                count: newEvent.userCount || 0,
                image: newEvent.image
                    ? `https://cdn.discordapp.com/guild-events/${newEvent.id}/${newEvent.image}.png`
                    : null,
                link: newEvent.url
            };

            await axios.post(
                `${config.wordpress.eventsUrl}/event`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${config.wordpress.eventsToken}`
                    }
                }
            );

            console.log(`🔄 Event "${newEvent.name}" zaktualizowany w WP`);

        } catch (error) {
            console.error("❌ Błąd aktualizacji WP:", error.response?.data || error.message);
        }
    }
};
