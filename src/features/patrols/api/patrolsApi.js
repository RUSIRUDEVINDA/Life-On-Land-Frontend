const DEFAULT_API_URL = 'http://localhost:5001';

const getApiBaseUrl = () => {
    if (import.meta.env.DEV) {
        return '';
    }
    return (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '');
};

const getAuthHeaders = () => {
    const rawToken = localStorage.getItem('token');
    if (!rawToken) return {};
    const token = String(rawToken).trim().replace(/^"|"$/g, '');
    if (!token || token === 'null' || token === 'undefined') {
        localStorage.removeItem('token');
        return {};
    }
    return { Authorization: `Bearer ${token}` };
};

const createFetchOptions = (extra = {}) => ({
    credentials: 'include',
    ...extra,
});

const withDefaultHeaders = (headers = {}) => ({
    'Content-Type': 'application/json',
    ...headers,
});

const requestJson = async (path, options = {}) => {
    const url = `${getApiBaseUrl()}${path}`;
    const token = localStorage.getItem('token');

    let response = await fetch(
        url,
        createFetchOptions({
            ...options,
            headers: withDefaultHeaders({
                ...getAuthHeaders(),
                ...(options.headers || {}),
            }),
        })
    );

    let payload = await response.json().catch(() => ({}));

    if (response.status === 401 && token) {
        localStorage.removeItem('token');
        response = await fetch(
            url,
            createFetchOptions({
                ...options,
                headers: withDefaultHeaders(options.headers || {}),
            })
        );
        payload = await response.json().catch(() => ({}));
    }

    if (!response.ok) {
        const backendMessage = payload?.message || payload?.error || payload?.details || `Request failed (${response.status})`;
        if (response.status === 401) {
            throw new Error('Unauthorized. Please login again to continue.');
        }
        throw new Error(backendMessage);
    }
    return payload;
};

export const fetchPatrols = async () => {
    try {
        const payload = await requestJson('/api/patrols?page=1&limit=50');
        if (Array.isArray(payload)) return payload;
        if (payload?.docs) return payload.docs;
        if (payload?.data) return payload.data;
        if (payload?.patrols) return payload.patrols;
        return [];
    } catch (err) {
        if (err.message.includes('(403)')) {
            throw new Error('You do not have permission to view patrols.');
        }
        throw err;
    }
};

export const createPatrol = async (input) => {
    const payload = await requestJson('/api/patrols', {
        method: 'POST',
        body: JSON.stringify(input),
    });
    return payload;
};
