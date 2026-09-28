#!/bin/sh
# Nightly database backup, run by cron on the server:
#   15 7 * * * /home/ubuntu/emsa/scripts/backup.sh emsa-postgres-1 emsa
#
# Dumps the database in the given Postgres container to
# ~/backups/<name>/<name>-YYYY-MM-DD.sql.gz and keeps 14 days, so rows the
# site deletes on purpose (e.g. fulfilled naloxone requests) are gone from
# backups two weeks later too.
set -eu

container=${1:?usage: backup.sh CONTAINER NAME}
name=${2:?usage: backup.sh CONTAINER NAME}
dir="$HOME/backups/$name"
file="$dir/$name-$(date +%F).sql.gz"

mkdir -p "$dir"
chmod 700 "$dir"
umask 077

# The container's own POSTGRES_USER / POSTGRES_DB say what to dump.
docker exec "$container" sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > "$file.tmp"
mv "$file.tmp" "$file"

find "$dir" -name "$name-*.sql.gz" -mtime +13 -delete
