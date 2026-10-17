/**
 * Dual Persistence Layer: Neon PostgreSQL Serverless + Offline-First Fallback
 */

let pool = null;

export async function getDb() {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null; // Signals fallback to local storage or in-memory
  }

  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(connectionString);
    pool = sql;
    return pool;
  } catch (err) {
    console.warn('[DB] Could not initialize Neon client, falling back to local mode:', err.message);
    return null;
  }
}

export async function query(text, params = []) {
  const sql = await getDb();
  if (!sql) {
    return { rows: [], isFallback: true };
  }
  try {
    const result = await sql(text, params);
    return { rows: result, isFallback: false };
  } catch (err) {
    console.error('[DB] Query execution error:', err);
    return { rows: [], error: err.message, isFallback: true };
  }
}
