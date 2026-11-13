# BläkkisVuohi

A telegram bot designed to help monitor current EBAC level. Has group functionality to list all users' EBAC in permilles or Finnish standard drinks (12.0 grams). Try it out at [https://t.me/blakkisvuohibot](https://t.me/blakkisvuohibot)!

Thanks Yago for the excellent [Telegram Bot API framework for NodeJS](https://github.com/yagop/node-telegram-bot-api). 

This project is supported by the awesome [Futurice Open Source and Social Impact program](https://spiceprogram.org/).

## How to run

### VPS (Docker Compose)

```
cp .env_docker_example .env
# fill in TOKEN, BOT_USERNAME, ADMIN_ID, SECRET, the maintainer info and the database password
docker compose up -d --build
```

Compose starts the bot and a Postgres 16 database. The schema is loaded when the database is
created for the first time, and the bot upgrades older databases by itself on startup.

#### Updating and backups

```
git pull && docker compose up -d --build
docker compose exec -T db pg_dump -U blakkis blakkis | gzip > blakkis-$(date +%F).gz
```

Keep `SECRET` safe: the user nicknames in the database are encrypted with it and cannot be read
without it. Backups contain data the bot has already deleted, so remove old backups regularly.

#### Data retention

To avoid storing personal data forever, the bot deletes old data on startup and then every hour:

- `DRINK_RETENTION_DAYS` (default 30): drinks older than this are deleted
- `INACTIVE_USER_RETENTION_DAYS` (default 365): users who have not marked a drink in this time are
  deleted completely, including their group memberships and drinks

The same numbers are shown to users in `/terms` and the privacy policy. `MAINTAINER_NAME` and
`MAINTAINER_CONTACT` are shown in `/about` and `/help`.

### Heroku

Set the next env variables:
- `TOKEN` = your bot token
- `APP_URL` = your heroku url (i.e. https://blakkisvuohi.heroku.com)
- `DATABASE_URL` = your database url
- `NODE_ENV` = 'production'
- `BOT_MODE` = 'webhook'
- `SECRET` = a long random string, used to encrypt user data. Keep it, it cannot be changed later
- `ADMIN_ID` = your Telegram user id
- `BOT_USERNAME` = the bot's username without @

Bot runs automatically when pushed to the Heroku remote.

## Database upgrades

`app/schema.sql` creates the tables for a new database. Existing databases are upgraded by the bot
itself on startup (`app/db/maintenance.js`), so there are no separate migrations to run.

## Tests

Tests need a Postgres database:

```
docker run -d --rm --name blakkis-test-db -e POSTGRES_PASSWORD=test -p 5432:5432 postgres:16-alpine
export DATABASE_URL=postgres://postgres:test@localhost:5432/postgres \
  SECRET=reallylonganduniquesecretstring ADMIN_ID=12345 NEWRELIC=false
node setup_test_db.js
npx mocha --exit test/*
```
