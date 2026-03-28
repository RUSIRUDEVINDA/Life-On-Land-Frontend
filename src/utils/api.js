const getBaseUrl = () => {
    if (import.meta.env.DEV) {
        return '/api';
    }
    return (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').trim().replace(/\/$/, '');
};

const api = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
    };

    try {
        const response = await fetch(`${getBaseUrl()}${endpoint}`, {
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
            throw new Error(data.message || data.error || `Error: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

export default api;

