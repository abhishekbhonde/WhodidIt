import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'https://whodidit-a9sl.onrender.com',
      '/auth': 'https://whodidit-a9sl.onrender.com',
    },
  },
})
