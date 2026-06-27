import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
    // Bloquer l'accès aux fichiers sensibles depuis le dev server
    fs: {
      strict: true,
      deny: [
        'package.json',
        'package-lock.json',
        '.env',
        '.env.*',
        '*.config.js',
        '*.config.ts',
        'node_modules/**',
      ],
    },
  },

  build: {
    // Désactiver les source maps en production (évite la fuite du code source)
    sourcemap: false,
    // Obfuscation minimale supplémentaire
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },

  resolve: {
    alias: { '@': '/src' },
  },
});
