-- ============================================================
-- EMSA — Seed data. Applied on every start; idempotent.
-- Facts come ONLY from docs/BRIEF.md. Never seed class dates,
-- events, officers, or a next meeting here.
-- ============================================================

-- Impact numbers (brief §7). The display strings must not change:
-- value + suffix + ' ' + label, e.g. "76+ students certified in CPR".
-- ON CONFLICT DO NOTHING so officer edits made later are never
-- overwritten by a restart.
INSERT INTO impact_stats (key, value, suffix, label, sort) VALUES
    ('cpr_certified',  76,   '+', 'students certified in CPR', 10),
    ('stop_the_bleed', 30,   '',  'trained in Stop the Bleed', 20),
    ('narcan_kits',    200,  '',  'Narcan kits',               30),
    ('test_strips',    2000, '',  'fentanyl test strips',      40),
    ('condoms',        500,  '',  'condoms',                   50),  -- Harm Reduction page only, not the Home strip
    ('frat_houses',    25,   '',  'fraternity houses',         60),
    ('members',        60,   '+', 'members',                   70)   -- never say "active"
ON CONFLICT (key) DO NOTHING;
