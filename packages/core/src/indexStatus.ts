import type Database from 'better-sqlite3';
import { getIndexMeta } from './db/index.js';

export interface IndexStatus {
  healthy: boolean;
  needsRebuild: boolean;
  schemaVersion: string | null;
  builtAt: number | null;
  indexCount: number;
  scanCount: number;
  drift: number;
}

export function getIndexStatus(db: Database.Database, scanCount: number): IndexStatus {
  const schemaVersion = getIndexMeta(db, 'schema_version') ?? null;
  const builtAtRaw = getIndexMeta(db, 'built_at');
  const builtAt = builtAtRaw ? Number(builtAtRaw) : null;

  let indexCount = 0;
  try {
    const row = db.prepare('SELECT COUNT(*) AS c FROM skills_meta').get() as { c: number };
    indexCount = row.c;
  } catch {
    indexCount = 0;
  }

  const drift = Math.abs(indexCount - scanCount);
  const needsRebuild = drift > 0 || schemaVersion !== '2';

  return {
    healthy: !needsRebuild,
    needsRebuild,
    schemaVersion,
    builtAt: Number.isFinite(builtAt) ? builtAt : null,
    indexCount,
    scanCount,
    drift,
  };
}
