import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './App.tsx'

import { API_BASE_URL, setupResponseInterceptor } from './utils/api.ts'

const apiBaseUrl = API_BASE_URL;

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

// Set up global response interceptors for all Axios requests
setupResponseInterceptor(axios);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
