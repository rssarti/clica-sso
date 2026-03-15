import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    define: {
      // Explicitly define environment variables for production build
      'import.meta.env.VITE_SOCKET_IO': JSON.stringify(env.VITE_SOCKET_IO || 'http://localhost:3000'),
      'import.meta.env.VITE_SOCKET_PATCH': JSON.stringify(env.VITE_SOCKET_PATCH || '/socket.io/'),
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:3000'),
      'import.meta.env.VITE_SSO_URL': JSON.stringify(env.VITE_SSO_URL || 'http://localhost:5173'),
    },
    envDir: '.',
    envPrefix: 'VITE_'
  }
})
