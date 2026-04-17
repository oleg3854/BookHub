import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const devApiTarget = process.env.VITE_DEV_API_TARGET || 'http://127.0.0.1:8000';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/static/' : '/',
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: devApiTarget,
        changeOrigin: true,
      },
      '/media': {
        target: devApiTarget,
        changeOrigin: true,
      },
    },
  },
}));
