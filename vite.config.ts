import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3003,
    strictPort: true,
    open: true,
    host: '127.0.0.1',
  },
  preview: {
    port: 3003,
    strictPort: true,
    open: true,
    host: '127.0.0.1',
  },
});
