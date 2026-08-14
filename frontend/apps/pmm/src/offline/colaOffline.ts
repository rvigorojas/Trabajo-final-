import { ApiError } from "@pce/api-client"
import { apiClient } from "../apiClient"
import { agregarACola, listarCola, quitarDeCola } from "./db"

/*
 * enviarOEncolar/flushColaOffline — cola offline de las 4 escrituras de ADR-6 (activación,
 * evaluación inicial, marcador de incidente, relevo de mando). Solo se encola por falla de red
 * real (offline conocido o `fetch` rechazado) — un ApiError (4xx/5xx, el servidor sí respondió)
 * nunca se encola, se relanza tal cual (spec.md, "Riesgos y mitigación").
 */

export class SesionVencidaError extends Error {
  constructor() {
    super("La sesión venció mientras se sincronizaba la cola offline")
    this.name = "SesionVencidaError"
  }
}

interface ConId {
  id: string
}

/*
 * Evento del DOM disparado cada vez que la cola cambia de tamaño (se agregó o se quitó una
 * entrada) — el Shell lo escucha para refrescar el contador "N sin sincronizar" sin necesidad de
 * polling continuo (spec.md, "Decisiones" #6).
 */
export const EVENTO_CAMBIO_COLA = "pce:cola-offline-cambio"

function notificarCambioCola(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENTO_CAMBIO_COLA))
  }
}

/*
 * Devuelve la respuesta real si el POST tuvo éxito online, o `undefined` si quedó encolado (sin
 * respuesta del servidor todavía) — cada pantalla decide qué mostrar en ese segundo caso (spec.md,
 * "Decisiones" #3: no todas necesitan datos de la respuesta, pero NuevaActivacionScreen sí, para
 * "Convocados: N").
 */
export async function enviarOEncolar<T = void, B extends ConId = ConId>(
  path: string,
  body: B,
): Promise<T | undefined> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    await agregarACola({ id: body.id, path, body, encoladoEn: Date.now() })
    notificarCambioCola()
    return undefined
  }

  try {
    return await apiClient.apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) })
  } catch (error) {
    if (error instanceof ApiError) throw error
    await agregarACola({ id: body.id, path, body, encoladoEn: Date.now() })
    notificarCambioCola()
    return undefined
  }
}

/*
 * Reintenta la cola en el orden en que se encoló. Un 401 (token vencido, hueco 6.4) corta el
 * flush ahí mismo, sin vaciar el resto — el llamador (App.tsx) debe forzar relogin y volver a
 * llamar a flushColaOffline() tras el próximo login exitoso. Un 4xx/5xx que no sea 401 se
 * considera irrecuperable (dato inválido) y se descarta de la cola.
 */
export async function flushColaOffline(): Promise<void> {
  const entradas = await listarCola()
  for (const entrada of entradas) {
    try {
      await apiClient.apiFetch(entrada.path, {
        method: "POST",
        body: JSON.stringify(entrada.body),
      })
      await quitarDeCola(entrada.id)
      notificarCambioCola()
    } catch (error) {
      if (error instanceof ApiError && error.kind === "unauthorized") {
        throw new SesionVencidaError()
      }
      if (error instanceof ApiError) {
        await quitarDeCola(entrada.id)
        notificarCambioCola()
        continue
      }
      return // sigue offline (u otro error de red) — se reintenta en el próximo evento "online"
    }
  }
}

export async function tamañoCola(): Promise<number> {
  return (await listarCola()).length
}
