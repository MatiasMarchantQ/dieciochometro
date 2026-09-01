import { useState } from 'react';

const EMOJI_PRESETS = ['🍽️', '🥂', '🍹', '🥔', '🌽', '🍞', '🧀', '🍰', '🥃', '🍗'];

export default function AddItemModal({ onClose, onAdd }) {
    const [emoji, setEmoji] = useState('🍽️');
    const [name, setName] = useState('');

    function submit() {
        const trimmed = name.trim();
        if (!trimmed) return;
        onAdd({ emoji, name: trimmed });
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-5 z-20">
            <div
                className="nb-border nb-shadow rounded-xl w-full max-w-xs p-6"
                style={{ background: 'var(--surface)', color: 'var(--text)' }}
            >
                <h2 className="font-display text-xl font-black uppercase mb-3">Agregar item</h2>

                <label className="text-xs font-black uppercase">Emoji</label>
                <div className="flex flex-wrap gap-2 my-2">
                    {EMOJI_PRESETS.map((e) => (
                        <button
                            key={e}
                            onClick={() => setEmoji(e)}
                            className="w-9 h-9 rounded-lg text-lg nb-border"
                            style={{
                                background: e === emoji ? 'var(--bg-app)' : 'var(--surface)',
                                boxShadow: e === emoji ? '3px 3px 0px var(--surface-border)' : 'none',
                            }}
                        >
                            {e}
                        </button>
                    ))}
                    <input
                        className="w-9 h-9 rounded-lg text-lg nb-border text-center"
                        maxLength={4}
                        value={emoji}
                        onChange={(e) => setEmoji(e.target.value)}
                    />
                </div>

                <label className="text-xs font-black uppercase">Nombre</label>
                <input
                    className="nb-border rounded-lg px-3 py-2 w-full mt-1 font-semibold"
                    maxLength={40}
                    placeholder="Ej: Pisco Sour"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && submit()}
                />

                <div className="flex gap-3 mt-5">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-lg py-2 nb-border nb-shadow font-black uppercase transition active:translate-x-[5px] active:translate-y-[5px] active:shadow-none"
                        style={{ background: 'var(--surface)' }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={submit}
                        className="flex-1 rounded-lg py-2 nb-border nb-shadow font-black uppercase text-white transition active:translate-x-[5px] active:translate-y-[5px] active:shadow-none"
                        style={{ background: 'var(--accent)' }}
                    >
                        Agregar
                    </button>
                </div>
            </div>
        </div>
    );
}
