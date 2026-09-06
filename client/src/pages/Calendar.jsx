import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useTheme } from '../theme/ThemeContext.jsx';
import { toLocalDateString, addDays } from '../dateUtils.js';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function firstWeekdayIndex(year, month) {
    const jsDay = new Date(year, month, 1).getDay(); // 0 = domingo
    return (jsDay + 6) % 7; // 0 = lunes
}

export default function Calendar() {
    const { theme } = useTheme();
    const d = theme.dashboard;
    const today = useMemo(() => new Date(), []);
    const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
    const [history, setHistory] = useState([]);
    const [selectedDay, setSelectedDay] = useState(toLocalDateString(today));
    const [editingKey, setEditingKey] = useState(null);
    const [moveQty, setMoveQty] = useState(1);
    const [moveDate, setMoveDate] = useState('');
    const [moveError, setMoveError] = useState('');
    const [moving, setMoving] = useState(false);

    useEffect(() => {
        api.getHistory().then(setHistory).catch(() => {});
    }, []);

    function startEdit(row) {
        setEditingKey(`${row.emoji}|${row.name}`);
        setMoveQty(row.total);
        setMoveDate(addDays(selectedDay, -1));
        setMoveError('');
    }

    function cancelEdit() {
        setEditingKey(null);
        setMoveError('');
    }

    async function confirmMove(row) {
        setMoveError('');
        if (!moveDate || moveDate === selectedDay) {
            setMoveError('Elige una fecha distinta al día actual.');
            return;
        }
        setMoving(true);
        try {
            await api.moveHistory({ emoji: row.emoji, name: row.name, fromDate: selectedDay, toDate: moveDate, quantity: moveQty });
            setHistory(await api.getHistory());
            setEditingKey(null);
        } catch (err) {
            setMoveError(err.message);
        } finally {
            setMoving(false);
        }
    }

    const byDay = useMemo(() => {
        const map = new Map();
        for (const row of history) {
            if (!map.has(row.occurred_on)) map.set(row.occurred_on, []);
            map.get(row.occurred_on).push(row);
        }
        return map;
    }, [history]);

    const totalsByDay = useMemo(() => {
        const map = new Map();
        for (const [day, rows] of byDay) {
            map.set(day, rows.reduce((sum, r) => sum + r.total, 0));
        }
        return map;
    }, [byDay]);

    const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString('es-CL', {
        month: 'long',
        year: 'numeric',
    });
    const totalDays = daysInMonth(cursor.year, cursor.month);
    const offset = firstWeekdayIndex(cursor.year, cursor.month);
    const cells = [...Array(offset).fill(null), ...Array.from({ length: totalDays }, (_, i) => i + 1)];
    const selectedRows = byDay.get(selectedDay) || [];
    const selectedLabel = new Date(`${selectedDay}T00:00:00`).toLocaleDateString('es-CL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });

    function changeMonth(delta) {
        setCursor((prev) => {
            const date = new Date(prev.year, prev.month + delta, 1);
            return { year: date.getFullYear(), month: date.getMonth() };
        });
    }

    return (
        <div
            className="min-h-screen pb-10"
            style={{
                background: d.bgApp,
                color: d.text,
                '--bg-app': d.bgApp,
                '--surface': d.surface,
                '--surface-border': d.border,
                '--text': d.text,
                '--text-muted': d.textMuted,
                '--primary': d.primary,
                '--accent': d.accent,
            }}
        >
            <header className="nb-border border-t-0 border-x-0" style={{ background: 'var(--surface)' }}>
                <div className="max-w-xl mx-auto px-5 py-4 flex items-center justify-between">
                    <h1 className="font-display text-xl font-black uppercase">📅 Calendario</h1>
                    <Link
                        to="/"
                        className="px-3 py-2 nb-border nb-shadow rounded-lg text-xs font-black uppercase transition active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                        style={{ background: 'var(--surface)' }}
                    >
                        Volver
                    </Link>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-5 pt-6 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => changeMonth(-1)}
                        className="w-9 h-9 nb-border rounded-lg font-black"
                        style={{ background: 'var(--surface)' }}
                    >
                        ‹
                    </button>
                    <span className="font-display font-black uppercase capitalize">{monthLabel}</span>
                    <button
                        onClick={() => changeMonth(1)}
                        className="w-9 h-9 nb-border rounded-lg font-black"
                        style={{ background: 'var(--surface)' }}
                    >
                        ›
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs font-black uppercase" style={{ color: 'var(--text-muted)' }}>
                    {WEEKDAYS.map((w, i) => (
                        <div key={i}>{w}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {cells.map((day, i) => {
                        if (!day) return <div key={`empty-${i}`} />;
                        const dateStr = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const total = totalsByDay.get(dateStr) || 0;
                        const isSelected = dateStr === selectedDay;
                        const isToday = dateStr === toLocalDateString(today);
                        return (
                            <button
                                key={dateStr}
                                onClick={() => setSelectedDay(dateStr)}
                                className="aspect-square rounded-lg nb-border flex flex-col items-center justify-center gap-0.5 text-xs font-bold"
                                style={{
                                    background: isSelected ? 'var(--accent)' : 'var(--surface)',
                                    color: isSelected ? '#ffffff' : 'var(--text)',
                                    boxShadow: isToday && !isSelected ? 'inset 0 0 0 2px var(--primary)' : 'none',
                                }}
                            >
                                <span>{day}</span>
                                {total > 0 && <span className="text-[10px] opacity-80">🍽️{total}</span>}
                            </button>
                        );
                    })}
                </div>

                <div className="nb-border nb-shadow rounded-xl p-4" style={{ background: 'var(--surface)' }}>
                    <h2 className="font-display font-black uppercase mb-3 capitalize">{selectedLabel}</h2>
                    {selectedRows.length === 0 ? (
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                            Sin registros este día.
                        </p>
                    ) : (
                        <ul className="flex flex-col gap-2">
                            {selectedRows.map((row) => {
                                const key = `${row.emoji}|${row.name}`;
                                const isEditing = editingKey === key;
                                return (
                                    <li key={key} className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between text-sm font-semibold">
                                            <span>
                                                {row.emoji} {row.name}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-black">{row.total}</span>
                                                <button
                                                    onClick={() => (isEditing ? cancelEdit() : startEdit(row))}
                                                    title="¿Fue en otro día?"
                                                    className="w-6 h-6 flex items-center justify-center nb-border rounded-full text-xs"
                                                    style={{ background: 'var(--bg-app)' }}
                                                >
                                                    ✏️
                                                </button>
                                            </div>
                                        </div>

                                        {isEditing && (
                                            <div className="nb-border rounded-lg p-3 flex flex-col gap-2" style={{ background: 'var(--bg-app)' }}>
                                                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                                                    Mover a otro día (tu total no cambia)
                                                </p>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={row.total}
                                                        value={moveQty}
                                                        onChange={(e) => setMoveQty(Number(e.target.value))}
                                                        className="w-16 nb-border rounded-lg px-2 py-1 text-sm"
                                                        style={{ background: 'var(--surface)' }}
                                                    />
                                                    <input
                                                        type="date"
                                                        value={moveDate}
                                                        max={toLocalDateString(today)}
                                                        onChange={(e) => setMoveDate(e.target.value)}
                                                        className="flex-1 nb-border rounded-lg px-2 py-1 text-sm"
                                                        style={{ background: 'var(--surface)' }}
                                                    />
                                                </div>
                                                {moveError && (
                                                    <p className="text-xs font-semibold" style={{ color: '#c0392b' }}>
                                                        {moveError}
                                                    </p>
                                                )}
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={cancelEdit}
                                                        className="flex-1 nb-border rounded-lg py-1 text-xs font-black uppercase"
                                                        style={{ background: 'var(--surface)' }}
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        onClick={() => confirmMove(row)}
                                                        disabled={moving}
                                                        className="flex-1 nb-border rounded-lg py-1 text-xs font-black uppercase text-white"
                                                        style={{ background: 'var(--accent)' }}
                                                    >
                                                        {moving ? 'Moviendo…' : 'Mover'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </main>
        </div>
    );
}
