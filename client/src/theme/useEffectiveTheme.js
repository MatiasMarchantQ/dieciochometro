import { useEffect, useState } from 'react';
import { EVENT_THEMES, getSeasonalEventId } from './eventThemes.js';

const KEY = 'dieciochometro:mode';

export function useEffectiveTheme() {
    const [mode, setMode] = useState(() => {
        try {
            return localStorage.getItem(KEY) === 'oscuro' ? 'oscuro' : 'blanco';
        } catch {
            return 'blanco';
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(KEY, mode);
        } catch {
            // ignore storage failures (private browsing, etc.)
        }
    }, [mode]);

    let previewId = null;
    try {
        const requested = new URLSearchParams(window.location.search).get('evento');
        if (requested && EVENT_THEMES[requested]) previewId = requested;
    } catch {
        // ignore (no window/location, e.g. SSR)
    }

    const seasonalId = previewId || getSeasonalEventId();
    const themeId = seasonalId || mode;
    const theme = EVENT_THEMES[themeId];

    return { theme, themeId, mode, setMode, isSeasonal: Boolean(seasonalId) };
}
