import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
    // El count guardado en items es una caché del historial real
    // (SUM(item_logs.delta)); si alguna vez se desincroniza (p.ej. un fallo
    // de red a mitad de una escritura vieja no atómica), no había forma de
    // corregirlo desde el Calendario: borrar un día solo descuenta lo
    // registrado ese día, nunca el "sobrante fantasma". Por eso acá se
    // recalcula desde la fuente de verdad y se autocorrige si no calzan.
    const { rows } = await db.execute({
        sql: `SELECT i.id, i.emoji, i.name, i.count AS cached_count,
                     COALESCE(SUM(l.delta), 0) AS real_count
              FROM items i
              LEFT JOIN item_logs l ON l.item_id = i.id
              WHERE i.user_id = ?
              GROUP BY i.id
              ORDER BY i.sort_order, i.id`,
        args: [req.userId],
    });

    const items = rows.map((r) => ({
        id: r.id,
        emoji: r.emoji,
        name: r.name,
        count: Math.max(0, r.real_count),
    }));

    const fixes = rows.filter((r) => Math.max(0, r.real_count) !== r.cached_count);
    if (fixes.length) {
        await db.batch(
            fixes.map((r) => ({
                sql: 'UPDATE items SET count = ? WHERE id = ?',
                args: [Math.max(0, r.real_count), r.id],
            })),
            'write'
        );
    }

    res.json(items);
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

    let cappedDelta = delta;
    if (delta < 0) {
        // Un día nunca puede quedar negativo: lo más que se puede restar es
        // lo que ese día ya tiene registrado (no se toca lo de otros días).
        // Se filtra por item_id (no por emoji+nombre) para no mezclar
        // registros huérfanos de un item eliminado que compartía el mismo
        // emoji+nombre: eso es lo que desincuadraba Inicio vs Calendario.
        const effectiveDate = occurredOn || new Date().toISOString().slice(0, 10);
        const { rows: dayRows } = await db.execute({
            sql: 'SELECT COALESCE(SUM(delta), 0) AS total FROM item_logs WHERE user_id = ? AND item_id = ? AND occurred_on = ?',
            args: [req.userId, id, effectiveDate],
        });
        cappedDelta = Math.max(delta, -dayRows[0].total);
    }

    const newCount = Math.max(0, item.count + cappedDelta);
    const appliedDelta = newCount - item.count;

    if (appliedDelta !== 0) {
        await db.batch(
            [
                {
                    sql: 'UPDATE items SET count = ? WHERE id = ? AND user_id = ?',
                    args: [newCount, id, req.userId],
                },
                {
                    sql: `INSERT INTO item_logs (user_id, item_id, emoji, name, delta, occurred_on)
                          VALUES (?, ?, ?, ?, ?, COALESCE(NULLIF(?, ''), date('now')))`,
                    args: [req.userId, id, item.emoji, item.name, appliedDelta, occurredOn],
                },
            ],
            'write'
        );
    }

    res.json({ id, count: newCount });
});

router.put('/:id/day', async (req, res) => {
    const id = Number(req.params.id);
    const date = String(req.body.date || '').trim();
    const quantity = Math.trunc(Number(req.body.quantity));

    if (!id || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(quantity) || quantity < 0) {
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

    // Se lee la suma real de ese día (sin el filtro "> 0" que usa el
    // historial), filtrando por item_id y no por emoji+nombre: así no se
    // mezcla con registros huérfanos de un item eliminado que compartía el
    // mismo emoji+nombre, que era lo que impedía cuadrar el día en 0.
    const { rows: sumRows } = await db.execute({
        sql: 'SELECT COALESCE(SUM(delta), 0) AS total FROM item_logs WHERE user_id = ? AND item_id = ? AND occurred_on = ?',
        args: [req.userId, id, date],
    });
    const currentDayTotal = sumRows[0].total;
    const rawDelta = quantity - currentDayTotal;

    if (rawDelta === 0) {
        return res.json({ id, count: item.count, dayTotal: quantity });
    }

    const newCount = Math.max(0, item.count + rawDelta);
    const appliedDelta = newCount - item.count;

    if (appliedDelta === 0) {
        return res.json({ id, count: item.count, dayTotal: currentDayTotal });
    }

    // Atómico (igual que en los otros endpoints): si esto se partiera en dos
    // escrituras separadas, un fallo entre medio dejaría count actualizado
    // pero sin su log correspondiente, y ese sobrante quedaría pegado para
    // siempre porque ninguna acción del Calendario puede tocar un sobrante
    // que no está respaldado por ningún registro.
    await db.batch(
        [
            {
                sql: 'UPDATE items SET count = ? WHERE id = ? AND user_id = ?',
                args: [newCount, id, req.userId],
            },
            {
                sql: 'INSERT INTO item_logs (user_id, item_id, emoji, name, delta, occurred_on) VALUES (?, ?, ?, ?, ?, ?)',
                args: [req.userId, id, item.emoji, item.name, appliedDelta, date],
            },
        ],
        'write'
    );

    res.json({ id, count: newCount, dayTotal: currentDayTotal + appliedDelta });
});

router.get('/history', async (req, res) => {
    // Se agrupa también por item_id: si un item se borró y se creó otro con
    // el mismo emoji+nombre, sus registros no deben mezclarse (SQLite trata
    // los item_id NULL como iguales entre sí, así que los huérfanos sí se
    // agrupan entre ellos por emoji+nombre, que es lo que se quiere).
    const { rows } = await db.execute({
        sql: `SELECT occurred_on, item_id, emoji, name, SUM(delta) AS total
              FROM item_logs
              WHERE user_id = ?
              GROUP BY occurred_on, item_id, emoji, name
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

    const { rows: itemMatch } = await db.execute({
        sql: 'SELECT id FROM items WHERE user_id = ? AND emoji = ? AND name = ?',
        args: [req.userId, emoji, name],
    });
    const itemId = itemMatch[0]?.id ?? null;

    // Igual que en los otros endpoints: se filtra por item_id (o, si es un
    // registro huérfano, por item_id IS NULL) para no mezclar con logs de
    // otro item que comparta emoji+nombre.
    const { rows } = await db.execute(
        itemId != null
            ? {
                  sql: `SELECT COALESCE(SUM(delta), 0) AS total FROM item_logs
                        WHERE user_id = ? AND item_id = ? AND occurred_on = ?`,
                  args: [req.userId, itemId, fromDate],
              }
            : {
                  sql: `SELECT COALESCE(SUM(delta), 0) AS total FROM item_logs
                        WHERE user_id = ? AND item_id IS NULL AND emoji = ? AND name = ? AND occurred_on = ?`,
                  args: [req.userId, emoji, name, fromDate],
              }
    );
    const available = rows[0].total;
    if (quantity > available) {
        return res.status(422).json({ error: `Solo tienes ${available} registrado ese día.` });
    }

    await db.batch(
        [
            {
                sql: 'INSERT INTO item_logs (user_id, item_id, emoji, name, delta, occurred_on) VALUES (?, ?, ?, ?, ?, ?)',
                args: [req.userId, itemId, emoji, name, -quantity, fromDate],
            },
            {
                sql: 'INSERT INTO item_logs (user_id, item_id, emoji, name, delta, occurred_on) VALUES (?, ?, ?, ?, ?, ?)',
                args: [req.userId, itemId, emoji, name, quantity, toDate],
            },
        ],
        'write'
    );

    res.json({ ok: true });
});

router.delete('/history/orphan', async (req, res) => {
    const emoji = String(req.body.emoji || '').trim();
    const name = String(req.body.name || '').trim();
    const date = String(req.body.date || '').trim();

    if (!emoji || !name || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(422).json({ error: 'Datos inválidos' });
    }

    // Registros huérfanos (item_id NULL) de un item ya eliminado: no afectan
    // el count de ningún item vivo, así que se pueden borrar directamente.
    await db.execute({
        sql: 'DELETE FROM item_logs WHERE user_id = ? AND item_id IS NULL AND emoji = ? AND name = ? AND occurred_on = ?',
        args: [req.userId, emoji, name, date],
    });

    res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
    const id = Number(req.params.id);
    await db.execute({ sql: 'DELETE FROM items WHERE id = ? AND user_id = ?', args: [id, req.userId] });
    res.json({ ok: true });
});

export default router;
