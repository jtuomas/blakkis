#!/usr/bin/env bash
# Backs up the database, pulls the latest master, rebuilds and restarts the containers and
# tells the admin on Telegram when something was updated or went wrong. Meant to be run weekly
# from cron. Nothing is sent when there was nothing new.
set -Eeuo pipefail
# Cron starts with a minimal PATH
export PATH="$PATH:/usr/local/bin:/usr/bin:/bin"
cd "$(dirname "$0")/.."
mkdir -p logs

log() { echo "$(date '+%F %T') $*"; }

# Two updates at the same time would fight over the containers
exec 9> logs/update.lock
if ! flock -n 9; then
  log "another update is already running"
  exit 0
fi

# There is no automatic rollback: the old code with an already upgraded database could be worse
# than a stopped bot. See the README for restoring by hand.
step="starting"
trap 'log "update failed: $step"; deploy/notify.sh "Päivitys epäonnistui vaiheessa: $step. Katso logs/update.log palvelimelta." || true' ERR

step="checking that the branch is master"
[ "$(git rev-parse --abbrev-ref HEAD)" = master ]

# No update without a fresh backup
step="backup"
NOTIFY_ON_FAILURE=0 deploy/backup.sh

step="git pull"
code_before=$(git rev-parse HEAD)
git pull --quiet --ff-only origin master
code_after=$(git rev-parse HEAD)

images_before=$(docker compose images -q | sort)
db_before=$(docker compose ps -q db)
bot_before=$(docker compose ps -q bot)

step="pulling and building the images"
docker compose pull --quiet db
docker compose build --pull --quiet bot

step="starting the containers"
started_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
docker compose up -d
if [ "$(docker compose ps -q db)" != "$db_before" ]; then
  # The database container was replaced, so the connections of the bot are gone
  docker compose up -d --force-recreate --no-deps bot
fi

step="waiting for the bot to start"
bot_after=$(docker compose ps -q bot)
if [ "$bot_after" != "$bot_before" ]; then
  started=0
  for _ in $(seq 1 45); do
    if docker compose logs --since "$started_at" bot 2>&1 | grep -qF 'BläkkisVuohi started'; then
      started=1
      break
    fi
    sleep 2
  done
  [ "$started" = 1 ]
fi
[ "$(docker inspect -f '{{.State.Running}}' "$bot_after")" = true ]

images_after=$(docker compose images -q | sort)
msg=""
if [ "$code_before" != "$code_after" ]; then
  count=$(git rev-list --count "$code_before..$code_after")
  msg="Bläkkisvuohi päivitetty ($count muutosta), uusin: $(git log -1 --format='%h %s')"
elif [ "$images_before" != "$images_after" ]; then
  msg="Bläkkisvuohi: Docker-imaget päivitetty, koodi ennallaan."
fi
if [ -n "$msg" ]; then
  log "$msg"
  deploy/notify.sh "$msg" || log "could not notify the admin"
fi

docker image prune -f > /dev/null
log "update done"
