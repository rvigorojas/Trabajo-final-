/*
 * Store de sesión — decodifica claims del JWT ya validado por el backend (sub, rol,
 * instancia_principal, ver app/core/security.py y app/deps.py) sin verificar la firma: el
 * backend ya lo hizo, el cliente solo lee lo que ya está firmado (FRONTEND-SPEC.md sección 3).
 */

import type { InstanciaPrincipal, Rol } from "./types"

export interface SessionClaims {
  sub: string
  rol: Rol
  instancia_principal: InstanciaPrincipal
}

const STORAGE_KEY = "pce.session.token"
const SESION_INICIADA_KEY = "pce.session.iniciadaEn"

export function decodeToken(token: string): SessionClaims {
  const payloadSegment = token.split(".")[1]
  if (!payloadSegment) {
    throw new Error("Token con formato inválido (falta el payload)")
  }

  const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
  const claims = JSON.parse(atob(padded)) as Partial<SessionClaims>

  if (!claims.sub || !claims.rol || !claims.instancia_principal) {
    throw new Error("Token sin los claims esperados (sub, rol, instancia_principal)")
  }

  return { sub: claims.sub, rol: claims.rol, instancia_principal: claims.instancia_principal }
}

export function saveToken(token: string): void {
  localStorage.setItem(STORAGE_KEY, token)
  localStorage.setItem(SESION_INICIADA_KEY, String(Date.now()))
}

export function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

/*
 * Momento del login (ADR-7, ventana de sesión offline de 24h) — no confundir con la expiración
 * del JWT en sí, que el cliente nunca valida: la ventana se mide desde que el usuario se logueó,
 * no desde que el token expiró.
 */
export function getSesionIniciadaEn(): number | null {
  const value = localStorage.getItem(SESION_INICIADA_KEY)
  return value ? Number(value) : null
}

export function getClaims(): SessionClaims | null {
  const token = getToken()
  if (!token) return null
  try {
    return decodeToken(token)
  } catch {
    return null
  }
}

export function logout(): void {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(SESION_INICIADA_KEY)
}
