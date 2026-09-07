const BASE = '/api';

async function request(path, options = {}) {
    const res = await fetch(BASE + path, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.error || 'Error de red');
    }
    return data;
}

export const api = {
    checkUsername: (username) => request('/auth/check', { method: 'POST', body: JSON.stringify({ username }) }),
    register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
    login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    me: () => request('/auth/me'),
    listItems: () => request('/items'),
    addItem: (payload) => request('/items', { method: 'POST', body: JSON.stringify(payload) }),
    updateItem: (id, delta, date) => request(`/items/${id}`, { method: 'PATCH', body: JSON.stringify({ delta, date }) }),
    setDayQuantity: (id, date, quantity) => request(`/items/${id}/day`, { method: 'PUT', body: JSON.stringify({ date, quantity }) }),
    deleteItem: (id) => request(`/items/${id}`, { method: 'DELETE' }),
    getHistory: () => request('/items/history'),
    getPace: (date) => request(`/items/pace?date=${date}`),
    moveHistory: (payload) => request('/items/history/move', { method: 'POST', body: JSON.stringify(payload) }),
};
