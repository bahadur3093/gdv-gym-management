import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),

    // PWA plugin — makes the app installable on phones like a native app
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Society Gym',
        short_name: 'GymApp',
        description: 'Attendance, payments & maintenance for our society gym',
        theme_color: '#00E5A0',
        background_color: '#F2F5FA',
        display: 'standalone',        // hides browser chrome — feels native
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cache API responses for offline support
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\/api\/attendance/,
            handler: 'NetworkFirst',
            options: { cacheName: 'attendance-cache' },
          },
        ],
      },
    }),
  ],

  server: {
    port: 5173,
    // In dev, proxy /api calls to the backend so CORS isn't an issue
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
