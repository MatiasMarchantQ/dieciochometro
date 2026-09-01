import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
    const items = db
        .prepare('SELECT id, emoji, name, count FROM items WHERE user_id = ? ORDER BY sort_order, id')
        .all(req.userId);
    res.json(items);
});

router.post('/', (req, res) => {
    const name = String(req.body.name || '').trim();
    const emoji = String(req.body.emoji || '').trim() || '🍽️';

    if (!name || name.length > 40) {
        return res.status(422).json({ error: 'Nombre inválido' });
    }

    const { nextOrder } = db
        .prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS nextOrder FROM items WHERE user_id = ?')
        .get(req.userId);

    const { lastInsertRowid } = db
        .prepare('INSERT INTO items (user_id, emoji, name, count, sort_order) VALUES (?, ?, ?, 0, ?)')
        .run(req.userId, emoji, name, nextOrder);

    res.status(201).json({ id: lastInsertRowid, emoji, name, count: 0 });
});

router.patch('/:id', (req, res) => {
    const id = Number(req.params.id);
    const delta = Number(req.body.delta || 0);

    if (!id || !delta) {
        return res.status(422).json({ error: 'Datos inválidos' });
    }

    db.prepare('UPDATE items SET count = MAX(0, count + ?) WHERE id = ? AND user_id = ?').run(delta, id, req.userId);

    const item = db.prepare('SELECT count FROM items WHERE id = ? AND user_id = ?').get(id, req.userId);
    if (!item) {
        return res.status(404).json({ error: 'Item no encontrado' });
    }
    res.json({ id, count: item.count });
});

router.delete('/:id', (req, res) => {
    const id = Number(req.params.id);
    db.prepare('DELETE FROM items WHERE id = ? AND user_id = ?').run(id, req.userId);
    res.json({ ok: true });
});

export default router;
