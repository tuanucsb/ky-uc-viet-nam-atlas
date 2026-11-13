-- ============================================================================
-- KÝ ỨC VIỆT NAM ATLAS (1954–1975) — RELATIONAL SQLITE DATABASE SCHEMA
-- Single source of truth for Campaigns/Battles, Fallen Martyrs (Liệt sĩ),
-- National Martyrs' Cemeteries (Nghĩa trang), State Decorations (Huân chương /
-- Huy chương / Danh hiệu), and Wartime Unit Designations (Phiên hiệu).
-- ============================================================================

PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS martyr_links;
DROP TABLE IF EXISTS martyr_awards;
DROP TABLE IF EXISTS unit_battles;
DROP TABLE IF EXISTS battle_phases;
DROP TABLE IF EXISTS martyrs_fts;
DROP TABLE IF EXISTS martyrs;
DROP TABLE IF EXISTS martyr_families;
DROP TABLE IF EXISTS battles;
DROP TABLE IF EXISTS units;
DROP TABLE IF EXISTS cemeteries;
DROP TABLE IF EXISTS awards_catalog;
DROP TABLE IF EXISTS periods;

CREATE TABLE periods (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  short_label TEXT NOT NULL,
  years TEXT NOT NULL,
  color TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE cemeteries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  province TEXT NOT NULL,
  district_commune TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  established_year INTEGER,
  area_ha REAL,
  total_graves INTEGER,
  graves_note TEXT NOT NULL,
  summary TEXT NOT NULL,
  zones_info TEXT,
  image_url TEXT,
  image_width INTEGER,
  image_height INTEGER,
  image_caption TEXT,
  image_credit TEXT,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL
);

CREATE TABLE awards_catalog (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  category TEXT NOT NULL,
  rank_order INTEGER NOT NULL,
  instituted_by TEXT NOT NULL,
  description TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL
);

CREATE TABLE battles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  alt_name TEXT,
  period_id TEXT NOT NULL REFERENCES periods(id),
  date_range TEXT NOT NULL,
  year INTEGER NOT NULL,
  location_name TEXT NOT NULL,
  modern_province TEXT NOT NULL,
  military_zone TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  verification_level TEXT NOT NULL,
  summary TEXT NOT NULL,
  result TEXT,
  estimated_martyrs TEXT,
  archival_note TEXT,
  combatants_json TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  secondary_source_name TEXT,
  secondary_source_url TEXT
);

CREATE TABLE battle_phases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  battle_id TEXT NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  phase_order INTEGER NOT NULL,
  phase_date TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE units (
  code TEXT PRIMARY KEY,
  canonical TEXT NOT NULL,
  zone TEXT NOT NULL,
  aliases_json TEXT NOT NULL
);

CREATE TABLE martyr_families (
  id TEXT PRIMARY KEY,
  family_name TEXT NOT NULL,
  matriarch_patriarch TEXT NOT NULL,
  honor_titles TEXT,
  hometown TEXT NOT NULL,
  province TEXT NOT NULL,
  cemetery_id TEXT REFERENCES cemeteries(id),
  total_martyrs INTEGER NOT NULL,
  recorded_in_atlas INTEGER NOT NULL DEFAULT 0,
  summary TEXT NOT NULL,
  image_url TEXT,
  image_width INTEGER,
  image_height INTEGER,
  image_caption TEXT,
  image_credit TEXT,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  secondary_source_name TEXT,
  secondary_source_url TEXT
);

CREATE TABLE martyrs (
  id TEXT PRIMARY KEY,
  battle_id TEXT NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  cemetery_id TEXT REFERENCES cemeteries(id),
  family_id TEXT REFERENCES martyr_families(id),
  unit_code TEXT REFERENCES units(code),
  name TEXT NOT NULL,
  alias_name TEXT,
  birth_year INTEGER,
  age_at_sacrifice INTEGER,
  sacrifice_date TEXT NOT NULL,
  death_date TEXT,
  death_date_precision TEXT NOT NULL DEFAULT 'unknown' CHECK (death_date_precision IN ('day','month','year','range','unknown')),
  death_date_end TEXT,
  death_date_note TEXT,
  date_verified INTEGER NOT NULL DEFAULT 0,
  date_disputed INTEGER NOT NULL DEFAULT 0,
  sacrifice_year INTEGER,
  hometown TEXT NOT NULL,
  home_province TEXT NOT NULL,
  rank_role TEXT NOT NULL,
  unit_raw TEXT NOT NULL,
  enlistment_period TEXT,
  party_youth_status TEXT,
  sacrifice_location TEXT,
  family_role TEXT,
  family_info TEXT,
  commemoration_notes TEXT,
  cemetery_raw TEXT NOT NULL,
  grave_detail TEXT,
  is_collective INTEGER NOT NULL DEFAULT 0,
  verification_level TEXT NOT NULL,
  confidence REAL NOT NULL,
  story TEXT NOT NULL,
  letter_text TEXT,
  letter_json TEXT,
  portrait_url TEXT,
  portrait_width INTEGER,
  portrait_height INTEGER,
  image_kind TEXT,
  portrait_caption TEXT,
  portrait_credit TEXT,
  secondary_image_url TEXT,
  secondary_image_width INTEGER,
  secondary_image_height INTEGER,
  secondary_image_caption TEXT,
  secondary_image_credit TEXT,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  secondary_source_name TEXT,
  secondary_source_url TEXT
);

CREATE TABLE martyr_awards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  martyr_id TEXT NOT NULL REFERENCES martyrs(id) ON DELETE CASCADE,
  award_id TEXT NOT NULL REFERENCES awards_catalog(id) ON DELETE CASCADE,
  citation_label TEXT NOT NULL,
  awarded_year INTEGER,
  is_posthumous INTEGER NOT NULL DEFAULT 1,
  source_name TEXT,
  source_url TEXT,
  decision_ref TEXT,
  decision_date TEXT,
  award_verified INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE martyr_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  martyr_a_id TEXT NOT NULL REFERENCES martyrs(id) ON DELETE CASCADE,
  martyr_b_id TEXT NOT NULL REFERENCES martyrs(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL CHECK (relation_type IN ('family', 'same_squad', 'same_unit')),
  relation_label TEXT NOT NULL,
  shared_context TEXT,
  UNIQUE (martyr_a_id, martyr_b_id, relation_type)
);

CREATE TABLE unit_battles (
  unit_code TEXT NOT NULL REFERENCES units(code) ON DELETE CASCADE,
  battle_id TEXT NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  PRIMARY KEY (unit_code, battle_id)
);

CREATE INDEX idx_battles_period ON battles(period_id, year);
CREATE INDEX idx_martyrs_battle ON martyrs(battle_id);
CREATE INDEX idx_martyrs_cemetery ON martyrs(cemetery_id);
CREATE INDEX idx_martyrs_family ON martyrs(family_id);
CREATE INDEX idx_martyrs_unit_code ON martyrs(unit_code);
CREATE INDEX idx_martyrs_province ON martyrs(home_province);
CREATE INDEX idx_martyr_awards_martyr ON martyr_awards(martyr_id);
CREATE INDEX idx_martyr_awards_award ON martyr_awards(award_id);
CREATE INDEX idx_martyr_links_a ON martyr_links(martyr_a_id);
CREATE INDEX idx_martyr_links_b ON martyr_links(martyr_b_id);

CREATE VIRTUAL TABLE martyrs_fts USING fts5(
  martyr_id UNINDEXED,
  name,
  alias_name,
  hometown,
  home_province,
  unit_raw,
  rank_role,
  family_info,
  commemoration_notes,
  cemetery_raw,
  awards_text,
  story,
  letter_text
);
