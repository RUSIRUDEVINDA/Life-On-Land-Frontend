import { throwIfUpstreamError } from '../../../utils/upstreamUnavailableMessage';

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
        throwIfUpstreamError(response);
        const backendMessage = payload?.message || payload?.error || payload?.details || `Request failed (${response.status})`;
        if (response.status === 401) {
            throw new Error('Unauthorized. Please login again to continue.');
        }
        throw new Error(backendMessage);
    }
    return payload;
};

/** Backend validators often cap page size (e.g. max 50); higher values return 400. */
const clampPatrolPageLimit = (value) => {
    const n = Number(value);
    const raw = Number.isFinite(n) && n > 0 ? Math.floor(n) : 50;
    return Math.min(50, Math.max(1, raw));
};

export const fetchPatrols = async (options = {}) => {
    const limit = clampPatrolPageLimit(options.limit);
    try {
        const payload = await requestJson(`/api/patrols?page=1&limit=${limit}`);
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

export const fetchAssignedPatrols = async () => {
    const rawUser = localStorage.getItem('user');
    const user = rawUser ? JSON.parse(rawUser) : null;
    const userId = user?._id || user?.id;

    if (!userId) {
        throw new Error('User session is missing. Please login again.');
    }

    try {
        const payload = await requestJson(`/api/patrols?page=1&limit=50&rangerId=${encodeURIComponent(userId)}&_t=${Date.now()}`);
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
export const fetchPatrolById = async (id) => {
    const payload = await requestJson(`/api/patrols/${id}`);
    return payload?.patrol || payload;
};

export const addCheckIn = async (patrolId, checkInData) => {
    const payload = await requestJson(`/api/patrols/${patrolId}/check-ins`, {
        method: 'POST',
        body: JSON.stringify(checkInData),
    });
    return payload;
};

export const updatePatrol = async (id, data) => {
    const payload = await requestJson(`/api/patrols/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return payload;
};

export const deleteCheckIn = async (patrolId, checkInId) => {
    const payload = await requestJson(`/api/patrols/${patrolId}/check-ins/${checkInId}`, {
        method: 'DELETE'
    });
    return payload;
};
