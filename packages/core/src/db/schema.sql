-- CSM search index schema (FTS5)
CREATE TABLE IF NOT EXISTS skills_meta (
  skill_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source TEXT NOT NULL,
  root_path TEXT NOT NULL,
  category_path TEXT NOT NULL DEFAULT '',
  has_scripts INTEGER NOT NULL DEFAULT 0,
  mtime INTEGER NOT NULL DEFAULT 0,
  validation_ok INTEGER NOT NULL DEFAULT 1,
  git_dirty INTEGER NOT NULL DEFAULT 0
);

CREATE VIRTUAL TABLE IF NOT EXISTS skills_fts USING fts5(
  skill_id UNINDEXED,
  name,
  description,
  body,
  source UNINDEXED,
  root_path UNINDEXED,
  tokenize = 'unicode61'
);

CREATE TABLE IF NOT EXISTS index_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
