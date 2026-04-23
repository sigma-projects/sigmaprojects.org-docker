CREATE TABLE IF NOT EXISTS projects (
  projectid   INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  ses_title   TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  longdescription TEXT DEFAULT '',
  public      INTEGER DEFAULT 1,
  type        TEXT DEFAULT 'product',
  subtype     TEXT DEFAULT '',
  thumbnail_path TEXT DEFAULT '',
  web_url     TEXT DEFAULT '',
  git_url     TEXT DEFAULT '',
  created     TEXT DEFAULT (datetime('now')),
  updated     TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS gallery (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  projectid             INTEGER NOT NULL REFERENCES projects(projectid) ON DELETE CASCADE,
  title                 TEXT DEFAULT '',
  name                  TEXT DEFAULT '',
  width                 INTEGER DEFAULT 0,
  height                INTEGER DEFAULT 0,
  img_path              TEXT DEFAULT '',
  thumb_small_path      TEXT DEFAULT '',
  thumb_medium_path     TEXT DEFAULT '',
  thumb_medium_wide_path TEXT DEFAULT '',
  thumb_large_path      TEXT DEFAULT '',
  sort_order            INTEGER DEFAULT 0,
  created               TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS project_updates (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  projectid   INTEGER NOT NULL REFERENCES projects(projectid) ON DELETE CASCADE,
  title       TEXT DEFAULT '',
  description TEXT DEFAULT '',
  created     TEXT DEFAULT (datetime('now')),
  updated     TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS files (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  projectid   INTEGER NOT NULL REFERENCES projects(projectid) ON DELETE CASCADE,
  title       TEXT DEFAULT '',
  name        TEXT DEFAULT '',
  size        INTEGER DEFAULT 0,
  file_path   TEXT DEFAULT '',
  created     TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,
  name        TEXT DEFAULT '',
  created     TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contact (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  subject     TEXT DEFAULT '',
  name        TEXT DEFAULT '',
  email       TEXT DEFAULT '',
  company     TEXT DEFAULT '',
  message     TEXT DEFAULT '',
  created     TEXT DEFAULT (datetime('now'))
);
