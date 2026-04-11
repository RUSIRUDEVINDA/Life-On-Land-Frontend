import axios from 'axios';
import { getApiOrigin } from '../utils/apiBaseUrl';

const apiClient = axios.create({
  baseURL: getApiOrigin(),
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