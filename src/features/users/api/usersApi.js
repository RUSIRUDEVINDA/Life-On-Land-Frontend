import { getApiOrigin } from '../../../utils/apiBaseUrl';
import { throwIfUpstreamError } from '../../../utils/upstreamUnavailableMessage';

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
    const url = `${getApiOrigin()}${path}`;
    const token = localStorage.getItem('token');

    const isFormData = options.body instanceof FormData;

    const buildOptions = (withAuth) => ({
        credentials: 'include',
        ...options,
        headers: {
            ...(!isFormData && { 'Content-Type': 'application/json' }),
            ...(withAuth ? getAuthHeaders() : {}),
            ...(options.headers || {}),
        },
    });


    let response = await fetch(url, buildOptions(true));
    const responseClone = response.clone();
    let payload = await responseClone.json().catch(() => ({}));
    let rawText = '';

    if (response.status === 401 && token) {
        localStorage.removeItem('token');
        response = await fetch(url, buildOptions(false));
        const retryClone = response.clone();
        payload = await retryClone.json().catch(() => ({}));
        rawText = '';
    }


    if (!response.ok) {
        throwIfUpstreamError(response);
        if (response.status === 401) {
            throw new Error('Unauthorized. Please login again to continue.');
        }
        if (!rawText && Object.keys(payload || {}).length === 0) {
            rawText = await response.text().catch(() => '');
        }
        throw new Error(
            payload?.message ||
            payload?.error ||
            payload?.details ||
            (rawText ? rawText.trim() : '') ||
            `Request failed (${response.status})`
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
    profilePhoto: raw?.profilePhoto || null,
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
        profilePhoto: user.profilePhoto || current?.profilePhoto || null,
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
        body: updates instanceof FormData ? updates : JSON.stringify(updates),
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
        body: data instanceof FormData ? data : JSON.stringify(data),
    });

    return normalizeUser(payload?.user || payload?.data || payload);
};

export const deleteUser = async (userId) => {
    return await requestJson(`/api/users/${userId}`, {
        method: 'DELETE',
    });
};