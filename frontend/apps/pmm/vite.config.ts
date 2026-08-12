import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // registerType "prompt", no "autoUpdate" (ADR-4): nunca aplicar una versión nueva en
    // silencio, siempre avisar y dejar que ActualizacionDisponible dispare el reload.
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: 'PCE — Cliente PMM',
        short_name: 'PCE PMM',
        start_url: '/',
        display: 'standalone',
        icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
    }),
  ],
})
