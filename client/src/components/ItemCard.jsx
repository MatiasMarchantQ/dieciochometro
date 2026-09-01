import { motion, AnimatePresence } from 'framer-motion';

export default function ItemCard({ item, onChange, onDelete }) {
    return (
        <motion.article
            layout
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.85 }}
            className="relative nb-border nb-shadow rounded-xl p-4 text-center"
            style={{ background: 'var(--surface)' }}
        >
            <button
                onClick={() => onDelete(item.id)}
                title="Eliminar"
                className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center nb-border rounded-full text-sm font-black leading-none"
                style={{ background: 'var(--surface)' }}
            >
                ×
            </button>

            <div className="text-4xl">{item.emoji}</div>
            <div className="text-xs font-black uppercase tracking-wide mt-1 mb-2">{item.name}</div>

            <AnimatePresence mode="popLayout">
                <motion.div
                    key={item.count}
                    initial={{ y: -8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 8, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="font-display text-4xl font-black mb-3"
                    style={{ color: 'var(--accent)' }}
                >
                    {item.count}
                </motion.div>
            </AnimatePresence>

            <div className="flex justify-center gap-2">
                <button
                    onClick={() => onChange(item.id, -1)}
                    className="nb-border nb-shadow transition w-10 h-10 rounded-lg font-black text-lg active:translate-x-[5px] active:translate-y-[5px] active:shadow-none"
                    style={{ background: 'var(--surface)' }}
                >
                    −
                </button>
                <button
                    onClick={() => onChange(item.id, 1)}
                    className="nb-border nb-shadow transition w-10 h-10 rounded-lg font-black text-lg text-white active:translate-x-[5px] active:translate-y-[5px] active:shadow-none"
                    style={{ background: 'var(--primary)' }}
                >
                    +
                </button>
            </div>
        </motion.article>
    );
}
