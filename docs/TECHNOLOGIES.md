# Technologie w bocie

## Glowny stos

- Node.js - uruchamia kod JavaScript poza przegladarka.
- discord.js - biblioteka do komunikacji z API Discorda.
- Docker / docker compose - uruchamianie bota jako kontenera na serwerze.
- dotenv / pliki `.env.*` - konfiguracja i sekrety poza kodem, np. osobno dla produkcji i testow.
- node-cron - harmonogram zadan cyklicznych.

## Pliki JSON

JSON-y w tym projekcie sa prosta lokalna baza danych. Bot zapisuje w nich stan,
np. kto jest w loterii, jakie tickety byly otwarte, kto ma role tymczasowe,
jakie kanaly YouTube/Twitch obserwujemy albo cache statystyk PUBG.

To jest proste i dobre na start, ale przy wiekszym bocie mozna to kiedys
zamienic na SQLite.

## Tipply i Puppeteer

Tipply to serwis do przyjmowania wplat/donacji od widzow lub spolecznosci.

Puppeteer to automatyczna przegladarka Chromium sterowana z kodu. Tutaj bot
otwiera widget Tipply i nasluchuje zdarzen o nowych wplatach. To dziala, ale
jest ciezsze dla Raspberry Pi niz zwykle API/webhook.

## Google Sheets

Google Sheets jest tu uzywane jak panel administracyjny i baza dla bitew
klanowych. Komendy Discorda dopisuja wyniki do arkusza, a inne komendy czytaja
ranking i statystyki z arkusza.

Jesli arkusz jest wygodny dla ludzi, warto go zostawic. Jesli bot ma byc
bardziej samodzielny, dane mozna kiedys przeniesc do SQLite.
