import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext.jsx';
import { api } from '../api.js';
import ItemCard from '../components/ItemCard.jsx';
import AddItemModal from '../components/AddItemModal.jsx';
import ShareBar from '../components/ShareBar.jsx';
import ModePicker from '../theme/ModePicker.jsx';
import { useTheme } from '../theme/ThemeContext.jsx';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const [items, setItems] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const { theme, mode, setMode, isSeasonal } = useTheme();
    const d = theme.dashboard;

    useEffect(() => {
        api.listItems().then(setItems).catch(() => {});
    }, []);

    async function handleChange(id, delta) {
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, count: Math.max(0, i.count + delta) } : i)));
        try {
            const result = await api.updateItem(id, delta);
            setItems((prev) => prev.map((i) => (i.id === id ? { ...i, count: result.count } : i)));
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
                    <button
                        onClick={logout}
                        className="px-3 py-2 nb-border nb-shadow rounded-lg text-xs font-black uppercase transition active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                        style={{ background: 'var(--surface)' }}
                    >
                        Salir
                    </button>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-5 pt-6 flex flex-col gap-5">
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
            </main>

            {showAdd && <AddItemModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
            <ModePicker mode={mode} setMode={setMode} isSeasonal={isSeasonal} theme={theme} />
        </div>
    );
}
