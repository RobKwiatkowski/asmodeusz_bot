// Synchronizuje usuniecie wydarzenia Discord z WordPressem.
const axios = require('axios');
const { config } = require('../src/config');

module.exports = {
    name: 'guildScheduledEventDelete',
    async execute(event) {

        try {
            if (!config.wordpress.eventsUrl || !config.wordpress.eventsToken) return;

            await axios.post(
                `${config.wordpress.eventsUrl}/event-delete`,
                { event_id: event.url },   // używamy linku jako unikalnego ID
                {
                    headers: {
                        Authorization: `Bearer ${config.wordpress.eventsToken}`
                    }
                }
            );

            console.log(`🗑 Event "${event.name}" usunięty z WP`);

        } catch (error) {
            console.error("❌ Błąd usuwania WP:", error.response?.data || error.message);
        }
    }
};
