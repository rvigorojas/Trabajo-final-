import { getSesionIniciadaEn } from "@pce/api-client"

/*
 * Ventana máxima de sesión offline (ADR-7, confirmado con Renzo 2026-08-12: 24h). Se mide desde
 * el login (`sesionIniciadaEn`), no desde que empezó el corte de conexión — no hay forma de saber
 * client-side cuándo se perdió la señal. Solo bloquea encolar acciones *nuevas*; lo ya encolado
 * dentro de la ventana no se toca (spec.md, "Decisiones" #5).
 */
const VENTANA_MS = 24 * 60 * 60 * 1000

export function puedeEncolarNueva(ahora: number = Date.now()): boolean {
  const iniciadaEn = getSesionIniciadaEn()
  if (iniciadaEn === null) return false
  return ahora - iniciadaEn <= VENTANA_MS
}
