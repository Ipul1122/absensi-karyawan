import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const rawApiUrl = env.VITE_API_URL || 'http://localhost:8000'
  const apiUrl = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl

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
  }
})
