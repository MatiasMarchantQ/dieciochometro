import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext.jsx';
import { api } from '../api.js';
import ItemCard from '../components/ItemCard.jsx';
import AddItemModal from '../components/AddItemModal.jsx';
import ShareBar from '../components/ShareBar.jsx';
import Credit from '../components/Credit.jsx';
import ModePicker from '../theme/ModePicker.jsx';
import { useTheme } from '../theme/ThemeContext.jsx';
import { toLocalDateString } from '../dateUtils.js';
import { getFiestasMessage } from '../fiestasPatrias.js';

const MIN_PACE_HOURS = 0.25; // bajo esto el ritmo/hora es puro ruido

export default function Dashboard() {
    const { user, logout } = useAuth();
    const [items, setItems] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [pace, setPace] = useState(null);
    const { theme, mode, setMode, isSeasonal } = useTheme();
    const d = theme.dashboard;

    useEffect(() => {
        api.listItems().then(setItems).catch(() => {});
        refreshPace();
    }, []);

    function refreshPace() {
        api.getPace(toLocalDateString()).then(setPace).catch(() => {});
    }

    async function handleChange(id, delta) {
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, count: Math.max(0, i.count + delta) } : i)));
        try {
            const result = await api.updateItem(id, delta, toLocalDateString());
            setItems((prev) => prev.map((i) => (i.id === id ? { ...i, count: result.count } : i)));
            refreshPace();
        } catch {
            api.listItems().then(setItems).catch(() => {});
        }
    }

    async function handleDelete(id) {
        if (!confirm('¿Eliminar este item?')) return;
        setItems((prev) => prev.filter((i) => i.id !== id));
        await api.deleteItem(id).catch(() => {});
    }

    async function handleAdd(payload) {
        const item = await api.addItem(payload);
        setItems((prev) => [...prev, item]);
        setShowAdd(false);
    }

    const fiestasMessage = useMemo(() => getFiestasMessage(toLocalDateString()), []);

    const champion = items.reduce((max, i) => (i.count > 0 && (!max || i.count > max.count) ? i : max), null);

    let paceMessage = null;
    if (pace?.top && pace.earliest) {
        const elapsedHours = (Date.now() - new Date(pace.earliest).getTime()) / 3_600_000;
        if (elapsedHours >= MIN_PACE_HOURS) {
            const rate = pace.top.total / elapsedHours;
            paceMessage = `Vas a ${rate.toFixed(1)} ${pace.top.emoji} ${pace.top.name}/hora 🔥`;
        }
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
                <div className="flex">
                    <div className="h-2 flex-1" style={{ background: 'var(--primary)' }} />
                    <div className="h-2 flex-1" style={{ background: 'var(--surface)' }} />
                    <div className="h-2 flex-1" style={{ background: 'var(--accent)' }} />
                </div>
                <div className="max-w-xl mx-auto px-5 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="font-display text-2xl font-black uppercase">
                            {theme.headerEmoji} {theme.appName}
                        </h1>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                            Hola, {user.displayName}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            to="/calendar"
                            className="px-3 py-2 nb-border nb-shadow rounded-lg text-xs font-black uppercase transition active:translate-x-[4px] active:translate-y-[4px] active:shadow-none shrink-0"
                            style={{ background: 'var(--surface)' }}
                        >
                            📅
                        </Link>
                        <button
                            onClick={logout}
                            className="px-3 py-2 nb-border nb-shadow rounded-lg text-xs font-black uppercase transition active:translate-x-[4px] active:translate-y-[4px] active:shadow-none shrink-0"
                            style={{ background: 'var(--surface)' }}
                        >
                            Salir
                        </button>
                        <ModePicker mode={mode} setMode={setMode} isSeasonal={isSeasonal} theme={theme} inline />
                    </div>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-5 pt-6 flex flex-col gap-5">
                {fiestasMessage && (
                    <div
                        className="nb-border nb-shadow rounded-xl px-4 py-3 text-center font-display font-black uppercase text-sm"
                        style={{ background: 'var(--primary)', color: '#ffffff' }}
                    >
                        {fiestasMessage}
                    </div>
                )}

                {(champion || paceMessage) && (
                    <div className="flex flex-col gap-2">
                        {champion && (
                            <div
                                className="nb-border rounded-xl px-4 py-2 text-center text-sm font-bold"
                                style={{ background: 'var(--surface)' }}
                            >
                                🏆 Tu campeón: {champion.emoji} {champion.name} con {champion.count}
                            </div>
                        )}
                        {paceMessage && (
                            <div
                                className="nb-border rounded-xl px-4 py-2 text-center text-sm font-bold"
                                style={{ background: 'var(--surface)' }}
                            >
                                {paceMessage}
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {items.map((item) => (
                            <ItemCard key={item.id} item={item} onChange={handleChange} onDelete={handleDelete} />
                        ))}
                    </AnimatePresence>
                </div>

                <button
                    onClick={() => setShowAdd(true)}
                    className="w-full py-3 nb-border rounded-xl font-black uppercase transition active:translate-x-[3px] active:translate-y-[3px]"
                    style={{ borderStyle: 'dashed', background: 'var(--surface)' }}
                >
                    + Agregar item
                </button>

                <ShareBar items={items} theme={theme} />

                <Credit color={d.textMuted} />
            </main>

            {showAdd && <AddItemModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
        </div>
    );
}
