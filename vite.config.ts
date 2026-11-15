import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: 'ui',
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './ui/src'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'bundle'),
    emptyOutDir: true,
    target: 'es2022',
    rollupOptions: {
      external: ['/static/anna-apps/_sdk/latest/index.js'],
      output: {
        entryFileNames: 'app.js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
})
