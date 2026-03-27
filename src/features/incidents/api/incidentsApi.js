const DEFAULT_API_URL = 'http://localhost:5001';

const getApiBaseUrl = () => {
    if (import.meta.env.DEV) {
        // In dev, route through Vite proxy to avoid CORS issues.
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

const safeArray = (payload, keys) => {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== 'object') return [];

    for (const key of keys) {
        if (Array.isArray(payload[key])) return payload[key];
    }

    if (payload.data && Array.isArray(payload.data)) return payload.data;
    if (payload.data && typeof payload.data === 'object') {
        for (const key of keys) {
            if (Array.isArray(payload.data[key])) return payload.data[key];
        }
    }

    return [];
};

const normalizeEntity = (item) => ({
    id: item?._id || item?.id || '',
    name: item?.name || item?.title || 'Unnamed',
});

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

    // If a stale token was sent, retry once without Authorization and rely on cookie auth.
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
        const backendMessage =
            payload?.message || payload?.error || payload?.details || `Request failed (${response.status})`;

        if (response.status === 401) {
            throw new Error('Unauthorized. Please login again to continue.');
        }

        throw new Error(backendMessage);
    }

    return payload;
};

const pickIncidentArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== 'object') return [];

    if (Array.isArray(payload.docs)) return payload.docs;
    if (Array.isArray(payload.incidents)) return payload.incidents;
    if (Array.isArray(payload.data)) return payload.data;
    if (payload.data && Array.isArray(payload.data.docs)) return payload.data.docs;
    if (payload.data && Array.isArray(payload.data.incidents)) return payload.data.incidents;
    if (payload.result && Array.isArray(payload.result.docs)) return payload.result.docs;

    return [];
};

const normalizeIncidentReference = (value, fallbackLabel) => {
    if (value && typeof value === 'object') {
        return {
            id: value._id || value.id || '',
            name: value.name || value.fullName || value.username || fallbackLabel,
        };
    }

    return {
        id: value || '',
        name: fallbackLabel,
    };
};

const normalizeIncident = (item) => {
    const zone = normalizeIncidentReference(item.zoneId || item.zone, 'Unknown Zone');
    const protectedArea = normalizeIncidentReference(
        item.protectedAreaId || item.protectedArea,
        'Unknown Protected Area'
    );
    const reportedBy = normalizeIncidentReference(item.reportedBy, 'Anonymous Reporter');

    return {
        _id: item?._id || item?.id || '',
        type: item?.type || 'OTHER',
        description: item?.description || '',
        zone,
        protectedArea,
        severity: item?.severity || 'LOW',
        status: item?.status || 'UNVERIFIED',
        reportedBy: {
            _id: reportedBy.id,
            fullName: reportedBy.name,
            username: item?.reportedBy?.username || reportedBy.name,
        },
        incidentDate: item?.incidentDate || item?.createdAt || new Date().toISOString(),
        evidence: Array.isArray(item?.evidence) ? item.evidence : [],
        notes: item?.notes || '',
        createdAt: item?.createdAt || new Date().toISOString(),
    };
};

const getPaginationMeta = (payload) => {
    if (!payload || typeof payload !== 'object') return { totalPages: 1, page: 1 };

    const pagination = payload.pagination || payload.data?.pagination || {};
    return {
        totalPages: Number(pagination.totalPages || payload.totalPages || 1),
        page: Number(pagination.page || payload.page || 1),
    };
};

export const fetchProtectedAreas = async () => {
    const limitPerPage = 100;
    const firstPayload = await requestJson(`/api/protected-areas?page=1&limit=${limitPerPage}`);
    const firstPageItems = safeArray(firstPayload, ['protectedAreas', 'areas', 'results', 'items', 'data']);
    const { totalPages } = getPaginationMeta(firstPayload);

    const allItems = [...firstPageItems];

    if (totalPages > 1) {
        for (let page = 2; page <= totalPages; page += 1) {
            const payload = await requestJson(`/api/protected-areas?page=${page}&limit=${limitPerPage}`);
            allItems.push(...safeArray(payload, ['protectedAreas', 'areas', 'results', 'items', 'data']));
        }
    }

    const deduped = new Map();
    allItems.forEach((item) => {
        const normalized = normalizeEntity(item);
        if (normalized.id) {
            deduped.set(normalized.id, normalized);
        }
    });

    return Array.from(deduped.values());
};

export const fetchZonesByProtectedArea = async (protectedAreaId) => {
    if (!protectedAreaId) return [];

    const payload = await requestJson(`/api/protected-areas/${protectedAreaId}/zones`);
    const items = safeArray(payload, ['zones', 'results', 'items']);
    return items.map(normalizeEntity).filter((item) => item.id);
};

export const fetchIncidents = async () => {
    const limitPerPage = 100;
    const firstPayload = await requestJson(`/api/incidents?page=1&limit=${limitPerPage}`);
    const firstPageItems = pickIncidentArray(firstPayload);
    const { totalPages } = getPaginationMeta(firstPayload);

    const allItems = [...firstPageItems];

    if (totalPages > 1) {
        for (let page = 2; page <= totalPages; page += 1) {
            const payload = await requestJson(`/api/incidents?page=${page}&limit=${limitPerPage}`);
            allItems.push(...pickIncidentArray(payload));
        }
    }

    return allItems.map(normalizeIncident).filter((item) => item._id);
};

export const createIncident = async (input) => {
    const payload = await requestJson('/api/incidents', {
        method: 'POST',
        body: JSON.stringify(input),
    });
    return payload;
};
