export function toLocalDateString(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function addDays(dateStr, delta) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + delta);
    return toLocalDateString(dt);
}

export function daysBetween(fromDateStr, toDateStr) {
    const [fy, fm, fd] = fromDateStr.split('-').map(Number);
    const [ty, tm, td] = toDateStr.split('-').map(Number);
    const from = new Date(fy, fm - 1, fd);
    const to = new Date(ty, tm - 1, td);
    return Math.round((to - from) / 86400000);
}
