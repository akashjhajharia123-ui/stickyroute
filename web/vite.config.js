import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Relative base so the same build works locally and at
// https://akashjhajharia123-ui.github.io/stickyroute/ (GitHub Pages serves it under /stickyroute/).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 900, // three.js for the hero is loaded lazily in its own chunk
  },
})
