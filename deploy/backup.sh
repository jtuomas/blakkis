#!/usr/bin/env bash
# Dumps the database to backups/ and keeps the newest KEEP dumps. Meant to be run nightly
# from cron. Set NOTIFY_ON_FAILURE=0 to not send the failure message to the admin.
set -euo pipefail
umask 077
# Cron starts with a minimal PATH
export PATH="$PATH:/usr/local/bin:/usr/bin:/bin"
cd "$(dirname "$0")/.."

KEEP=14
file="backups/blakkis-$(date +%F-%H%M).sql.gz"
mkdir -p backups

fail() {
  rm -f "$file"
  echo "$(date '+%F %T') backup failed: $1" >&2
  if [ "${NOTIFY_ON_FAILURE:-1}" = 1 ]; then
    deploy/notify.sh "Varmuuskopio epäonnistui: $1" || true
  fi
  exit 1
}

docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' \
  | gzip > "$file" || fail "pg_dump"
{ [ -s "$file" ] && gzip -t "$file"; } || fail "the dump is empty or broken"

# Old backups contain data the bot has since deleted, so they are not kept for long
ls -1t backups/blakkis-*.sql.gz | tail -n +$((KEEP + 1)) | while read -r old; do
  rm -- "$old"
done

echo "$(date '+%F %T') backup ok: $file"
