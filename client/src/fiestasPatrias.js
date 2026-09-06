import { daysBetween } from './dateUtils.js';

// Fechas fijas por año: el "finde largo" real depende de en qué día cae el 18,
// así que se actualiza a mano cada año en vez de calcularse.
const CONFIG_BY_YEAR = {
    2026: {
        mainDate: '2026-09-18',
        messages: {
            '2026-09-17': '¡Mañana es 18! No dejes para mañana lo que puedes hacer hoy 🇨🇱',
            '2026-09-18': '¡Hoy es 18 de septiembre! 🎉🇨🇱',
            '2026-09-19': 'El fin de semana largo sigue, ¡dale con todo! 🥃',
            '2026-09-20': 'Último día de Fiestas Patrias, ¡cierra con broche de oro! 🎊',
        },
    },
};

export function getFiestasMessage(todayStr) {
    const year = Number(todayStr.slice(0, 4));
    const config = CONFIG_BY_YEAR[year];
    if (!config) return null;

    if (config.messages[todayStr]) return config.messages[todayStr];

    if (todayStr < config.mainDate) {
        const days = daysBetween(todayStr, config.mainDate);
        return `Faltan ${days} día${days === 1 ? '' : 's'} para el 18 🇨🇱`;
    }

    return null;
}
