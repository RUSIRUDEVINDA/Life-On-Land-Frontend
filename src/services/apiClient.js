import axios from 'axios';

const DEFAULT_API_URL = 'http://localhost:5001';

const getApiBaseUrl = () => {
  if (import.meta.env.DEV) {
    return '';
  }

  return (import.meta.env.VITE_API_URL || DEFAULT_API_URL).trim().replace(/\/$/, '');
};

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const rawToken = localStorage.getItem('token');
  const token = String(rawToken || '').trim().replace(/^"|"$/g, '');

  if (token && token !== 'null' && token !== 'undefined') {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('token');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
