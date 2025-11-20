import Database from 'better-sqlite3';
import path from 'path';

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const DB_PATH = path.resolve(ROOT_DIR, 'database/wiki.db');

let connection: Database.Database | null = null;

export const getDb = (): Database.Database => {
  if (!connection) {
    connection = new Database(DB_PATH);
    connection.pragma('foreign_keys = ON');
  }

  return connection;
};

export const closeDb = (): void => {
  if (connection) {
    connection.close();
    connection = null;
  }
};

export const withDb = <T>(fn: (db: Database.Database) => T): T => {
  const db = getDb();
  try {
    return fn(db);
  } finally {
    // connection is reused globally; do not close here
  }
};
