// Aktualizacja fragmentu strony WordPress z poziomem klanu.
const axios = require("axios");
const { config } = require("../src/config");

async function updateWordpressKlanLvl(level) {
	console.log("🧪 updateWordpressKlanLvl() START");
  const WP_URL = config.wordpress.pageUrl;

  // 🔴 DANE WP NA SZTYWNO
  const WP_USER = config.wordpress.user;
  const WP_APP_PASS = config.wordpress.appPassword;

  if (!WP_USER || !WP_APP_PASS) {
    console.error("Brakuje WP_USER albo WP_APP_PASSWORD w konfiguracji.");
    return false;
  }

  const auth = Buffer.from(`${WP_USER}:${WP_APP_PASS}`).toString("base64");

  const now = new Date().toLocaleString("pl-PL", {
    timeZone: "Europe/Warsaw"
  });

  const html = `
    <div class="devs-clan-level">
      <h3>🔥 Status Klanu DEVS</h3>
      <p><strong>Aktualny poziom:</strong> ${level}</p>
      <p><strong>Ostatnia aktualizacja:</strong> ${now}</p>
    </div>
  `;

  const startTag = "<!-- START_DEVS_LEVEL -->";
  const endTag = "<!-- END_DEVS_LEVEL -->";

  try {
    // 1️⃣ Pobierz stronę
    const res = await axios.get(WP_URL, {
      headers: { Authorization: `Basic ${auth}` }
    });

    let content = res.data.content.rendered;

    // 2️⃣ Podmień placeholder
    const regex = new RegExp(`${startTag}[\\s\\S]*?${endTag}`);
    content = content.replace(regex, `${startTag}\n${html}\n${endTag}`);

    // 3️⃣ Zapisz stronę
    await axios.post(
      WP_URL,
      { content },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ WordPress: poziom klanu zaktualizowany");
    return true;
  } catch (err) {
    console.error("❌ Błąd aktualizacji WordPressa:", err.message);
	console.log("🧪 updateWordpressKlanLvl() KONIEC – OK");
    return false;
  }
}

module.exports = updateWordpressKlanLvl;
