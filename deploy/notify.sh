#!/usr/bin/env bash
# Sends a Telegram message to the bot admins. Usage: deploy/notify.sh "message"
# TOKEN and ADMIN_IDS / ADMIN_ID are read from .env. The file is parsed instead of sourced,
# as the values are in the docker compose env_file format.
set -euo pipefail
# Cron starts with a minimal PATH
export PATH="$PATH:/usr/local/bin:/usr/bin:/bin"
cd "$(dirname "$0")/.."

env_value() {
  (grep -E "^$1=" .env || true) | tail -n 1 | cut -d= -f2- | tr -d '\r' | sed -e "s/^[\"']//" -e "s/[\"']\$//"
}

TOKEN=$(env_value TOKEN)
RAW_ADMINS="$(env_value ADMIN_IDS),$(env_value ADMIN_ID)"
if [ -z "$TOKEN" ] || [ -z "$(echo "$RAW_ADMINS" | tr -d ',[:space:]')" ]; then
  echo "TOKEN and ADMIN_IDS (or ADMIN_ID) must be set in .env" >&2
  exit 1
fi

msg="${1:?usage: notify.sh message}"
sent=0
seen=""

IFS=',' read -ra ADMIN_LIST <<< "$RAW_ADMINS"
for raw_id in "${ADMIN_LIST[@]}"; do
  admin_id=$(echo "$raw_id" | tr -d '[:space:]')
  [ -z "$admin_id" ] && continue
  case ",$seen," in
    *",$admin_id,"*) continue ;;
  esac
  seen="$seen,$admin_id"

  # The URL contains the token, so it is given to curl as a config on stdin and not as an
  # argument that would show up in the process list
  if curl --silent --show-error --fail --max-time 20 -K - \
    --data-urlencode "chat_id=$admin_id" \
    --data-urlencode "text=$msg" \
    --output /dev/null <<CONFIG
url = "https://api.telegram.org/bot${TOKEN}/sendMessage"
CONFIG
  then
    sent=1
  else
    echo "Failed to notify admin $admin_id" >&2
  fi
done

[ "$sent" = 1 ]
