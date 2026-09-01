import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
    const { rows } = await db.execute({
        sql: 'SELECT id, emoji, name, count FROM items WHERE user_id = ? ORDER BY sort_order, id',
        args: [req.userId],
    });
    res.json(rows);
});

router.post('/', async (req, res) => {
    const name = String(req.body.name || '').trim();
    const emoji = String(req.body.emoji || '').trim() || '🍽️';

    if (!name || name.length > 40) {
        return res.status(422).json({ error: 'Nombre inválido' });
    }

    const maxOrderResult = await db.execute({
        sql: 'SELECT COALESCE(MAX(sort_order), -1) + 1 AS nextOrder FROM items WHERE user_id = ?',
        args: [req.userId],
    });
    const nextOrder = maxOrderResult.rows[0].nextOrder;

    const insert = await db.execute({
        sql: 'INSERT INTO items (user_id, emoji, name, count, sort_order) VALUES (?, ?, ?, 0, ?)',
        args: [req.userId, emoji, name, nextOrder],
    });

    res.status(201).json({ id: Number(insert.lastInsertRowid), emoji, name, count: 0 });
});

router.patch('/:id', async (req, res) => {
    const id = Number(req.params.id);
    const delta = Number(req.body.delta || 0);

    if (!id || !delta) {
        return res.status(422).json({ error: 'Datos inválidos' });
    }

    await db.execute({
        sql: 'UPDATE items SET count = MAX(0, count + ?) WHERE id = ? AND user_id = ?',
        args: [delta, id, req.userId],
    });

    const { rows } = await db.execute({
        sql: 'SELECT count FROM items WHERE id = ? AND user_id = ?',
        args: [id, req.userId],
    });
    if (!rows[0]) {
        return res.status(404).json({ error: 'Item no encontrado' });
    }
    res.json({ id, count: rows[0].count });
});

router.delete('/:id', async (req, res) => {
    const id = Number(req.params.id);
    await db.execute({ sql: 'DELETE FROM items WHERE id = ? AND user_id = ?', args: [id, req.userId] });
    res.json({ ok: true });
});

export default router;
