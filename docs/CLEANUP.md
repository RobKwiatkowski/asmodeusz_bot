# Sprzatanie repo przed uruchomieniem w kontenerze

Ten projekt trzyma teraz konfiguracje w `src/config.js`, a sekrety powinny isc przez `.env`
albo zmienne srodowiskowe w `docker-compose.yml`.

## Nie commitowac

Te pliki nie powinny byc w repo. Trzymaj je lokalnie albo jako sekrety/wolumen na serwerze:

- `.env`
- `.env2` - mozna polaczyc z `.env`, a potem skasowac
- `google-service-account.json`
- `logs/`
- `bindings.json`
- `boosts.json`
- `clan_stats.json`
- `klan.json`
- `listaklanu.json`
- `loteria.json`
- `rocznice.json`
- `season.json`
- `stats_cache.json`
- `stats_cache_old.json`
- `streamers.json`
- `temporary_voice_config.json`
- `tempRoles.json`
- `tickets.json`
- `youtube.json`

## Kandydaci do skasowania po sprawdzeniu

Tych rzeczy bot nie potrzebuje do startu po refaktorze:

- `node_modules/` - odtwarzane przez `npm ci`
- `old/`
- `Działająca konfiguracja/`
- `Oryginalny bot Asmodeusz/`
- `asmodeusz.monolith.js` - lokalna kopia starego monolitu, zrobiona przed refaktorem
- `stats_cache_old.json`
- `message_log.txt`, jezeli nie uzywasz go recznie
- `events/config.json` - usuniete w refaktorze, konfiguracja eventow WP jest teraz w ENV
- `commands/stats.js` - usuniete; zostala jedna komenda statystyk PUBG: `/statystyki`

## Zmiany upraszczajace

- Zostala jedna biblioteka harmonogramu: `node-cron`.
- Stare komendy tekstowe `!loteria`, `!ticket`, `!youtube`, `!streamer`, `!klan`, `!unklan`, `!topka`, `!top25`, `!powiaz`, `!ranga` zostaly zastapione slash commands.
- Alternatywne statystyki z Tracker Network zostaly usuniete, zeby zostawic jedno zrodlo: oficjalne PUBG API.

## Zostawic w repo

Te pliki sa potrzebne albo sa kodem/aplikacja:

- `asmodeusz.js`
- `src/`
- `commands/`
- `events/`
- `klan/`
- `utils/`
- `assets/`
- `wulgaryzmy.txt`
- `top25.png`
- `package.json`
- `package-lock.json`
- `Dockerfile`
- `docker-compose.yml`
- `.env.example`

## Proponowany model na serwerze

W kontenerze ustaw:

- `DATA_DIR=/app/data`
- `LOG_DIR=/app/logs`

Wtedy JSON-y runtime beda w wolumenie `./data:/app/data`, a logi w `./logs:/app/logs`.
