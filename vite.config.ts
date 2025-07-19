import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/volcengine': {
        target: 'https://visual.volcengineapi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/volcengine/, ''),
        secure: true
      }
    }
  }
})
