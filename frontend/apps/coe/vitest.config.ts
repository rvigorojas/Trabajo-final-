import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  test: {
    // happy-dom, no jsdom: jsdom implementa su propia clase AbortSignal (para el "abortable
    // fetch" del spec DOM) que no es `instanceof` la de undici — el data router de React Router
    // 8 arma un Request interno en cada navegación y undici lo rechaza en jsdom. happy-dom no
    // tiene ese conflicto de identidad de clase. Ver tasks/item-02-shell-navegacion/todo.md.
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
  },
})
