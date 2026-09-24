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

There is no public sign-up page on purpose. Anyone who can run commands on the server can add an officer. On the live server (from a Windows PowerShell window with the server key):

```powershell
ssh -i "C:path	oTalbotKey.pem" -t ubuntu@18.189.134.211 "cd ~/emsa && ./scripts/create-officer.sh"
```

Locally, run `./scripts/create-officer.sh` from the `app/` folder (Git Bash on Windows).

It asks for a **username or email** (what the officer types to sign in), their name, and a password of at least 12 characters, and stores only a bcrypt hash of the password. **Running it again with the same username resets that officer's password.**

**To remove an officer** (on the server, from `~/emsa`):

```bash
docker compose exec postgres psql -U emsa_user emsa -c "DELETE FROM officers WHERE lower(email) = lower('Username');"
```

## 3. The officer dashboard

Go to **https://emsamu.site/admin** (locally: `http://localhost:HTTP_PORT/admin`) and sign in. Sign-ins last 2 hours. The dashboard has five tabs:

| Tab | What officers do there |
|---|---|
| **Overview** | Headline numbers and charts for the last 30 days, 90 days, or all time: join sign-ups per week, sign-ups by year (and how many are EMTs), how full each upcoming class is, and naloxone requests by item. Every chart has **Show as table**. |
| **Classes** | Add, edit, close, or delete classes. They appear on the CPR Classes page right away; registration stops by itself when a class is full. Times are Oxford (Eastern) time. Deleting a class also deletes its registrations (the page asks first). |
| **Events** | Add, edit, or delete events (meetings, the distribution night, outreach). Upcoming ones show on the Events page. |
| **Site content** | The next meeting, open officer roles, contact email, social media links, what's in a naloxone kit, the Heart Club description, the AED map link, the Ohio-requirements FAQ answer, and the web officer on About, plus the seven **impact numbers** (one change updates every page). Empty boxes show the page's original placeholder. |
| **Submissions** | Join forms, class registrations, group class requests, and naloxone requests, newest first, with search and **Download CSV**. Mark naloxone requests **fulfilled** once handed over; they're deleted automatically 30 days later. |

What officers **can't** change from the dashboard, on purpose: the footer disclaimers (AHA, Miami independence line, 911 line), the recognition strip, and the rest of the fact-checked page text. Those need a code change (`frontend/src/app/pages/`). Editable text is plain text only; links must start with `https://`.

Naloxone requests are private (brief §11). Don't copy them anywhere else.

---

## 4. The live site (how it's set up)

**https://emsamu.site** runs on the same AWS EC2 server as KnottSoDirtyCo (`18.189.134.211`, an Elastic IP, Ubuntu, t3.micro, 20 GB disk, 1 GB swap). DNS is at Namecheap: A records for `@` and `www` point to that IP.

| Piece | Where |
|---|---|
| EMSA's containers (postgres, backend, frontend) | `~/emsa` on the server, started with `docker-compose.yml` + `docker-compose.prod.yml` |
| Secrets (DB password, JWT secret) | `~/emsa/.env` on the server only (generated there, never in Git) |
| HTTPS for **both** sites | KnottSoDirty's nginx container (`~/talbot/nginx-https.conf`) holds ports 80/443. The `emsamu.site` blocks in it come from `deploy/emsamu.site.conf`; it reaches EMSA over the shared `edge` Docker network |
| Certificates | Let's Encrypt via certbot on the server; renews automatically. Hooks in `/etc/letsencrypt/renewal-hooks/` stop and restart KnottSoDirty's web container for the ~10 seconds renewal needs |

**Deploying an update.** The server is too small (1 GB) to build the Angular app, so build on a PC and copy the images:

```bash
cd app
docker compose build                     # builds emsa-backend and emsa-frontend
docker save emsa-backend:latest emsa-frontend:latest | gzip -1 |   ssh -i TalbotKey.pem ubuntu@18.189.134.211 'gunzip | docker load'
scp -i TalbotKey.pem docker-compose.yml docker-compose.prod.yml ubuntu@18.189.134.211:emsa/
scp -i TalbotKey.pem -r database scripts deploy ubuntu@18.189.134.211:emsa/
ssh -i TalbotKey.pem ubuntu@18.189.134.211   'cd ~/emsa && docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d && docker image prune -f'
```

Schema changes in `database/schema.sql` apply automatically when the backend restarts (every statement is `IF NOT EXISTS`).

**If KnottSoDirty is redeployed** from its own repo, keep the `edge` network on its frontend service and the `emsamu.site` blocks in `nginx-https.conf`, or emsamu.site goes down. Backups of both files are in `~/backups/` on the server.

**Backups** run every night at 3:15 a.m. Oxford time (cron on the server runs `scripts/backup.sh`) for both EMSA and KnottSoDirty. They land in `~/backups/emsa/` and `~/backups/talbot/` and are kept for 14 days. Check them with `ls -lh ~/backups/emsa`. To copy the newest one off the server:

```bash
scp -i TalbotKey.pem "ubuntu@18.189.134.211:backups/emsa/*$(date +%F).sql.gz" .
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

- API: `GET /api/health`, `/api/impact`, `/api/classes`, `/api/events`, `/api/settings/next-meeting`; `POST /api/join`, `/api/classes/{id}/register`, `/api/group-class-requests`, `/api/naloxone-requests`, `/api/auth/login`; `GET /api/admin/{join|registrations|group-requests|naloxone}` (JWT, add `?format=csv`). Validation errors come back as `400 {"error", "fields": {field: message}}`.
- Frontend dev server: `cd frontend && npm install && npx ng serve` with the stack running. API calls need a proxy to the nginx port (`proxy.conf.json`); the Docker build is the tested path.
- Page text was ported word for word from the static pages at the repo root. If the brief changes, edit both until the static pages are retired.
- Drogon comes from Ubuntu 24.04's `libdrogon-dev` (1.8.7, built with PostgreSQL). There's no source build.
