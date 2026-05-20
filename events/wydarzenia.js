// Synchronizuje utworzenie wydarzenia Discord z WordPressem.
const axios = require('axios');
const { config } = require('../src/config');

module.exports = {
    name: 'guildScheduledEventCreate',
    async execute(event) {
console.log("🔥 CREATE TRIGGERED:", event.name)
        try {
            if (!config.wordpress.eventsUrl || !config.wordpress.eventsToken) return;

            const payload = {
                title: event.name,
                date: event.scheduledStartAt,
                count: event.userCount || 0,
                image: event.image
                    ? `https://cdn.discordapp.com/guild-events/${event.id}/${event.image}.png`
                    : null,
                link: event.url
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

            console.log(`✅ Event "${event.name}" wysłany do WP`);

        } catch (error) {
            console.error("❌ Błąd WP:", error.response?.data || error.message);
        }
    }
};
