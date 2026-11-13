#!/usr/bin/env bash
# Sends a Telegram message to the bot admin. Usage: deploy/notify.sh "message"
# TOKEN and ADMIN_ID are read from .env. The file is parsed instead of sourced, as the values
# are in the docker compose env_file format.
set -euo pipefail
# Cron starts with a minimal PATH
export PATH="$PATH:/usr/local/bin:/usr/bin:/bin"
cd "$(dirname "$0")/.."

env_value() {
  grep -E "^$1=" .env | tail -n 1 | cut -d= -f2- | tr -d '\r' | sed -e "s/^[\"']//" -e "s/[\"']\$//"
}

TOKEN=$(env_value TOKEN)
ADMIN_ID=$(env_value ADMIN_ID)
if [ -z "$TOKEN" ] || [ -z "$ADMIN_ID" ]; then
  echo "TOKEN and ADMIN_ID must be set in .env" >&2
  exit 1
fi

# The URL contains the token, so it is given to curl as a config on stdin and not as an
# argument that would show up in the process list
curl --silent --show-error --fail --max-time 20 -K - \
  --data-urlencode "chat_id=$ADMIN_ID" \
  --data-urlencode "text=${1:?usage: notify.sh message}" \
  --output /dev/null <<CONFIG
url = "https://api.telegram.org/bot${TOKEN}/sendMessage"
CONFIG
