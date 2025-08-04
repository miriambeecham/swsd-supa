import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: [
      'all',
      '074ddec3-d8d8-4c20-b884-9d4dcfc3ef09-00-3djfwnc7suxeg.riker.replit.dev',
      '5b6b7d4d-e956-4993-b681-6b8f28cd8cea-00-mh4x8odh1968.picard.replit.dev'
    ],
    proxy: {
      '/api': {
        target: 'http://0.0.0.0:3001',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'all',
      'streetwise-website-1-miriambeecham.replit.app',
      'streetwise-website-server-side-version-miriambeecham.replit.app'
    ]
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});