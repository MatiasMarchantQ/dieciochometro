export const EVENT_THEMES = {
    blanco: {
        label: 'Claro',
        emoji: '☀️',
        appName: 'Dieciochómetro',
        headerEmoji: '🇨🇱',
        shareHeading: 'MI 18 EN NÚMEROS',
        auth: {
            pageBg: '#f2f2f2',
            cardBg: '#ffffff',
            border: '#111111',
            text: '#111111',
            textMuted: '#6b7280',
            accent: '#0039a6',
        },
        dashboard: {
            bgApp: '#fdf6e8',
            surface: '#ffffff',
            border: '#111111',
            text: '#111111',
            textMuted: '#57534e',
            primary: '#0039a6',
            accent: '#d52b1e',
        },
    },
    oscuro: {
        label: 'Oscuro',
        emoji: '🌙',
        appName: 'Dieciochómetro',
        headerEmoji: '🇨🇱',
        shareHeading: 'MI 18 EN NÚMEROS',
        auth: {
            pageBg: '#0a0a0a',
            cardBg: '#1c1c1c',
            border: '#f5f5f5',
            text: '#f5f5f5',
            textMuted: '#a1a1aa',
            accent: '#5b9bf0',
        },
        dashboard: {
            bgApp: '#111111',
            surface: '#1c1c1c',
            border: '#f5f5f5',
            text: '#f5f5f5',
            textMuted: '#a1a1aa',
            primary: '#5b9bf0',
            accent: '#ff6b5b',
        },
    },
    halloween: {
        label: 'Halloween',
        emoji: '🎃',
        appName: 'Halloweenómetro',
        headerEmoji: '🎃',
        shareHeading: 'MI HALLOWEEN EN NÚMEROS',
        auth: {
            pageBg: '#140b1e',
            cardBg: '#1e1030',
            border: '#ff7518',
            text: '#ffdca8',
            textMuted: '#c9a6d9',
            accent: '#ff7518',
        },
        dashboard: {
            bgApp: '#140b1e',
            surface: '#1e1030',
            border: '#ff7518',
            text: '#ffdca8',
            textMuted: '#c9a6d9',
            primary: '#ff7518',
            accent: '#7c3aed',
        },
    },
    navidad: {
        label: 'Navidad',
        emoji: '🎄',
        appName: 'Navidadómetro',
        headerEmoji: '🎄',
        shareHeading: 'MI NAVIDAD EN NÚMEROS',
        auth: {
            pageBg: '#0b2e18',
            cardBg: '#ffffff',
            border: '#111111',
            text: '#111111',
            textMuted: '#6b7280',
            accent: '#b91c1c',
        },
        dashboard: {
            bgApp: '#0b2e18',
            surface: '#ffffff',
            border: '#111111',
            text: '#111111',
            textMuted: '#57534e',
            primary: '#166534',
            accent: '#b91c1c',
        },
    },
};

// Month is 0-indexed (Date#getMonth()). Add more seasonal events here as needed;
// they'll only take over automatically during their assigned month.
const SEASONAL_MONTHS = {
    9: 'halloween', // October
    11: 'navidad', // December
};

export function getSeasonalEventId(date = new Date()) {
    return SEASONAL_MONTHS[date.getMonth()] || null;
}
