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

    if (appliedDelta > 0) {
        await db.execute({
            sql: `INSERT INTO item_logs (user_id, item_id, emoji, name, delta, occurred_on)
                  VALUES (?, ?, ?, ?, ?, COALESCE(NULLIF(?, ''), date('now')))`,
            args: [req.userId, id, item.emoji, item.name, appliedDelta, occurredOn],
        });
    } else if (appliedDelta < 0) {
        // Descontar de los días más recientes hacia atrás (LIFO), empezando
        // en la fecha indicada (hoy por defecto) y sin tocar días futuros:
        // así "bajar a 0" no deja un número negativo tapando lo que sumes
        // después, y un ajuste hecho desde un día puntual del calendario
        // no termina descontando de otro día distinto al que se editó.
        let remaining = -appliedDelta;
        const effectiveDate = occurredOn || new Date().toISOString().slice(0, 10);
        const { rows: dayRows } = await db.execute({
            sql: `SELECT occurred_on, SUM(delta) AS total FROM item_logs
                  WHERE user_id = ? AND item_id = ? AND occurred_on <= ?
                  GROUP BY occurred_on
                  HAVING SUM(delta) > 0
                  ORDER BY occurred_on DESC`,
            args: [req.userId, id, effectiveDate],
        });

        const writes = [];
        for (const day of dayRows) {
            if (remaining <= 0) break;
            const take = Math.min(remaining, day.total);
            writes.push({
                sql: 'INSERT INTO item_logs (user_id, item_id, emoji, name, delta, occurred_on) VALUES (?, ?, ?, ?, ?, ?)',
                args: [req.userId, id, item.emoji, item.name, -take, day.occurred_on],
            });
            remaining -= take;
        }
        if (remaining > 0) {
            writes.push({
                sql: `INSERT INTO item_logs (user_id, item_id, emoji, name, delta, occurred_on)
                      VALUES (?, ?, ?, ?, ?, COALESCE(NULLIF(?, ''), date('now')))`,
                args: [req.userId, id, item.emoji, item.name, -remaining, occurredOn],
            });
        }
        if (writes.length) {
            await db.batch(writes, 'write');
        }
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

router.get('/pace', async (req, res) => {
    const date = String(req.query.date || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(422).json({ error: 'Fecha inválida' });
    }

    const { rows } = await db.execute({
        sql: `SELECT emoji, name, SUM(delta) AS total, MIN(created_at) AS first_at
              FROM item_logs
              WHERE user_id = ? AND occurred_on = ?
              GROUP BY emoji, name
              HAVING SUM(delta) > 0`,
        args: [req.userId, date],
    });

    const totalToday = rows.reduce((sum, r) => sum + r.total, 0);
    const earliest = rows.reduce((min, r) => (!min || r.first_at < min ? r.first_at : min), null);
    const top = rows.reduce((max, r) => (!max || r.total > max.total ? r : max), null);

    res.json({
        totalToday,
        earliest: earliest ? earliest.replace(' ', 'T') + 'Z' : null,
        top: top ? { emoji: top.emoji, name: top.name, total: top.total } : null,
    });
});

router.post('/history/move', async (req, res) => {
    const emoji = String(req.body.emoji || '').trim();
    const name = String(req.body.name || '').trim();
    const fromDate = String(req.body.fromDate || '').trim();
    const toDate = String(req.body.toDate || '').trim();
    const quantity = Math.trunc(Number(req.body.quantity || 0));

    if (!emoji || !name || !fromDate || !toDate || fromDate === toDate || quantity <= 0) {
        return res.status(422).json({ error: 'Datos inválidos' });
    }

    const { rows } = await db.execute({
        sql: `SELECT COALESCE(SUM(delta), 0) AS total FROM item_logs
              WHERE user_id = ? AND emoji = ? AND name = ? AND occurred_on = ?`,
        args: [req.userId, emoji, name, fromDate],
    });
    const available = rows[0].total;
    if (quantity > available) {
        return res.status(422).json({ error: `Solo tienes ${available} registrado ese día.` });
    }

    await db.batch(
        [
            {
                sql: 'INSERT INTO item_logs (user_id, emoji, name, delta, occurred_on) VALUES (?, ?, ?, ?, ?)',
                args: [req.userId, emoji, name, -quantity, fromDate],
            },
            {
                sql: 'INSERT INTO item_logs (user_id, emoji, name, delta, occurred_on) VALUES (?, ?, ?, ?, ?)',
                args: [req.userId, emoji, name, quantity, toDate],
            },
        ],
        'write'
    );

    res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
    const id = Number(req.params.id);
    await db.execute({ sql: 'DELETE FROM items WHERE id = ? AND user_id = ?', args: [id, req.userId] });
    res.json({ ok: true });
});

export default router;
