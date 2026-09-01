import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db, { DEFAULT_ITEMS } from '../db.js';
import { issueSession, clearSession, requireAuth } from '../auth.js';
import { DEFAULT_THEME } from '../themes.js';

const router = Router();

function publicUser(row) {
    return {
        id: row.id,
        username: row.username,
        displayName: row.display_name,
        theme: row.theme,
    };
}

router.post('/register', (req, res) => {
    const username = String(req.body.username || '').trim();
    const displayName = String(req.body.displayName || '').trim();
    const password = String(req.body.password || '');

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        return res.status(422).json({ error: 'El usuario debe tener 3 a 20 caracteres: letras, números o guión bajo.' });
    }
    if (!displayName) {
        return res.status(422).json({ error: 'Ingresa tu nombre.' });
    }
    if (password.length < 6) {
        return res.status(422).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (exists) {
        return res.status(409).json({ error: 'Ese usuario ya existe, elige otro.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const insertUser = db.prepare(
        'INSERT INTO users (username, display_name, password_hash, theme) VALUES (?, ?, ?, ?)'
    );
    const { lastInsertRowid: userId } = insertUser.run(username, displayName, passwordHash, DEFAULT_THEME);

    const insertItem = db.prepare(
        'INSERT INTO items (user_id, emoji, name, count, sort_order) VALUES (?, ?, ?, 0, ?)'
    );
    DEFAULT_ITEMS.forEach((item, order) => insertItem.run(userId, item.emoji, item.name, order));

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    issueSession(res, userId);
    res.status(201).json(publicUser(user));
});

router.post('/login', (req, res) => {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }

    issueSession(res, user.id);
    res.json(publicUser(user));
});

router.post('/logout', (req, res) => {
    clearSession(res);
    res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
    if (!user) return res.status(401).json({ error: 'No autenticado' });
    res.json(publicUser(user));
});

export default router;
