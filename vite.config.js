// vite.config.js
// Use environment variable for API base url so development proxy
// matches the same backend address configured in .env.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite does not automatically expose `import.meta.env` to this file,
// so we read from process.env which is populated by Vite when it runs.
const apiBase = process.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
let proxyTarget = apiBase;
// strip ending `/api` because proxy already mounts on `/api`
if (proxyTarget.endsWith('/api')) {
  proxyTarget = proxyTarget.replace(/\/api$/, '');
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  }
})
