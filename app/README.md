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

There is no public sign-up page on purpose. Anyone who can run commands on the server can add an officer. On the live server (see "Server access" in section 4 for `KEY` and `SERVER`):

```bash
ssh -i "$KEY" -t "$SERVER" "cd ~/emsa && ./scripts/create-officer.sh"
```

Locally, run `./scripts/create-officer.sh` from the `app/` folder (Git Bash on Windows).

It asks for a **username or email** (what the officer types to sign in), their name, and a password of at least 12 characters, and stores only a bcrypt hash of the password. **Running it again with the same username resets that officer's password.**

**To remove an officer** (on the server, from `~/emsa`):

```bash
docker compose exec postgres psql -U emsa_user emsa -c "DELETE FROM officers WHERE lower(email) = lower('Username');"
```

## 3. The officer dashboard

Go to **https://emsamu.site/admin** (locally: `http://localhost:HTTP_PORT/admin`) and sign in. Sign-ins last 2 hours. The dashboard has six tabs:

| Tab | What officers do there |
|---|---|
| **Overview** | Headline numbers and charts for the last 30 days, 90 days, or all time: join sign-ups per week, sign-ups by year (and how many are EMTs), how full each upcoming class is, naloxone requests by item, and page views per week and by page (counted without cookies or IP addresses; see the /privacy page). Every chart has **Show as table**. |
| **Classes** | Add, edit, close, or delete classes. They appear on the CPR Classes page right away; registration stops by itself when a class is full. Times are Oxford (Eastern) time. Deleting a class also deletes its registrations (the page asks first). |
| **Events** | Add, edit, or delete events (meetings, the distribution night, outreach). Upcoming ones show on the Events page. |
| **Site content** | The next meeting, open officer roles, contact email, social media links, what's in a naloxone kit, the Heart Club description, the AED map link, the Ohio-requirements FAQ answer, the web officer and the **Leadership** list on About (one "Name \| Role" per line; update after elections), plus the seven **impact numbers** (one change updates every page). Empty boxes are left out of the page (visitors never see a "placeholder" box). |
| **Submissions** | Join forms, class registrations, group class requests, and naloxone requests, newest first, with search and **Download CSV**. Mark naloxone requests **fulfilled** once handed over; they're deleted automatically 30 days later. |
| **Account** | Change your own password (needs your current one; at least 12 characters). New officers should do this the first time they sign in. |

What officers **can't** change from the dashboard, on purpose: the footer disclaimers (AHA, Miami independence line, 911 line), the recognition strip, and the rest of the fact-checked page text. Those need a code change (`frontend/src/app/pages/`). Editable text is plain text only; links must start with `https://`.

Naloxone requests are private (brief §11). Don't copy them anywhere else.

---

## 4. The live site (how it's set up)

**https://emsamu.site** runs on a small AWS EC2 server shared with another site, KnottSoDirtyCo. DNS is at Namecheap.

**Server access.** The server's address, login user, and SSH key are **not in this repo**, on purpose, because the repo is public. The web officer keeps them privately and hands them to their successor, along with the AWS and Namecheap logins. The commands below assume you've set two variables first (Git Bash):

```bash
KEY=/path/to/server-key.pem     # the private SSH key; never commit it
SERVER=user@server-address      # from the web officer
```

| Piece | Where |
|---|---|
| EMSA's containers (postgres, backend, frontend) | `~/emsa` on the server, started with `docker-compose.yml` + `docker-compose.prod.yml` |
| Secrets (DB password, JWT secret) | `~/emsa/.env` on the server only (generated there, never in Git) |
| HTTPS for **both** sites | KnottSoDirty's nginx container holds ports 80/443. Its `emsamu.site` blocks come from `deploy/emsamu.site.conf`; it reaches EMSA over the shared `edge` Docker network |
| Certificates | Let's Encrypt via certbot on the server; renews automatically. Renewal hooks briefly stop and restart KnottSoDirty's web container while it renews |

**Deploying an update.** The server is too small to build the Angular app, so build on a PC and copy the images:

```bash
cd app
docker compose build                     # builds emsa-backend and emsa-frontend
docker save emsa-backend:latest emsa-frontend:latest | gzip -1 | \
  ssh -i "$KEY" "$SERVER" 'gunzip | docker load'
scp -i "$KEY" docker-compose.yml docker-compose.prod.yml "$SERVER":emsa/
scp -i "$KEY" -r database scripts deploy "$SERVER":emsa/
ssh -i "$KEY" "$SERVER" \
  'cd ~/emsa && docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d && docker image prune -f'
```

Schema changes in `database/schema.sql` apply automatically when the backend restarts (every statement is `IF NOT EXISTS`).

**If KnottSoDirty is redeployed** from its own repo, keep the `edge` network on its frontend service and the `emsamu.site` blocks in `nginx-https.conf`, or emsamu.site goes down. Backups of both files are in `~/backups/` on the server.

**Uptime alert.** A GitHub Actions job (`.github/workflows/uptime.yml`, run from `main`) checks both sites every hour and fails if either is down or a certificate is within 14 days of expiring. GitHub emails the repo owner when it fails. GitHub pauses scheduled jobs after 60 days without a commit; re-enable it from the Actions tab if that happens.

**Backups** run every night at 3:15 a.m. Oxford time (cron on the server runs `scripts/backup.sh`) for both EMSA and KnottSoDirty. They land in `~/backups/emsa/` and `~/backups/talbot/` and are kept for 14 days. Check them with `ls -lh ~/backups/emsa`. To copy the newest one off the server:

```bash
scp -i "$KEY" "$SERVER:backups/emsa/*$(date +%F).sql.gz" .
```

A backup on the same server doesn't survive losing the server, so copy one to the EMSA Google Drive now and then, and never keep them on a personal laptop, because they contain submissions. To restore: `gunzip -c emsa-DATE.sql.gz | docker exec -i emsa-postgres-1 psql -U emsa_user emsa` (into an empty database).

**Moving to an EMSA-owned AWS account later** (CLAUDE.md asks for this): launch Ubuntu with Docker, copy `~/emsa` and a database backup over, restore it with `psql`, put a small HTTPS proxy in front (Caddy works: `emsamu.site { reverse_proxy localhost:8088 }`, with no `log` line so naloxone requesters' IPs are never written), set `HTTP_PORT=8088` in `.env`, drop `docker-compose.prod.yml`'s `edge` network, and point Namecheap at the new IP.

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
| Dashboard says "Your session ended" | Sign-ins last 2 hours; sign in again |

## For developers

- Public API: `GET /api/health`, `/api/impact`, `/api/classes`, `/api/events`, `/api/content`, `/api/settings/next-meeting`; `POST /api/join`, `/api/classes/{id}/register`, `/api/group-class-requests`, `/api/naloxone-requests`, `/api/pageview`, `/api/auth/login`. Form routes are rate limited.
- Officer API (JWT required, `backend/src/controllers/`):
  - Submissions: `GET /api/admin/{join|registrations|group-requests|naloxone}` (add `?format=csv`), `GET /api/admin/page-views`, `PATCH /api/admin/naloxone/{id}` (mark fulfilled).
  - Editing: `GET/POST /api/admin/classes`, `PUT/DELETE /api/admin/classes/{id}`; the same for `/api/admin/events`; `GET /api/admin/content`, `PUT /api/admin/content/{key}`; `PUT /api/admin/impact/{key}`.
  - Account: `POST /api/admin/password`.
- Validation errors come back as `400 {"error", "fields": {field: message}}`.
- Layout: shared page styles are in `frontend/src/app-additions.css`; each page's markup is in `frontend/src/app/pages/<page>/`. The September 2026 design pass shortened pages and moved the CPR page's AHA disclaimer into the footer, which carries it word for word on every page.
- Frontend dev server: `cd frontend && npm install && npx ng serve` with the stack running. API calls need a proxy to the nginx port (`proxy.conf.json`); the Docker build is the tested path.
- Page text was ported word for word from the static pages at the repo root. If the brief changes, edit both until the static pages are retired.
- Drogon comes from Ubuntu 24.04's `libdrogon-dev` (1.8.7, built with PostgreSQL). There's no source build.
