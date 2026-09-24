# EMSA website: full-stack app

This folder is the EMS Alliance website as a real web app: the ten public pages, the forms (join, class registration, group class requests, naloxone requests), and a private officer page that lists what people submitted.

It is built the same way as KnottSoDirtyCo:

| Part | What it is | Folder |
|---|---|---|
| Frontend | Angular 21 (the pages people see), served by nginx | `frontend/` |
| Backend | C++ with the Drogon framework (the `/api/...` addresses the forms send to) | `backend/` |
| Database | PostgreSQL 16 (where submissions, classes, events, and impact numbers live) | `database/` |

All three run in Docker containers, so one command builds and starts everything.

You don't need to know C++ or Angular to run the site, create officer accounts, or update classes and numbers. The steps below are written for a non-developer.

---

## 1. Run it on your own computer

**You need:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running) and Git.

```bash
git clone https://github.com/jmarple1/emsa-website.git
cd emsa-website
git switch fullstack
cd app
cp .env.example .env
```

Open `app/.env` in a text editor and replace every `CHANGE_ME` value:

- `DB_PASSWORD`: any long password (you'll never type it).
- `JWT_SECRET`: at least 32 random characters. This signs officer logins.
- `HTTP_PORT`: the port the site uses on your computer. `80` gives you `http://localhost`. If something else already uses it, pick another port, such as `8088`.

Then start everything:

```bash
docker compose up --build -d
```

The first build takes a few minutes; after that it starts in seconds. Open `http://localhost:HTTP_PORT` (for example http://localhost:8088).

| Command | What it does |
|---|---|
| `docker compose ps` | Is everything running? |
| `docker compose logs -f backend` | Watch the backend's log (Ctrl+C to stop watching) |
| `docker compose down` | Stop the site (data is kept) |
| `docker compose down -v` | Stop and **erase the database** (all submissions) |

---

## 2. Create an officer account

There is no public sign-up page on purpose. Anyone who can run commands on the server can add an officer:

```bash
cd app
./scripts/create-officer.sh
```

It asks for the officer's email, name, and a password of at least 12 characters, and stores only a bcrypt hash of the password. Running it again with the same email resets that officer's password. On Windows, run it from Git Bash.

**To remove an officer:**

```bash
docker compose exec postgres psql -U emsa_user emsa -c "DELETE FROM officers WHERE lower(email) = lower('person@miamioh.edu');"
```

## 3. See form submissions

Go to `/admin` (for example http://localhost:8088/admin) and sign in. You'll see four lists (join forms, class registrations, group class requests, naloxone requests), newest first. **Download CSV** opens the list in Google Sheets or Excel. Sign-ins last 2 hours.

Naloxone requests are private (brief §11). Don't copy them anywhere else.

---

## 4. Update classes, events, the next meeting, and impact numbers

Phase 2 will add buttons for these in the officer page. Until then, each change is a single command. Run it from the `app/` folder while the site is running. Times are Oxford, Ohio time (`-04` during daylight saving time, `-05` in winter).

**Add a class** (course must be exactly `BLS`, `Heartsaver`, or `Stop the Bleed`):

```bash
docker compose exec postgres psql -U emsa_user emsa -c "INSERT INTO classes (course, starts_at, ends_at, location, capacity) VALUES ('BLS', '2026-10-04 13:00-04', '2026-10-04 16:00-04', 'Room name, Building', 12);"
```

It appears on the CPR Classes page right away, and registration stops by itself when it's full. **Close a class early:** `UPDATE classes SET is_open = false WHERE id = 3;`

**Add an event:**

```bash
docker compose exec postgres psql -U emsa_user emsa -c "INSERT INTO events (title, starts_at, ends_at, location, description) VALUES ('General body meeting', '2026-10-01 19:00-04', '2026-10-01 20:00-04', 'Room, Building', NULL);"
```

**Set the next meeting** (shown on the Join page and in the join confirmation):

```bash
docker compose exec postgres psql -U emsa_user emsa -c "INSERT INTO site_settings (key, value) VALUES ('next_meeting', 'Wednesday, October 1, 7:00 PM, Room, Building') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;"
```

**Update an impact number.** One change updates Home, About, What We Do, Naloxone, and CPR Classes together. Keys: `cpr_certified`, `stop_the_bleed`, `narcan_kits`, `test_strips`, `condoms`, `frat_houses`, `members`.

```bash
docker compose exec postgres psql -U emsa_user emsa -c "UPDATE impact_stats SET value = 85 WHERE key = 'cpr_certified';"
```

**Mark a naloxone request fulfilled** (it's then deleted automatically after 30 days):

```bash
docker compose exec postgres psql -U emsa_user emsa -c "UPDATE naloxone_requests SET fulfilled = true WHERE id = 7;"
```

---

## 5. Put it on the internet (AWS EC2)

Use an **EMSA-owned AWS account** created with the EMSA entity email, never a personal account (CLAUDE.md).

1. **Launch a server.** EC2 → Launch instance → Ubuntu 24.04, `t3.small`, 20 GB disk. Security group: SSH (22) from your IP only, HTTP (80) and HTTPS (443) from anywhere.
2. **Point the domain** (no "Miami" in the name) at the server's Elastic IP with an A record.
3. **Install Docker and Caddy** (Caddy handles HTTPS certificates automatically):
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose-v2 caddy git
   sudo usermod -aG docker ubuntu && newgrp docker
   ```
4. **Get the code and configure it:**
   ```bash
   git clone https://github.com/jmarple1/emsa-website.git && cd emsa-website && git switch fullstack && cd app
   cp .env.example .env && nano .env      # set passwords and JWT_SECRET; set HTTP_PORT=8080
   docker compose up --build -d
   ```
5. **Turn on HTTPS.** Put this in `/etc/caddy/Caddyfile` (use your domain), then run `sudo systemctl reload caddy`:
   ```
   emsa-example.org {
       reverse_proxy localhost:8080
   }
   ```
   Don't add a `log` line to the Caddyfile. Access logs would record the IP address of people who request naloxone, which brief §11 rules out.
6. **Create the first officer account** (section 2) and test a form.

The containers restart on their own after a reboot (`restart: unless-stopped`).

**Updating the live site later:** `cd ~/emsa-website && git pull && cd app && docker compose up --build -d`

**Backups** (do this before any big change, and on a schedule):

```bash
docker compose exec postgres pg_dump -U emsa_user emsa > emsa-backup-$(date +%F).sql
```

Keep backups in the EMSA Google Drive, not on a personal laptop. They contain submissions.

---

## Privacy (brief §11)

- The naloxone form has no name field. The backend never stores or logs the requester's IP or browser details, nginx doesn't log that route, and rate limiting uses a salted hash that's kept only in memory.
- Fulfilled naloxone requests are deleted automatically after `NALOXONE_RETENTION_DAYS` (default 30).
- Only signed-in officers can read any submission.

## Troubleshooting

| Problem | Fix |
|---|---|
| `docker compose up` says to set `DB_PASSWORD` or `JWT_SECRET` | Create `app/.env` from `.env.example` (section 1) |
| Site doesn't load | `docker compose ps`: all three should be "running" or "healthy". Then check `docker compose logs backend` |
| Backend keeps restarting | Usually a wrong `DB_PASSWORD` after changing it. The password is fixed when the database is first created, so change it back or reset with `docker compose down -v` (erases data) |
| "Port is already allocated" | Another program uses `HTTP_PORT`; pick another in `.env` |
| Officer login says "Too many requests" | 5 tries per minute; wait a minute |

## For developers

- API: `GET /api/health`, `/api/impact`, `/api/classes`, `/api/events`, `/api/settings/next-meeting`; `POST /api/join`, `/api/classes/{id}/register`, `/api/group-class-requests`, `/api/naloxone-requests`, `/api/auth/login`; `GET /api/admin/{join|registrations|group-requests|naloxone}` (JWT, add `?format=csv`). Validation errors come back as `400 {"error", "fields": {field: message}}`.
- Frontend dev server: `cd frontend && npm install && npx ng serve` with the stack running. API calls need a proxy to the nginx port (`proxy.conf.json`); the Docker build is the tested path.
- Page text was ported word for word from the static pages at the repo root. If the brief changes, edit both until the static pages are retired.
- Drogon comes from Ubuntu 24.04's `libdrogon-dev` (1.8.7, built with PostgreSQL). There's no source build.
