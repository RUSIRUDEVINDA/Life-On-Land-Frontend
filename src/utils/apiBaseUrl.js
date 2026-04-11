export const LOCAL_DEV_API_ORIGIN = 'http://localhost:5001';
export const DEFAULT_PRODUCTION_API_ORIGIN = 'https://life-on-land-aqau.onrender.com';

const stripTrailingSlashes = (value) => String(value || '').trim().replace(/\/+$/, '');

const stripApiSuffix = (value) => stripTrailingSlashes(value).replace(/\/api$/i, '');

export const getApiOrigin = () => {
    if (import.meta.env.DEV) {
        return '';
    }

    const configuredOrigin = stripApiSuffix(import.meta.env.VITE_API_URL);
    if (configuredOrigin) {
        return configuredOrigin;
    }

    return DEFAULT_PRODUCTION_API_ORIGIN;
};

export const getApiBaseUrl = () => {
    if (import.meta.env.DEV) {
        return '/api';
    }

    return `${getApiOrigin()}/api`;
};
