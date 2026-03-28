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
        if (response.status === 401) {
            throw new Error('Unauthorized. Please login again to continue.');
        }

        throw new Error(
            payload?.message || payload?.error || payload?.details || `Request failed (${response.status})`
        );
    }

    return payload;
};

const pickArray = (payload, keys) => {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== 'object') return [];

    for (const key of keys) {
        if (Array.isArray(payload[key])) return payload[key];
    }

    if (payload.data && typeof payload.data === 'object') {
        for (const key of keys) {
            if (Array.isArray(payload.data[key])) return payload.data[key];
        }
    }

    return [];
};

export const fetchProtectedAreas = async () => {
    const payload = await requestJson('/api/protected-areas');
    const items = pickArray(payload, ['protectedAreas', 'areas', 'results', 'items', 'data']);
    return items
        .map((item) => ({
            id: item?._id || item?.id || '',
            name: item?.name || item?.title || 'Unnamed Area',
        }))
        .filter((item) => item.id);
};

export const fetchZonesByProtectedArea = async (protectedAreaId) => {
    if (!protectedAreaId) return [];

    const payload = await requestJson(`/api/protected-areas/${protectedAreaId}/zones`);
    const items = pickArray(payload, ['zones', 'results', 'items', 'data']);
    return items.filter((item) => item?._id || item?.id);
};

export const fetchRiskMapByProtectedArea = async (protectedAreaId) => {
    if (!protectedAreaId) {
        return {
            zones: [],
            summary: null,
            zonesByRiskLevel: null,
        };
    }

    const payload = await requestJson(`/api/risk-map?protectedAreaId=${encodeURIComponent(protectedAreaId)}`);
    const data = payload?.data || {};

    return {
        zones: Array.isArray(data.zones) ? data.zones : [],
        summary: data.summary || null,
        zonesByRiskLevel: data.zonesByRiskLevel || null,
    };
};
