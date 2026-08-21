import { createApiClient, getToken, logout } from "@pce/api-client"

/*
 * Instancia compartida por toda la app — screens/lib la importan directo en vez de recibirla por
 * props/contexto. En los tests, MSW intercepta al nivel de red (fetch real), así que no hace
 * falta inyección de dependencias para poder mockear las respuestas.
 */

// `onUnauthorized` estaba sin cablear acá (el comentario original de client.ts decía que el 401
// ya se manejaba "al hacer flush de la cola offline") — pero eso solo cubre flushColaOffline(),
// no el envío interactivo online (enviarOEncolar rethrows el ApiError tal cual, spec.md "Riesgos
// y mitigación"). Con un JWT vencido y la app online, NuevaActivacionScreen/EvaluacionInicial/
// MarcadorIncidente/RelevoMando mostraban el mensaje crudo del backend ("Not authenticated") sin
// ninguna forma de volver al Login desde la UI (Shell de pmm no tiene botón de logout). Mismo
// patrón de guarda que coe para no disparar el reload más de una vez.
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
