import Database from 'better-sqlite3';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SkillSummary } from '../types.js';
import { parseSkillMdFile } from '../parse.js';
import { indexDbPath } from '../config.js';

const SCHEMA_VERSION = '1';

const __dirname = dirname(fileURLToPath(import.meta.url));

export type SearchHit = {
  skillId: string;
  score: number;
};

export function openIndexDb(personalRoot: string): Database.Database {
  const path = indexDbPath(personalRoot);
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  return db;
}

export async function initSchema(db: Database.Database): Promise<void> {
  const sql = await readFile(join(__dirname, 'schema.sql'), 'utf8');
  db.exec(sql);
}

export function getIndexMeta(db: Database.Database, key: string): string | undefined {
  const row = db.prepare('SELECT value FROM index_meta WHERE key = ?').get(key) as
    | { value: string }
    | undefined;
  return row?.value;
}

export function setIndexMeta(db: Database.Database, key: string, value: string): void {
  db.prepare(
    'INSERT INTO index_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
  ).run(key, value);
}

export function isIndexHealthy(db: Database.Database): boolean {
  try {
    const version = getIndexMeta(db, 'schema_version');
    if (version !== SCHEMA_VERSION) return false;
    db.prepare('SELECT COUNT(*) AS c FROM skills_meta').get();
    db.prepare('SELECT skill_id FROM skills_fts LIMIT 1').get();
    return true;
  } catch {
    return false;
  }
}

function ftsEscapeQuery(q: string): string {
  const trimmed = q.trim();
  if (!trimmed) return '';
  return trimmed
    .replace(/["']/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => `"${t}"*`)
    .join(' ');
}

async function bodyForSkill(skill: SkillSummary): Promise<string> {
  try {
    const parsed = await parseSkillMdFile(skill.skillMdPath);
    return parsed.bodyMarkdown;
  } catch {
    return '';
  }
}

export interface IndexRebuildResult {
  count: number;
  durationMs: number;
}

export async function indexRebuild(
  db: Database.Database,
  skills: SkillSummary[],
  gitDirtyIds: Set<string> = new Set(),
): Promise<IndexRebuildResult> {
  const start = Date.now();
  const bodies = new Map<string, string>();
  for (const skill of skills) {
    bodies.set(skill.skillId, await bodyForSkill(skill));
  }

  const run = db.transaction((items: SkillSummary[]) => {
    db.exec('DELETE FROM skills_meta');
    db.exec('DELETE FROM skills_fts');

    const insertMeta = db.prepare(`
      INSERT INTO skills_meta (
        skill_id, name, source, root_path, category_path,
        has_scripts, mtime, validation_ok, git_dirty
      ) VALUES (
        @skill_id, @name, @source, @root_path, @category_path,
        @has_scripts, @mtime, @validation_ok, @git_dirty
      )
    `);

    const insertFts = db.prepare(`
      INSERT INTO skills_fts (skill_id, name, description, body, source, root_path)
      VALUES (@skill_id, @name, @description, @body, @source, @root_path)
    `);

    for (const skill of items) {
      insertMeta.run({
        skill_id: skill.skillId,
        name: skill.name,
        source: skill.source,
        root_path: skill.rootPath,
        category_path: skill.categoryPath,
        has_scripts: skill.hasScripts ? 1 : 0,
        mtime: skill.mtimeMs,
        validation_ok: skill.validation.ok ? 1 : 0,
        git_dirty: gitDirtyIds.has(skill.skillId) ? 1 : 0,
      });
      insertFts.run({
        skill_id: skill.skillId,
        name: skill.name,
        description: skill.description,
        body: bodies.get(skill.skillId) ?? '',
        source: skill.source,
        root_path: skill.rootPath,
      });
    }
  });

  run(skills);

  setIndexMeta(db, 'schema_version', SCHEMA_VERSION);
  setIndexMeta(db, 'built_at', String(Date.now()));

  return { count: skills.length, durationMs: Date.now() - start };
}

export function searchSkillIds(
  db: Database.Database,
  query: string,
  limit = 100,
): SearchHit[] {
  const ftsQ = ftsEscapeQuery(query);
  if (!ftsQ) return [];

  try {
    const rows = db
      .prepare(
        `
      SELECT skill_id, bm25(skills_fts) AS rank
      FROM skills_fts
      WHERE skills_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `,
      )
      .all(ftsQ, limit) as { skill_id: string; rank: number }[];

    return rows.map((r) => ({
      skillId: r.skill_id,
      score: Math.abs(r.rank),
    }));
  } catch {
    const like = `%${query.trim()}%`;
    const rows = db
      .prepare(
        `
      SELECT skill_id FROM skills_meta
      WHERE name LIKE ? OR skill_id LIKE ?
      LIMIT ?
    `,
      )
      .all(like, like, limit) as { skill_id: string }[];
    return rows.map((r) => ({ skillId: r.skill_id, score: 0 }));
  }
}

export function filterSkillIds(
  db: Database.Database,
  opts: {
    source?: string;
    categoryPath?: string;
    gitDirty?: boolean;
    validationOk?: boolean;
  },
): string[] {
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (opts.source) {
    clauses.push('source = ?');
    params.push(opts.source);
  }
  if (opts.categoryPath !== undefined) {
    clauses.push('category_path = ?');
    params.push(opts.categoryPath);
  }
  if (opts.gitDirty === true) {
    clauses.push('git_dirty = 1');
  }
  if (opts.validationOk === true) {
    clauses.push('validation_ok = 1');
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = db
    .prepare(`SELECT skill_id FROM skills_meta ${where} ORDER BY name`)
    .all(...params) as { skill_id: string }[];
  return rows.map((r) => r.skill_id);
}
