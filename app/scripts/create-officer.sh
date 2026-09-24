#!/bin/sh
# ------------------------------------------------------------------
# Create an officer account, or reset an existing officer's password.
# Run from the app/ folder while the site is running:
#
#     ./scripts/create-officer.sh
#
# It asks for the officer's email, name, and a password. The password
# is stored only as a bcrypt hash. There is no public signup page on
# purpose: only someone with access to the server can add officers.
# ------------------------------------------------------------------
set -e
cd "$(dirname "$0")/.."

printf "Officer email: "; read -r EMAIL
printf "Officer name: ";  read -r NAME
stty -echo 2>/dev/null || true
printf "Password (at least 12 characters): "; read -r PASSWORD; echo
stty echo 2>/dev/null || true

if [ ${#PASSWORD} -lt 12 ]; then
    echo "Password must be at least 12 characters." >&2
    exit 1
fi

# Values go in as psql variables (:'var'), which quotes them safely.
docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -q \
    -v email="$1" -v name="$2" -v pw="$3"' _ "$EMAIL" "$NAME" "$PASSWORD" <<'SQL'
INSERT INTO officers (email, name, password_hash)
VALUES (:'email', :'name', crypt(:'pw', gen_salt('bf', 12)))
ON CONFLICT ((lower(email))) DO UPDATE
    SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash;
SQL

echo "Officer account ready for $EMAIL. Sign in at /admin."
