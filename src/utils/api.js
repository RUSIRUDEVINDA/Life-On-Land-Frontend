import { getApiBaseUrl } from './apiBaseUrl';
import { throwIfUpstreamError } from './upstreamUnavailableMessage';

const api = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const isFormData = options.body instanceof FormData;
    const headers = {
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        ...options.headers,
    };

    try {
        const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
            ...options,
            headers,
            credentials: 'include', // Ensure cookies are sent if needed
        });

        // Handle 401 Unauthorized
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Force redirect to login if we're not already on a public page
            if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
                window.location.href = '/login?expired=true';
            }
            throw new Error('Session expired. Please login again.');
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throwIfUpstreamError(response);
            throw new Error(data.message || data.error || `Error: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

export default api;  
