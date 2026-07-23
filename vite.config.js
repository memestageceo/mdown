import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages hosts project sites under /<repository>/.
  base: process.env.GITHUB_ACTIONS ? '/mdown/' : '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Mdown — Markdown Reader',
        short_name: 'Mdown',
        description: 'A calm, focused Markdown file viewer. Nothing is uploaded — your files stay in your browser.',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#faf9f6',
        theme_color: '#20211e',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  server: {
    allowedHosts: ['desktop-96v2qtc.tail16ff68.ts.net'],
  },
})
