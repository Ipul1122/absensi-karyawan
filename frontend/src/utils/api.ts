import axios from 'axios';

export const getApiBaseUrl = (): string => {
  const hostname = window.location.hostname;

  // 1. If we are running on localhost, use local backend
  const isLocalhost = hostname === 'localhost' || 
                      hostname === '127.0.0.1' || 
                      hostname === '::1';
  if (isLocalhost) {
    return 'http://localhost:8000';
  }

  // 2. If we are accessing via local network IP (e.g. 192.168.x.x, 10.x.x.x, etc.)
  // we want the API to go to the same IP but on port 8000 (backend port)
  const isIpAddress = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
  if (isIpAddress) {
    return `http://${hostname}:8000`;
  }

  // 3. Otherwise use the environment variable (for production/staging builds)
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (envUrl) {
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
  let processedPath = path;

  if (processedPath.startsWith('http')) {
    // If we are accessing via local IP (e.g. from phone), rewrite any localhost:8000 or 127.0.0.1:8000 assets to the actual API_BASE_URL
    if (API_BASE_URL.includes('192.168.') || API_BASE_URL.includes('10.') || API_BASE_URL.includes('172.')) {
      const normalizedBase = API_BASE_URL.replace('http://', '://').replace('https://', '://');
      processedPath = processedPath
        .replace('://localhost:8000', normalizedBase)
        .replace('://127.0.0.1:8000', normalizedBase);
    }

    if (processedPath.includes('://localhost/') && !processedPath.includes(':8000/')) {
      return processedPath.replace('://localhost/', '://localhost:8000/');
    }
    if (processedPath.includes('://127.0.0.1/') && !processedPath.includes(':8000/')) {
      return processedPath.replace('://127.0.0.1/', '://127.0.0.1:8000/');
    }
    return processedPath;
  }
  const cleanPath = processedPath.startsWith('/') ? processedPath.substring(1) : processedPath;
  return `${API_BASE_URL}/${cleanPath}`;
};

// Create a centralized Axios client
export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

// Automatically inject Authorization header if token is present
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
