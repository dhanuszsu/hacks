import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/intake': 'http://localhost:5000',
      '/queue': 'http://localhost:5000',
      '/patients': 'http://localhost:5000',
      '/demo': 'http://localhost:5000',
      '/audit-logs': 'http://localhost:5000',
      '/health': 'http://localhost:5000'
    }
  }
});
