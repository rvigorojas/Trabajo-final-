import { createApiClient, getToken } from "@pce/api-client"

/*
 * Instancia compartida por toda la app — screens/lib la importan directo en vez de recibirla por
 * props/contexto. En los tests, MSW intercepta al nivel de red (fetch real), así que no hace
 * falta inyección de dependencias para poder mockear las respuestas.
 */
export const apiClient = createApiClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
  getToken,
})
