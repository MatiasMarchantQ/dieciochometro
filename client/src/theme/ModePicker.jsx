import { motion } from 'framer-motion';

export default function ModePicker({ mode, setMode, isSeasonal, theme }) {
    if (isSeasonal) {
        return (
            <div className="fixed top-4 right-4 z-20 px-3 py-2 rounded-full text-sm font-semibold backdrop-blur bg-black/40 text-white">
                {theme.emoji} {theme.label}
            </div>
        );
    }

    const isDark = mode === 'oscuro';

    return (
        <button
            role="switch"
            aria-checked={isDark}
            aria-label="Cambiar modo claro/oscuro"
            onClick={() => setMode(isDark ? 'blanco' : 'oscuro')}
            className="fixed top-4 right-4 z-20 w-16 h-9 rounded-full flex items-center px-1 shadow-md transition-colors"
            style={{ background: isDark ? '#27272a' : '#d4d4d8' }}
        >
            <motion.span
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm shadow"
                style={{ background: isDark ? '#18181b' : '#ffffff' }}
                animate={{ x: isDark ? 28 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            >
                {isDark ? '🌙' : '☀️'}
            </motion.span>
        </button>
    );
}
