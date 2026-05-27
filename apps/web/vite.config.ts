import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const apiPort = process.env.CSM_API_PORT ?? '3847';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
});
