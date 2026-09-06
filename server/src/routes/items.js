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
    const occurredOn = String(req.body.date || '').trim();

    if (!id || !delta) {
        return res.status(422).json({ error: 'Datos inválidos' });
    }

    const { rows: itemRows } = await db.execute({
        sql: 'SELECT emoji, name, count FROM items WHERE id = ? AND user_id = ?',
        args: [id, req.userId],
    });
    const item = itemRows[0];
    if (!item) {
        return res.status(404).json({ error: 'Item no encontrado' });
    }

    const newCount = Math.max(0, item.count + delta);
    const appliedDelta = newCount - item.count;

    await db.execute({
        sql: 'UPDATE items SET count = ? WHERE id = ? AND user_id = ?',
        args: [newCount, id, req.userId],
    });

    if (appliedDelta !== 0) {
        await db.execute({
            sql: `INSERT INTO item_logs (user_id, item_id, emoji, name, delta, occurred_on)
                  VALUES (?, ?, ?, ?, ?, COALESCE(NULLIF(?, ''), date('now')))`,
            args: [req.userId, id, item.emoji, item.name, appliedDelta, occurredOn],
        });
    }

    res.json({ id, count: newCount });
});

router.get('/history', async (req, res) => {
    const { rows } = await db.execute({
        sql: `SELECT occurred_on, emoji, name, SUM(delta) AS total
              FROM item_logs
              WHERE user_id = ?
              GROUP BY occurred_on, emoji, name
              HAVING SUM(delta) > 0
              ORDER BY occurred_on DESC, total DESC`,
        args: [req.userId],
    });
    res.json(rows);
});

router.delete('/:id', async (req, res) => {
    const id = Number(req.params.id);
    await db.execute({ sql: 'DELETE FROM items WHERE id = ? AND user_id = ?', args: [id, req.userId] });
    res.json({ ok: true });
});

export default router;
