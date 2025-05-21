import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173, // Standard-Port von Vite
    proxy: {
      '/api': 'http://localhost:5001', // alle /api-Requests zum Flask-Backend
    },
  },
})
