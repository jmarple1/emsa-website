-- ============================================================
-- EMS Alliance (EMSA) — Database Schema
-- Applied by backend/entrypoint.sh on every start.
-- Safe to re-run: every statement uses IF NOT EXISTS.
-- ============================================================

SET client_min_messages = warning;           -- hide "already exists, skipping" on restarts

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- crypt() / gen_salt('bf') for officer passwords

-- ----------------------------------------------------------
-- Join interest form (brief §6: exactly these fields)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS join_submissions (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(200) NOT NULL,
    miami_email   VARCHAR(254) NOT NULL CHECK (lower(miami_email) LIKE '%@miamioh.edu'),
    year          VARCHAR(50)  NOT NULL,
    major         VARCHAR(200) NOT NULL,
    emt_certified BOOLEAN      NOT NULL,
    heard_from    VARCHAR(500) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------
-- CPR / Stop the Bleed class sessions (officers add these; empty seed)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS classes (
    id         SERIAL PRIMARY KEY,
    course     VARCHAR(30)  NOT NULL CHECK (course IN ('BLS', 'Heartsaver', 'Stop the Bleed')),
    starts_at  TIMESTAMPTZ  NOT NULL,
    ends_at    TIMESTAMPTZ  NOT NULL CHECK (ends_at > starts_at),
    location   VARCHAR(300) NOT NULL,
    capacity   INTEGER      NOT NULL CHECK (capacity > 0),
    is_open    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------
-- Class registrations. Capacity is enforced in the backend inside a
-- transaction that locks the class row (see ClassController).
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS class_registrations (
    id          SERIAL PRIMARY KEY,
    class_id    INTEGER      NOT NULL REFERENCES classes (id) ON DELETE CASCADE,
    name        VARCHAR(200) NOT NULL,
    miami_email VARCHAR(254) NOT NULL CHECK (lower(miami_email) LIKE '%@miamioh.edu'),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
-- One registration per email per class, case-insensitive
CREATE UNIQUE INDEX IF NOT EXISTS uq_class_registrations_class_email
    ON class_registrations (class_id, lower(miami_email));

-- ----------------------------------------------------------
-- "Request a class for your group" (brief §5 CPR Classes)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS group_class_requests (
    id              SERIAL PRIMARY KEY,
    group_name      VARCHAR(200) NOT NULL,
    contact_name    VARCHAR(200) NOT NULL,
    contact_email   VARCHAR(254) NOT NULL,
    preferred_dates TEXT         NOT NULL,
    course          VARCHAR(30)  NOT NULL CHECK (course IN ('BLS', 'Heartsaver', 'Stop the Bleed')),
    headcount       INTEGER      NOT NULL CHECK (headcount BETWEEN 1 AND 1000),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------
-- Naloxone / supply requests (brief §11 privacy rules)
-- NO name column. The backend never stores or logs IPs or user agents
-- for this route. Fulfilled rows are deleted automatically after
-- NALOXONE_RETENTION_DAYS (backend, default 30).
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS naloxone_requests (
    id             SERIAL PRIMARY KEY,
    requesting_for VARCHAR(20)  NOT NULL CHECK (requesting_for IN ('self', 'chapter_house')),
    chapter_house  VARCHAR(200),
    items          TEXT[]       NOT NULL,
    pickup         VARCHAR(30)  NOT NULL CHECK (pickup IN ('distribution_night', 'arranged')),
    contact_method VARCHAR(300),
    fulfilled      BOOLEAN      NOT NULL DEFAULT FALSE,
    fulfilled_at   TIMESTAMPTZ,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CHECK (requesting_for = 'chapter_house' OR chapter_house IS NULL),
    CHECK (pickup = 'arranged' OR contact_method IS NULL)
);

-- ----------------------------------------------------------
-- Events calendar (replaces the Google Calendar embed; empty seed)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    starts_at   TIMESTAMPTZ  NOT NULL,
    ends_at     TIMESTAMPTZ  CHECK (ends_at IS NULL OR ends_at > starts_at),
    location    VARCHAR(300),
    description TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------
-- Impact numbers: the ONE source for Home, About, What We Do, Naloxone
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS impact_stats (
    key        VARCHAR(50)  PRIMARY KEY,
    value      INTEGER      NOT NULL CHECK (value >= 0),
    suffix     VARCHAR(10)  NOT NULL DEFAULT '',
    label      VARCHAR(200) NOT NULL,
    sort       INTEGER      NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------
-- Small editable settings, e.g. next_meeting (Join page)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_settings (
    key        VARCHAR(100) PRIMARY KEY,
    value      TEXT         NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------
-- Officer accounts (bcrypt via pgcrypto, same as KnottSoDirtyCo).
-- Created only with scripts/create-officer.sh — no public signup.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS officers (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(254) NOT NULL,
    name          VARCHAR(200) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,   -- crypt(pw, gen_salt('bf', 12))
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_officers_email ON officers (lower(email));

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_classes_starts_at   ON classes (starts_at);
CREATE INDEX IF NOT EXISTS idx_events_starts_at    ON events (starts_at);
CREATE INDEX IF NOT EXISTS idx_naloxone_fulfilled  ON naloxone_requests (fulfilled, fulfilled_at);
