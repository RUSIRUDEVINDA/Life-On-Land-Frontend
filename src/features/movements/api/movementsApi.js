import api from '../../../utils/api';

const normalizeMovements = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== 'object') return [];

    if (Array.isArray(payload.movements)) return payload.movements;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.results)) return payload.results;
    if (Array.isArray(payload.items)) return payload.items;

    if (payload.data && typeof payload.data === 'object') {
        if (Array.isArray(payload.data.movements)) return payload.data.movements;
        if (Array.isArray(payload.data.results)) return payload.data.results;
    }

    return [];
};

const normalizePagination = (payload, items) => {
    if (!payload || typeof payload !== 'object') {
        return { page: 1, limit: items.length, total: items.length, pages: 1 };
    }

    const pagination = payload.pagination || payload.data?.pagination || {};
    const rawPage = payload.page ?? pagination.page ?? 1;
    const rawLimit = (payload.limit ?? pagination.limit ?? items.length) || 15;
    const rawTotal =
        payload.total ?? pagination.total ?? pagination.totalItems ?? payload.totalItems ?? items.length;
    const page = Math.max(1, Number(rawPage) || 1);
    const limit = Math.max(1, Number(rawLimit) || items.length || 15);
    const total = Math.max(0, Number(rawTotal) || 0);
    const rawPages =
        (payload.pages ?? pagination.pages ?? pagination.totalPages ?? payload.totalPages ?? Math.ceil(total / limit)) || 1;
    const pages = Math.max(1, Number(rawPages) || 1);

    return { page, limit, total, pages };
};

const normalizeMovementItem = (item) => {
    if (!item || typeof item !== 'object') return item;
    return {
        ...item,
        id: item.id || item._id || item.tagId,
    };
};

export const getMovements = async (params = {}) => {
    const { tagId, ...rest } = params || {};
    const cleanTagId = typeof tagId === 'string' ? tagId.trim() : '';
    const query = new URLSearchParams(rest).toString();
    const endpoint = cleanTagId
        ? `/movements/${encodeURIComponent(cleanTagId)}${query ? `?${query}` : ''}`
        : `/movements${query ? `?${query}` : ''}`;
    const payload = await api(endpoint);
    const items = normalizeMovements(payload).map(normalizeMovementItem);
    return { data: items, pagination: normalizePagination(payload, items) };
};

export const getMovementSummary = async () => {
    const payload = await api('/movements/summary');
    const data = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.summary)
            ? payload.summary
            : [];
    const total = data.reduce((acc, item) => acc + (Number(item?.count) || 0), 0);
    return { data, pagination: { total } };
};

export const getLiveMovements = async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const payload = await api(`/movements/live?${query}`);
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.movements)) return payload.movements;
    return [];
};
