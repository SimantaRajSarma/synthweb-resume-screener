import Database from "better-sqlite3";
import path from "path";
import type { AnalysisResult } from "./schema";

export interface AnalysisRecord {
  id: number;
  created_at: string;
  candidate_name: string;
  match_score: number;
  result_json: string;
  job_description: string;
  resume_text: string;
}

export interface ParsedAnalysisRecord {
  id: number;
  created_at: string;
  candidate_name: string;
  match_score: number;
  result: AnalysisResult & {
    meta?: {
      wasTruncated?: boolean;
      truncatedFields?: string[];
      injectionDetected?: boolean;
      injectionReasons?: string[];
    };
  };
  job_description: string;
  resume_text: string;
}

export interface SearchAnalysesFilters {
  name?: string;
  minScore?: number;
  maxScore?: number;
}

let dbInstance: Database.Database | null = null;
let currentDbPath: string | null = null;

/**
 * Initializes the SQLite database and creates the `analyses` table and indexes if they do not exist.
 */
export function initDatabase(customPath?: string): Database.Database {
  const resolvedPath =
    customPath ||
    process.env.DB_PATH ||
    path.join(process.cwd(), "analyses.db");

  if (dbInstance && currentDbPath === resolvedPath) {
    return dbInstance;
  }

  if (dbInstance && currentDbPath !== resolvedPath) {
    try {
      dbInstance.close();
    } catch {
      // ignore close errors when switching test DBs
    }
  }

  const db = new Database(resolvedPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      candidate_name TEXT NOT NULL,
      match_score INTEGER NOT NULL,
      result_json TEXT NOT NULL,
      job_description TEXT NOT NULL,
      resume_text TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_analyses_candidate_name
      ON analyses(candidate_name);

    CREATE INDEX IF NOT EXISTS idx_analyses_match_score
      ON analyses(match_score);
  `);

  dbInstance = db;
  currentDbPath = resolvedPath;
  return db;
}

export interface InsertAnalysisInput {
  candidate_name: string;
  match_score: number;
  result: AnalysisResult & {
    meta?: {
      wasTruncated?: boolean;
      truncatedFields?: string[];
      injectionDetected?: boolean;
      injectionReasons?: string[];
    };
  };
  job_description: string;
  resume_text: string;
}

/**
 * Inserts a validated analysis record into SQLite using parameterized statements.
 */
export function insertAnalysis(
  input: InsertAnalysisInput,
  db: Database.Database = initDatabase()
): ParsedAnalysisRecord {
  const stmt = db.prepare(`
    INSERT INTO analyses (
      candidate_name,
      match_score,
      result_json,
      job_description,
      resume_text
    ) VALUES (?, ?, ?, ?, ?)
  `);

  const serializedResult = JSON.stringify(input.result);
  const info = stmt.run(
    input.candidate_name,
    input.match_score,
    serializedResult,
    input.job_description,
    input.resume_text
  );

  const insertedId = Number(info.lastInsertRowid);
  const row = db
    .prepare(`SELECT * FROM analyses WHERE id = ?`)
    .get(insertedId) as AnalysisRecord;

  return parseRecord(row);
}

/**
 * Searches analyses with optional candidate_name substring match and min/max score bounds.
 * Uses strictly parameterized queries to prevent SQL injection.
 */
export function searchAnalyses(
  filters: SearchAnalysesFilters = {},
  db: Database.Database = initDatabase()
): ParsedAnalysisRecord[] {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filters.name && filters.name.trim() !== "") {
    const escapedName = filters.name.trim().replace(/[\\%_]/g, "\\$&");
    conditions.push("LOWER(candidate_name) LIKE LOWER(?) ESCAPE '\\'");
    params.push(`%${escapedName}%`);
  }

  if (
    typeof filters.minScore === "number" &&
    !Number.isNaN(filters.minScore)
  ) {
    conditions.push("match_score >= ?");
    params.push(filters.minScore);
  }

  if (
    typeof filters.maxScore === "number" &&
    !Number.isNaN(filters.maxScore)
  ) {
    conditions.push("match_score <= ?");
    params.push(filters.maxScore);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT id, created_at, candidate_name, match_score, result_json, job_description, resume_text
    FROM analyses
    ${whereClause}
    ORDER BY created_at DESC, id DESC
    LIMIT 200
  `;

  const rows = db.prepare(sql).all(...params) as AnalysisRecord[];
  return rows.map(parseRecord);
}

/**
 * Retrieves a single analysis by ID using a parameterized query.
 */
export function getAnalysisById(
  id: number,
  db: Database.Database = initDatabase()
): ParsedAnalysisRecord | null {
  const row = db
    .prepare(
      `SELECT id, created_at, candidate_name, match_score, result_json, job_description, resume_text
       FROM analyses
       WHERE id = ?`
    )
    .get(id) as AnalysisRecord | undefined;

  if (!row) return null;
  return parseRecord(row);
}

function parseRecord(row: AnalysisRecord): ParsedAnalysisRecord {
  return {
    id: row.id,
    created_at: row.created_at,
    candidate_name: row.candidate_name,
    match_score: row.match_score,
    result: JSON.parse(row.result_json),
    job_description: row.job_description,
    resume_text: row.resume_text,
  };
}
