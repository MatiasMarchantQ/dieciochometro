import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

function dismissDelay(count) {
    return Math.min(3500 + count * 1200, 7000);
}

export default function Toast({ messages, onClose }) {
    useEffect(() => {
        if (!messages.length) return undefined;
        const timer = setTimeout(onClose, dismissDelay(messages.length));
        return () => clearTimeout(timer);
    }, [messages, onClose]);

    return (
        <AnimatePresence>
            {messages.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    className="relative w-full nb-border nb-shadow rounded-xl p-4 flex flex-col gap-2 overflow-hidden"
                    style={{ background: 'var(--surface)', color: 'var(--text)' }}
                >
                    <button
                        onClick={onClose}
                        className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center nb-border rounded-full text-sm font-black leading-none"
                        style={{ background: 'var(--surface)', color: 'var(--text)' }}
                    >
                        ×
                    </button>
                    {messages.map((message, i) => (
                        <p key={i} className="text-sm font-bold text-center">
                            {message}
                        </p>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
