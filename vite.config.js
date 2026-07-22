import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages hosts project sites under /<repository>/.
  base: process.env.GITHUB_ACTIONS ? '/mdown/' : '/',
  plugins: [react()],
  server: {
    allowedHosts: ['desktop-96v2qtc.tail16ff68.ts.net'],
  },
})
