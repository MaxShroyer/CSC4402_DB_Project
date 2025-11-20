"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withDb = exports.closeDb = exports.getDb = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const ROOT_DIR = path_1.default.resolve(__dirname, '..', '..');
const DB_PATH = path_1.default.resolve(ROOT_DIR, 'database/wiki.db');
let connection = null;
const getDb = () => {
    if (!connection) {
        connection = new better_sqlite3_1.default(DB_PATH);
        connection.pragma('foreign_keys = ON');
    }
    return connection;
};
exports.getDb = getDb;
const closeDb = () => {
    if (connection) {
        connection.close();
        connection = null;
    }
};
exports.closeDb = closeDb;
const withDb = (fn) => {
    const db = (0, exports.getDb)();
    try {
        return fn(db);
    }
    finally {
        // connection is reused globally; do not close here
    }
};
exports.withDb = withDb;
