import { defineConfig } from 'vite'

export default defineConfig({
  base: '/shop-puzzle-simulation/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
  },
})
