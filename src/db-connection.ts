// Database Connection Utility
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Point to project root directory
const PROJECT_ROOT = join(__dirname, '..', '..');
const DB_PATH = join(PROJECT_ROOT, 'database', 'wiki.db');

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
    if (!db) {
        db = new Database(DB_PATH);
        db.pragma('foreign_keys = ON');
    }
    return db;
}

export function initializeDatabase(): void {
    const database = getDatabase();
    const schemaPath = join(PROJECT_ROOT, 'database', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    // Split by semicolons and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
        try {
            database.exec(statement);
        } catch (error) {
            console.error('Error executing statement:', statement);
            throw error;
        }
    }
    
    console.log('Database initialized successfully!');
}

export function closeDatabase(): void {
    if (db) {
        db.close();
        db = null;
    }
}

