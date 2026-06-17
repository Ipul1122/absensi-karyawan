import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './App.tsx'

// Global Axios Request Interceptor to dynamically redirect http://localhost:8000 requests
// to the hosted API server URL specified in VITE_API_URL
const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
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
