#!/bin/sh
set -e

export PGPASSWORD="${DB_PASSWORD}"
PSQL="psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-emsa_user} -d ${DB_NAME:-emsa} -v ON_ERROR_STOP=1 -q"

# ---------------------------------------------------------------------------
# Wait for PostgreSQL to accept connections
# ---------------------------------------------------------------------------
until pg_isready -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" \
                 -U "${DB_USER:-emsa_user}" -d "${DB_NAME:-emsa}" 2>/dev/null; do
    echo "[entrypoint] Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT} ..."
    sleep 2
done
echo "[entrypoint] PostgreSQL is ready."

# ---------------------------------------------------------------------------
# Apply schema and seed (both idempotent). Officer accounts are NOT created
# here — use scripts/create-officer.sh.
# ---------------------------------------------------------------------------
$PSQL -f /app/schema.sql
echo "[entrypoint] Schema applied."
$PSQL -f /app/seed.sql
echo "[entrypoint] Seed data applied."

unset PGPASSWORD

echo "[entrypoint] Starting emsa_backend on port ${SERVER_PORT:-8080} ..."
exec /usr/local/bin/emsa_backend
