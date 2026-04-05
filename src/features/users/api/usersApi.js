import { throwIfUpstreamError } from '../../../utils/upstreamUnavailableMessage';

const DEFAULT_API_URL = 'http://localhost:5001';

const getApiBaseUrl = () => {
    if (import.meta.env.DEV) return '';
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

const requestJson = async (path, options = {}) => {
    const url = `${getApiBaseUrl()}${path}`;
    const token = localStorage.getItem('token');

    const buildOptions = (withAuth) => ({
        credentials: 'include',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(withAuth ? getAuthHeaders() : {}),
            ...(options.headers || {}),
        },
    });

    let response = await fetch(url, buildOptions(true));
    let payload = await response.json().catch(() => ({}));

    if (response.status === 401 && token) {
        localStorage.removeItem('token');
        response = await fetch(url, buildOptions(false));
        payload = await response.json().catch(() => ({}));
    }

    if (!response.ok) {
        throwIfUpstreamError(response);
        if (response.status === 401) {
            throw new Error('Unauthorized. Please login again to continue.');
        }
        throw new Error(
            payload?.message || payload?.error || payload?.details || `Request failed (${response.status})`
        );
    }

    return payload;
};

const normalizeUser = (raw) => ({
    id: String(raw?._id ?? raw?.id ?? ''),
    name: raw?.name || 'Unknown',
    email: raw?.email || '',
    phone: raw?.phone || '',
    role: raw?.role || 'RANGER',
    createdAt: raw?.createdAt || null,
    updatedAt: raw?.updatedAt || null,
});

const syncStoredUser = (user) => {
    let current = null;
    try {
        const rawUser = localStorage.getItem('user');
        current = rawUser ? JSON.parse(rawUser) : null;
    } catch {
        current = null;
    }

    const merged = {
        ...(current || {}),
        ...user,
        id: user.id || current?.id || '',
        _id: current?._id || user.id || '',
        name: user.name || current?.name || 'Unknown',
        fullName: user.name || current?.fullName || current?.name || 'Unknown',
        email: user.email || current?.email || '',
        phone: user.phone || current?.phone || '',
        role: user.role || current?.role || 'RANGER',
    };

    localStorage.setItem('user', JSON.stringify(merged));

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('user-updated', { detail: merged }));
    }
};

export const fetchMyProfile = async () => {
    let parsedUser = null;
    try {
        const rawUser = localStorage.getItem('user');
        parsedUser = rawUser ? JSON.parse(rawUser) : null;
    } catch {
        parsedUser = null;
    }

    const userId = parsedUser?._id || parsedUser?.id;

    if (!userId) {
        throw new Error('User session is missing. Please login again.');
    }

    const payload = await requestJson(`/api/users/${userId}`);
    return normalizeUser(payload?.user || payload?.data || payload);
};

export const updateMyProfile = async (updates) => {
    let parsedUser = null;
    try {
        const rawUser = localStorage.getItem('user');
        parsedUser = rawUser ? JSON.parse(rawUser) : null;
    } catch {
        parsedUser = null;
    }

    const userId = parsedUser?._id || parsedUser?.id;

    if (!userId) {
        throw new Error('User session is missing. Please login again.');
    }

    const payload = await requestJson(`/api/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
    });

    const user = normalizeUser(payload?.user || payload?.data || payload);
    syncStoredUser(user);
    return user;
};

export const fetchAllUsers = async () => {
    const PAGE_SIZE = 100;
    const firstPayload = await requestJson(`/api/users?page=1&limit=${PAGE_SIZE}`);

    const firstBatch = Array.isArray(firstPayload?.data) ? firstPayload.data : [];
    const totalPages = firstPayload?.pagination?.pages ?? 1;

    if (totalPages <= 1) {
        return firstBatch.map(normalizeUser);
    }

    const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
    const rest = await Promise.all(
        remainingPages.map((page) =>
            requestJson(`/api/users?page=${page}&limit=${PAGE_SIZE}`)
                .then((p) => (Array.isArray(p?.data) ? p.data : []))
                .catch(() => [])
        )
    );

    return [...firstBatch, ...rest.flat()].map(normalizeUser);
};

export const fetchRangers = async () => {
    const payload = await requestJson('/api/users?page=1&limit=100&role=RANGER');
    const users = Array.isArray(payload?.data) ? payload.data : [];
    return users.map(normalizeUser);
};

export const updateUser = async (userId, data) => {
    const payload = await requestJson(`/api/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    return normalizeUser(payload?.user || payload?.data || payload);
};

export const deleteUser = async (userId) => {
    return await requestJson(`/api/users/${userId}`, {
        method: 'DELETE',
    });
};
