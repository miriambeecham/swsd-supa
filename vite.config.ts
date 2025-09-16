import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Replit-friendly HMR + API proxy
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,          // allow Replit's preview host
    hmr: {
      // Replit previews are HTTPS; telling the client to connect back via 443 avoids mixed-content / blocked WS
      clientPort: 443
      // (No need to force protocol/path; Vite will infer wss over https)
    },
    proxy: {
      '/api': {
        target: 'http://0.0.0.0:3001',
        changeOrigin: true
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 5173
  }
});
