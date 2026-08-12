import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  // VitePWA acá también (no solo en vite.config.ts): sin el plugin, Vite no resuelve el módulo
  // virtual "virtual:pwa-register/react" y falla en el análisis de imports antes de que
  // vi.mock("virtual:pwa-register/react", ...) llegue a interceptarlo.
  plugins: [react(), VitePWA({ registerType: "prompt" })],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
  },
})
