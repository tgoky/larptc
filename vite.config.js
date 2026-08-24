import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'jester.png', 'tool-icons/phantom.png', 'tool-icons/trust.png'],
      workbox: {
        globPatterns: ['index.html', 'manifest.webmanifest', 'favicon.svg', 'manifests/*.webmanifest'],
        navigateFallbackDenylist: [/^\/apps\//, /^\/manifests\//],
      },
      manifest: {
        name: 'Larp Tools',
        short_name: 'Larp Tools',
        description: 'Simulation tools for wallet, platform and dashboard demo environments.',
        theme_color: '#1d1d1d',
        background_color: '#1d1d1d',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/jester.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/jester.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
