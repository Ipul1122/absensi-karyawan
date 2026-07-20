import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const rawApiUrl = env.VITE_API_BASE_URL || env.VITE_API_URL || 'http://localhost:8000'
  let apiUrl = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl
  if (apiUrl.endsWith('/api')) {
    apiUrl = apiUrl.substring(0, apiUrl.length - 4)
  }

  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'replace-api-url',
        transform(code, id) {
          // Replace in all source files under src
          if (id.includes('/src/') && (id.endsWith('.ts') || id.endsWith('.tsx') || id.endsWith('.js') || id.endsWith('.jsx'))) {
            return {
              code: code.replace(/http:\/\/localhost:8000/g, apiUrl),
              map: null
            }
          }
          return null
        }
      }
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router') || id.includes('scheduler')) {
                return 'vendor-react-core'
              }
              if (id.includes('leaflet')) {
                return 'vendor-leaflet'
              }
              if (id.includes('sweetalert2')) {
                return 'vendor-sweetalert'
              }
              if (id.includes('lucide-react')) {
                return 'vendor-lucide'
              }
              if (id.includes('axios')) {
                return 'vendor-axios'
              }
              if (id.includes('qrcode')) {
                return 'vendor-qrcode'
              }
              return 'vendor'
            }
          }
        }
      }
    }
  }
})
