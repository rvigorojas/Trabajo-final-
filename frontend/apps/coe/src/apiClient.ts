import { createApiClient, getToken, logout } from "@pce/api-client"

/*
 * Instancia compartida por toda la app — screens/lib la importan directo en vez de recibirla por
 * props/contexto. En los tests, MSW intercepta al nivel de red (fetch real), así que no hace
 * falta inyección de dependencias para poder mockear las respuestas.
 */

// El polling (usePolling, ADR-5) dispara varias llamadas en paralelo cada 3s — sin esta guarda,
// un token vencido llamaría a onUnauthorized (y por lo tanto a reload()) una vez por cada
// llamada que reciba el 401, no solo la primera.
let sesionVencidaNotificada = false

export const apiClient = createApiClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
  getToken,
  onUnauthorized: () => {
    if (sesionVencidaNotificada) return
    sesionVencidaNotificada = true
    logout()
    window.location.reload()
  },
})
