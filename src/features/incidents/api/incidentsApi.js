import { throwIfUpstreamError } from '../../../utils/upstreamUnavailableMessage';
import { fetchAllUsers } from '../../users/api/usersApi';

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

const toIdString = (value) => {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value.$oid) return String(value.$oid);
    return String(value);
};

const normalizeEntity = (item) => ({
    id: toIdString(item?._id ?? item?.id),
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
        throwIfUpstreamError(response);
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

const ANONYMOUS_REPORTER_LABEL = 'Anonymous Reporter';

/** Resolves Mongo-style ids, including nested `{ $oid }` on `_id`. */
const extractReferenceId = (value) => {
    if (value == null) return '';
    if (typeof value === 'string' || typeof value === 'number') return toIdString(value);
    if (typeof value !== 'object') return '';
    if (value.$oid) return String(value.$oid);
    const nested = value._id ?? value.id;
    if (nested != null) return toIdString(nested);
    return '';
};

const derivePersonDisplayName = (value) => {
    if (!value || typeof value !== 'object') return '';
    const first = typeof value.firstName === 'string' ? value.firstName.trim() : '';
    const last = typeof value.lastName === 'string' ? value.lastName.trim() : '';
    const fromParts = [first, last].filter(Boolean).join(' ').trim();
    return (
        (typeof value.name === 'string' && value.name.trim()) ||
        (typeof value.fullName === 'string' && value.fullName.trim()) ||
        (typeof value.displayName === 'string' && value.displayName.trim()) ||
        fromParts ||
        (typeof value.username === 'string' && value.username.trim()) ||
        ''
    );
};

const readStoredSessionUser = () => {
    try {
        const raw = localStorage.getItem('user');
        if (!raw) return null;
        const u = JSON.parse(raw);
        const id = u?._id ?? u?.id;
        if (id == null) return null;
        const name = typeof u?.name === 'string' ? u.name.trim() : '';
        return { id: toIdString(id), name };
    } catch {
        return null;
    }
};

const normalizeReportedBy = (rawReportedBy) => {
    const reporterId = extractReferenceId(rawReportedBy);
    let displayName =
        typeof rawReportedBy === 'object' && rawReportedBy ? derivePersonDisplayName(rawReportedBy) : '';

    if (!displayName && reporterId) {
        const session = readStoredSessionUser();
        if (session?.name && toIdString(session.id) === toIdString(reporterId)) {
            displayName = session.name;
        }
    }

    const usernameFromApi =
        typeof rawReportedBy === 'object' && rawReportedBy && typeof rawReportedBy.username === 'string'
            ? rawReportedBy.username.trim()
            : '';

    const fallback = displayName || ANONYMOUS_REPORTER_LABEL;

    return {
        _id: reporterId,
        fullName: displayName || ANONYMOUS_REPORTER_LABEL,
        username: usernameFromApi || fallback,
    };
};

const mergeReporterNamesFromUserDirectory = async (incidents) => {
    const idsToResolve = new Set();
    for (const inc of incidents) {
        const id = toIdString(inc?.reportedBy?._id);
        if (id && inc.reportedBy?.fullName === ANONYMOUS_REPORTER_LABEL) {
            idsToResolve.add(id);
        }
    }
    if (idsToResolve.size === 0) return incidents;

    try {
        const users = await fetchAllUsers();
        const idToName = new Map(users.map((u) => [u.id, u.name]).filter(([id]) => Boolean(id)));

        return incidents.map((inc) => {
            const id = toIdString(inc?.reportedBy?._id);
            if (!id || inc.reportedBy?.fullName !== ANONYMOUS_REPORTER_LABEL) return inc;
            const resolved = idToName.get(id);
            if (!resolved) return inc;
            return {
                ...inc,
                reportedBy: {
                    ...inc.reportedBy,
                    fullName: resolved,
                    username: inc.reportedBy?.username || resolved,
                },
            };
        });
    } catch {
        return incidents;
    }
};

/** Uppercase status for UI/filters; map common backend aliases to RESOLVED. */
const normalizeIncidentStatus = (raw) => {
    const u = String(raw ?? 'UNVERIFIED')
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '_');
    if (u === 'COMPLETED' || u === 'CLOSED') return 'RESOLVED';
    return u || 'UNVERIFIED';
};

const normalizeIncident = (item) => {
    const zone = normalizeIncidentReference(item.zoneId || item.zone, 'Unknown Zone');
    const protectedArea = normalizeIncidentReference(
        item.protectedAreaId || item.protectedArea,
        'Unknown Protected Area'
    );
    const reportedBy = normalizeReportedBy(item?.reportedBy);

    return {
        _id: item?._id || item?.id || '',
        type: item?.type || 'OTHER',
        description: item?.description || '',
        zone,
        protectedArea,
        severity: String(item?.severity || 'LOW').trim().toUpperCase() || 'LOW',
        status: normalizeIncidentStatus(item?.status),
        reportedBy,
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

/** Handles flat arrays, paginated { data: { docs } }, and other backend shapes. */
const pickProtectedAreasArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== 'object') return [];

    if (Array.isArray(payload.data)) return payload.data;

    if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
        const inner = payload.data;
        if (Array.isArray(inner.docs)) return inner.docs;
        if (Array.isArray(inner.protectedAreas)) return inner.protectedAreas;
        if (Array.isArray(inner.areas)) return inner.areas;
        if (Array.isArray(inner.items)) return inner.items;
        if (Array.isArray(inner.data)) return inner.data;
    }

    if (Array.isArray(payload.docs)) return payload.docs;

    return safeArray(payload, ['protectedAreas', 'areas', 'results', 'items', 'data', 'docs']);
};

const getProtectedAreasPaginationMeta = (payload) => {
    if (!payload || typeof payload !== 'object') return { totalPages: 1, page: 1 };

    const top = payload.pagination || {};
    const dataObj =
        payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data) ? payload.data : null;
    const innerPag = dataObj?.pagination && typeof dataObj.pagination === 'object' ? dataObj.pagination : {};

    const rawTotal =
        top.totalPages ?? innerPag.totalPages ?? dataObj?.totalPages ?? payload.totalPages ?? 1;
    const totalPages = Math.max(1, Number(rawTotal) || 1);

    return { totalPages, page: Number(top.page ?? innerPag.page ?? dataObj?.page ?? payload.page ?? 1) };
};

/** Zones list: { data: Zone[] } or paginated { data: { docs } }. */
const pickZonesArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== 'object') return [];

    if (Array.isArray(payload.data)) return payload.data;

    if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
        if (Array.isArray(payload.data.docs)) return payload.data.docs;
        if (Array.isArray(payload.data.zones)) return payload.data.zones;
    }

    if (Array.isArray(payload.docs)) return payload.docs;

    return safeArray(payload, ['zones', 'results', 'items', 'data', 'docs']);
};

export const fetchProtectedAreas = async () => {
    const limitPerPage = 100;
    const firstPayload = await requestJson(`/api/protected-areas?page=1&limit=${limitPerPage}`);
    const firstPageItems = pickProtectedAreasArray(firstPayload);
    const { totalPages } = getProtectedAreasPaginationMeta(firstPayload);

    const allItems = [...firstPageItems];

    if (totalPages > 1) {
        for (let page = 2; page <= totalPages; page += 1) {
            const payload = await requestJson(`/api/protected-areas?page=${page}&limit=${limitPerPage}`);
            allItems.push(...pickProtectedAreasArray(payload));
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
    const items = pickZonesArray(payload);
    return items.map(normalizeEntity).filter((item) => item.id);
};

/**
 * First page only, sorted newest-first (by createdAt). For dashboards and previews.
 * Caps limit to avoid backends that reject large page sizes.
 */
export const fetchRecentIncidents = async (limit = 15) => {
    const cap = Math.min(Math.max(1, Number(limit) || 15), 50);
    const payload = await requestJson(`/api/incidents?page=1&limit=${cap}`);
    const items = pickIncidentArray(payload);
    const normalized = items.map(normalizeIncident).filter((item) => item._id);
    const merged = await mergeReporterNamesFromUserDirectory(normalized);
    return merged.sort((a, b) => {
        const ta = new Date(b.createdAt).getTime();
        const tb = new Date(a.createdAt).getTime();
        return ta - tb;
    });
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

    const normalized = allItems.map(normalizeIncident).filter((item) => item._id);
    return mergeReporterNamesFromUserDirectory(normalized);
};


export const fetchIncidentsByReporter = async (reporterId) => {
    const normalizedReporterId = toIdString(reporterId);
    if (!normalizedReporterId) return [];

    const incidents = await fetchIncidents();
    return incidents.filter((incident) => toIdString(incident?.reportedBy?._id) === normalizedReporterId);
};

export const updateIncident = async (incidentId, input) => {
    if (!incidentId) {
        throw new Error('Incident id is required.');
    }

    const payload = await requestJson(`/api/incidents/${incidentId}`, {
        method: 'PUT',
        body: JSON.stringify(input),
    });
    return payload;
};

export const deleteIncident = async (incidentId) => {
    if (!incidentId) {
        throw new Error('Incident id is required.');
    }

    const payload = await requestJson(`/api/incidents/${incidentId}`, {
        method: 'DELETE',
    });
    return payload;
};

export const createIncident = async (input) => {
    const payload = await requestJson('/api/incidents', {
        method: 'POST',
        body: JSON.stringify(input),
    });
    return payload;
};

