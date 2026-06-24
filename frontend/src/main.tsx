import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './App.tsx'

const getApiBaseUrl = (): string => {
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

const apiBaseUrl = getApiBaseUrl();

// Daftar semua URL base yang mungkin digunakan di seluruh komponen
const KNOWN_API_BASES = [
  'http://localhost:8000',
  'https://api.goodpeople-hcms.com',
  'https://goodpeople-hcms.com',
];

axios.interceptors.request.use((config) => {
  if (config.url) {
    for (const base of KNOWN_API_BASES) {
      if (config.url.startsWith(base)) {
        config.url = config.url.replace(base, apiBaseUrl);
        break;
      }
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
