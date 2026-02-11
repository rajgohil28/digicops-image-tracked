import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    basicSsl()
  ],
  server: {
    host: true, // Exposes the server to the network (0.0.0.0)
    https: true // Enables HTTPS
  },
  build: {
    outDir: 'docs',
    emptyOutDir: true
  }
})
