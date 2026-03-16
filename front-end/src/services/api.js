const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getToken = () => localStorage.getItem('token');

const headers = () => ({
    'Content-Type': 'application/json',
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

async function request(url, options = {}) {
    const mergedHeaders = { ...headers(), ...options.headers };

    // Nếu Content-Type là null (dành cho FormData), xóa nó khỏi headers 
    // để fetch tự sinh boundary cho form
    if (mergedHeaders['Content-Type'] === null) {
        delete mergedHeaders['Content-Type'];
    }

    const res = await fetch(`${BASE_URL}${url}`, {
        ...options,
        headers: mergedHeaders,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi không xác định');
    return data;
}

// Auth
export const authApi = {
    register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    getMe: () => request('/auth/me'),
};

// Users
export const userApi = {
    getAll: () => request('/users'),
    delete: (id) => request(`/users/${id}`, { method: 'DELETE' }),
};

// Products
// Note: For product upload involving image, use FormData and avoid JSON.stringify
export const productApi = {
    getAll: (params = '') => request(`/products${params}`),
    getById: (id) => request(`/products/${id}`),
    create: (formData) => request('/products', {
        method: 'POST',
        body: formData,
        headers: {
            'Content-Type': null // Let browser set multipart/form-data boundary
        }
    }),
    update: (id, formData) => request(`/products/${id}`, {
        method: 'PUT',
        body: formData,
        headers: {
            'Content-Type': null
        }
    }),
    delete: (id) => request(`/products/${id}`, { method: 'DELETE' }),
};

// Categories
export const categoryApi = {
    getAll: () => request('/categories'),
    create: (body) => request('/categories', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
};

// Orders
export const orderApi = {
    create: (body) => request('/orders', { method: 'POST', body: JSON.stringify(body) }),
    getById: (id) => request(`/orders/${id}`),
    getAll: () => request('/orders'),
    getActiveByTable: (tableId) => request(`/orders/table/${tableId}/active`),
};

// Payments
export const paymentApi = {
    create: (body) => request('/payments', { method: 'POST', body: JSON.stringify(body) }),
    createByTable: (body) => request('/payments/by-table', { method: 'POST', body: JSON.stringify(body) }),
    getAll: () => request('/payments'),
};

// Tables
export const tableApi = {
    getAll: () => request('/tables'),
    getZones: () => request('/tables/zones'),
    getByQrToken: (token) => request(`/tables/qr/${token}`),
    create: (body) => request('/tables', { method: 'POST', body: JSON.stringify(body) }),
    updateStatus: (id, status) => request(`/tables/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

