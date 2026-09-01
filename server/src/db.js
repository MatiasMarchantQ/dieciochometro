import { createClient } from '@libsql/client';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_THEME } from './themes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = createClient({
    url: process.env.TURSO_DATABASE_URL || `file:${path.join(__dirname, '..', 'dieciochometro.db')}`,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

await db.execute('PRAGMA foreign_keys = ON');

await db.batch(
    [
        `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            display_name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            theme TEXT NOT NULL DEFAULT '${DEFAULT_THEME}',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`,
        `CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            emoji TEXT NOT NULL DEFAULT '🍽️',
            name TEXT NOT NULL,
            count INTEGER NOT NULL DEFAULT 0,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`,
    ],
    'write'
);

export const DEFAULT_ITEMS = [
    { emoji: '🥩', name: 'Asados' },
    { emoji: '🥟', name: 'Empanadas' },
    { emoji: '🌭', name: 'Choripanes' },
    { emoji: '🍹', name: 'Terremotos' },
    { emoji: '🍺', name: 'Cervezas' },
    { emoji: '🍷', name: 'Vinos' },
    { emoji: '🍢', name: 'Anticuchos' },
    { emoji: '🥃', name: 'Piscolas' },
];

export default db;
