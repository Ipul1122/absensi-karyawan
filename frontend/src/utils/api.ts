const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }
  const isLocal = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' || 
                  window.location.hostname === '::1';
                  
  return isLocal ? 'http://localhost:8000' : 'https://goodpeople-hcms.com/api';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Returns a fully-qualified URL for static/storage assets.
 * Handles prepended slashes and schemas dynamically.
 */
export const getAssetUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};
