# BläkkisVuohi

A telegram bot designed to help monitor current EBAC level. Has group functionality to list all users' EBAC in permilles or Finnish standard drinks (12.0 grams). Try it out at [https://t.me/otitblakkisbot](https://t.me/otitblakkisbot)!

Thanks Yago for the excellent [Telegram Bot API framework for NodeJS](https://github.com/yagop/node-telegram-bot-api). 

Originally developed by Joonas Ulmanen, now maintained by Oulun Tietoteekkarit ry.

The original project was supported by the [Futurice Open Source and Social Impact program](https://spiceprogram.org/).

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

By hand:

```
git pull && docker compose up -d --build
docker compose exec -T db pg_dump -U blakkis blakkis | gzip > blakkis-$(date +%F).gz
```

Keep `SECRET` safe: the user nicknames and the hashed user and group ids in the database depend on
it, so without it they cannot be read or matched to the users. Backups contain data the bot has
already deleted, so remove old backups regularly.

##### Automatic updates and backups

Two scripts in `deploy/` can be run from cron on the server:

- `deploy/backup.sh` dumps the database to `backups/` (gzipped, readable only by the owner) and
  keeps the 14 newest dumps, so deleted data does not stay in backups for long. It messages the
  admin if the dump fails.
- `deploy/update.sh` takes a backup, pulls `master` (fast-forward only), rebuilds the images
  (also fetching newer Node and Postgres base images), restarts the containers and waits for the
  bot to report that it started. The admin gets a Telegram message from the bot when something was
  updated or when a step failed, and nothing when there was nothing new. It does not roll back
  by itself. If the branch is not `master` or the pull cannot be fast-forwarded, it stops and
  tells the admin.

The scripts read `TOKEN` and `ADMIN_ID` from `.env`, so the admin must have started the bot.
The clone on the server must be on `master`, `git pull` must work without asking for a password,
and the user must be allowed to run `docker`. Try them once by hand, then add them to `crontab -e`
(this updates on Tuesdays at 05:00 and backs up every night at 03:30):

```
deploy/notify.sh "test message"
deploy/backup.sh
deploy/update.sh

30 3 * * *  /path/to/blakkis/deploy/backup.sh >> /path/to/blakkis/logs/backup.log 2>&1
0 5 * * 2   /path/to/blakkis/deploy/update.sh >> /path/to/blakkis/logs/update.log 2>&1
```

Create the `logs` directory first (`mkdir logs`). It and `backups/` are ignored by git and Docker.

To go back to an earlier version, find its commit with `git log --oneline`, then
`git checkout <commit> && docker compose up -d --build`. The weekly update refuses to run until
you are back on master (`git checkout master`), which reminds you to return. To restore the
database from a backup:

```
docker compose stop bot
docker compose exec -T db sh -c 'dropdb -U "$POSTGRES_USER" "$POSTGRES_DB" && createdb -U "$POSTGRES_USER" "$POSTGRES_DB"'
gunzip -c backups/blakkis-DATE.sql.gz | docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"'
docker compose up -d
```

#### Securing the server

The bot uses polling, so it only makes outgoing connections and the database is not published to
the network. Most of the work is keeping the host and the secrets safe. A checklist:

**Secrets**

- Only the owner should read `.env` (it has the bot token, `SECRET` and the database password):
  `chmod 600 .env`. It is ignored by git and Docker, never commit it or paste it anywhere.
- `SECRET`: a long random value (`openssl rand -hex 32`), kept in a password manager and as an offline
  copy. Nicknames and the hashed ids depend on it and there is no way to change it later. Without it
  the data and the backups cannot be used.
- `POSTGRES_PASSWORD`: do not leave the `changeme` of the example file. Use for example
  `openssl rand -hex 24` (hex is safe inside `DATABASE_URL`). The variable only takes effect when the
  database is created. For an existing database change the password in Postgres first (it asks for
  it, so it stays out of the shell history), then update both `POSTGRES_PASSWORD` and `DATABASE_URL`
  in `.env` and run `docker compose up -d`:

  ```
  docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
  \password
  ```

- If the bot token leaks: `/revoke` in BotFather, put the new token in `.env` and run
  `docker compose up -d`. The same token must never run in two places at once (polling fails
  with 409 Conflict).
- In BotFather keep the group privacy of the bot enabled (Bot Settings -> Group Privacy). The privacy
  policy promises that the bot cannot read anything but commands in groups.

**Host**

- SSH with keys only: in `/etc/ssh/sshd_config` set `PasswordAuthentication no` and
  `PermitRootLogin no`, then reload sshd. Keep one session open while you test a new login.
- Firewall: nothing needs to be reachable except SSH, for example
  `ufw default deny incoming && ufw allow OpenSSH && ufw enable`. Docker bypasses ufw for ports it
  publishes, so do not add `ports:` to the `db` service in `docker-compose.yml`.
- Keep the operating system updated (on Debian and Ubuntu `unattended-upgrades`) and reboot now and then
  for kernel updates. The containers are rebuilt with fresh base images by `deploy/update.sh` every week.
- Being in the `docker` group is the same as being root. Only trusted users should be, and the user
  that runs the cron jobs should not be used for anything else.
- Use full disk encryption if the host offers it. The database and the backups hold weights, heights,
  drinks and nicknames.

**Backups**

- `backups/` is only readable by its owner and the files are not encrypted. Do not copy them to shared
  places. If you keep a copy elsewhere, encrypt it first (for example `gpg --symmetric` or `age`) and
  delete it on the same schedule, as the privacy policy says backups are kept for 14 days.
- Try the restore above once on another machine or a throwaway database, so that you know it works
  before you need it.

**GitHub**

- Turn on two-factor authentication or a passkey for the account. `master` is protected (a pull
  request and the `mocha` check are required) and `deploy/update.sh` deploys it, so access to the
  account is access to the server.

**If something leaks**

If the server, `.env` or a backup may have been exposed: revoke the bot token, change the database
password, and find out what was exposed. Someone with `SECRET` and the database can read the nicknames
and work out the ids. Tell the users and the organisation. A personal data breach may have to be
reported to the data protection ombudsman within 72 hours, so contact the person responsible for
data protection of the organisation without delay.

#### Data retention

To avoid storing personal data forever, the bot deletes old data on startup and then every hour:

- `DRINK_RETENTION_DAYS` (default 30): drinks older than this are deleted
- `INACTIVE_USER_RETENTION_DAYS` (default 365): users who have not marked a drink in this time are
  deleted completely, including their group memberships and drinks

Data deleted this way stays in the nightly backups (`deploy/backup.sh`) until they are rotated out
after 14 days, so it is gone from the backups at most 14 days later.

The same numbers are shown to users in `/terms` and the privacy policy (Help -> Yksityisyys), which
also name the backup period. If you change the number of backups kept (`KEEP` in `deploy/backup.sh`),
update those texts in `app/strings.js` too. `MAINTAINER_NAME` is shown as the controller of the data
and `MAINTAINER_CONTACT` as the contact in `/about`, `/help`, `/terms` and the privacy policy.

### Heroku

Set the next env variables:
- `TOKEN` = your bot token
- `APP_URL` = your heroku url (i.e. https://blakkisvuohi.heroku.com). Telegram is told to send updates to `<APP_URL>/telegram` together with a secret token derived from `SECRET`; requests without it are rejected
- `DATABASE_URL` = your database url
- `NODE_ENV` = 'production'
- `BOT_MODE` = 'webhook'
- `SECRET` = a long random string, used to encrypt and hash user data. Keep it, it cannot be changed later
- `ADMIN_ID` = your Telegram user id
- `BOT_USERNAME` = the bot's username without @

Bot runs automatically when pushed to the Heroku remote. The Heroku setup has not been tested with the current version. The other variables (`MAINTAINER_NAME`, `MAINTAINER_CONTACT`, data retention) are listed in `.env_docker_example`.

## Database upgrades

`app/schema.sql` creates the tables for a new database. Existing databases are upgraded by the bot
itself on startup (`app/db/maintenance.js`), so there are no separate migrations to run. The bot does
not start handling messages until the upgrade has succeeded, and exits if it fails.

Telegram user and group ids are stored only as hashes keyed with `SECRET`. The first start after
this was introduced converts the existing plain sha256 ids in one transaction and records it in the
`schema_meta` table. Take a backup before updating (see "Updating and backups" above). Because the ids and nicknames both
depend on `SECRET`, changing it makes all existing users look unregistered.

## Tests

Tests need a Postgres database:

```
docker run -d --rm --name blakkis-test-db -e POSTGRES_PASSWORD=test -p 5432:5432 postgres:16-alpine
export DATABASE_URL=postgres://postgres:test@localhost:5432/postgres \
  SECRET=reallylonganduniquesecretstring ADMIN_ID=12345 NEWRELIC=false
node setup_test_db.js
npx mocha --exit test/*
```

The same tests run in GitHub Actions on every push and pull request (`.github/workflows/test.yml`).
