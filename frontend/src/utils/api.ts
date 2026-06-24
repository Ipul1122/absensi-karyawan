import axios from 'axios';

export const getApiBaseUrl = (): string => {
  const isLocal = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' || 
                  window.location.hostname === '::1';
                  
  if (isLocal) {
    return 'http://localhost:8000';
  }

  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.endsWith('/api') ? envUrl.substring(0, envUrl.length - 4) : envUrl;
  }
  return 'https://api.goodpeople-hcms.com';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Returns a fully-qualified URL for static/storage assets.
 * Handles prepended slashes and schemas dynamically.
 */
export const getAssetUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  if (path.startsWith('http')) {
    if (path.includes('://localhost/') && !path.includes(':8000/')) {
      return path.replace('://localhost/', '://localhost:8000/');
    }
    if (path.includes('://127.0.0.1/') && !path.includes(':8000/')) {
      return path.replace('://127.0.0.1/', '://127.0.0.1:8000/');
    }
    return path;
  }
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};

// Create a centralized Axios client
export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

// Automatically inject Authorization header if token is present
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
