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
      '074ddec3-d8d8-4c20-b884-9d4dcfc3ef09-00-3djfwnc7suxeg.riker.replit.dev'
    ],
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'all',
      'streetwise-website-1-miriambeecham.replit.app'
    ]
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});