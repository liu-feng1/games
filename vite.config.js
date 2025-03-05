import { defineConfig } from 'vite'

export default defineConfig({
  base: '/games/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  }
})