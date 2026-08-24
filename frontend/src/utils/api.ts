import axios from 'axios';
import Swal from 'sweetalert2';

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

// Configure a global request interceptor on the default axios instance to rewrite local backend URLs
axios.interceptors.request.use(
  (config) => {
    if (config.url && config.url.includes('localhost:8000')) {
      config.url = config.url.replace('http://localhost:8000', API_BASE_URL);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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
    // Rewrite any localhost:8000 or 127.0.0.1:8000 asset URLs to actual API_BASE_URL
    const normalizedBase = API_BASE_URL.replace('http://', '://').replace('https://', '://');
    processedPath = processedPath
      .replace('://localhost:8000', normalizedBase)
      .replace('://127.0.0.1:8000', normalizedBase);

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

// Shareable active toast reference to prevent spamming multiple toasts
let activeTimeoutToast: any = null;

// Helper to register response interceptors (handles 401, 500, 408/timeouts)
export const setupResponseInterceptor = (instance: any) => {
  instance.interceptors.response.use(
    (response: any) => response,
    (error: any) => {
      const status = error.response?.status;
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout') || status === 408;

      if (status === 401) {
        // Clear authorization data
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        
        // Redirect to /401 only if not already on the page
        if (window.location.pathname !== '/401') {
          window.location.href = '/401';
        }
      } else if (status === 500) {
        // Redirect to /500 only if not already on the page
        if (window.location.pathname !== '/500') {
          window.location.href = '/500';
        }
      } else if (isTimeout) {
        // Display Interactive Toast for 408 Timeout
        if (!activeTimeoutToast) {
          let timeLeft = 15;
          activeTimeoutToast = Swal.fire({
            title: 'Koneksi Habis Waktu (408)',
            html: 'Permintaan terlalu lambat. Memuat ulang halaman dalam <b>15</b> detik...',
            icon: 'warning',
            toast: true,
            position: 'top-end',
            showConfirmButton: true,
            confirmButtonText: 'Muat Ulang',
            confirmButtonColor: '#dc2626',
            showCancelButton: true,
            cancelButtonText: 'Batal',
            timer: 15000,
            timerProgressBar: true,
            background: '#fffdfb',
            color: '#3c1105',
            didOpen: () => {
              const content = Swal.getHtmlContainer();
              const b = content?.querySelector('b');
              const timerInterval = setInterval(() => {
                if (b) {
                  const timerLeft = Swal.getTimerLeft();
                  timeLeft = Math.max(0, Math.ceil((timerLeft || 0) / 1000));
                  b.textContent = timeLeft.toString();
                }
              }, 100);
              (activeTimeoutToast as any)._intervalId = timerInterval;
            },
            willClose: () => {
              if (activeTimeoutToast && activeTimeoutToast._intervalId) {
                clearInterval(activeTimeoutToast._intervalId);
              }
            }
          }).then((result) => {
            activeTimeoutToast = null;
            if (result.isConfirmed) {
              window.location.reload();
            } else if (result.dismiss === Swal.DismissReason.timer) {
              window.location.reload();
            }
          });
        }
      }
      return Promise.reject(error);
    }
  );
};

// Set up interceptor for apiClient
setupResponseInterceptor(apiClient);
