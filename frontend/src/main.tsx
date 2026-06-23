import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './App.tsx'

const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.endsWith('/api') ? envUrl.substring(0, envUrl.length - 4) : envUrl;
  }
  const isLocal = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' || 
                  window.location.hostname === '::1';
                  
  return isLocal ? 'http://localhost:8000' : 'https://api.goodpeople-hcms.com';
};

const apiBaseUrl = getApiBaseUrl();
axios.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith('http://localhost:8000')) {
    config.url = config.url.replace('http://localhost:8000', apiBaseUrl);
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
