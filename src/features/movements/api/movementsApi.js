import api from '../../../utils/api';

export const getMovements = async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api(`/movements?${query}`);
};

export const getMovementSummary = async () => {
    return api('/movements/summary');
};

export const getLiveMovements = async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api(`/movements/live?${query}`);
};
