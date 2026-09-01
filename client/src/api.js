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
    register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
    login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    me: () => request('/auth/me'),
    listItems: () => request('/items'),
    addItem: (payload) => request('/items', { method: 'POST', body: JSON.stringify(payload) }),
    updateItem: (id, delta) => request(`/items/${id}`, { method: 'PATCH', body: JSON.stringify({ delta }) }),
    deleteItem: (id) => request(`/items/${id}`, { method: 'DELETE' }),
};
