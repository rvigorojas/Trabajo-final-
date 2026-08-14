import { beforeEach, describe, expect, it } from "vitest"
import { decodeToken, getClaims, getSesionIniciadaEn, getToken, logout, saveToken } from "./session"

function buildFixtureToken(payload: Record<string, unknown>): string {
  const base64url = (value: unknown) =>
    btoa(JSON.stringify(value))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")
  const header = base64url({ alg: "HS256", typ: "JWT" })
  const body = base64url(payload)
  // Firma no verificada en el cliente (el backend ya la validó) — string cualquiera basta.
  return `${header}.${body}.firma-fixture`
}

describe("session", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("decodifica sub, rol e instancia_principal de un JWT de fixture", () => {
    const token = buildFixtureToken({
      sub: "11111111-1111-1111-1111-111111111111",
      rol: "jefe_rescate",
      instancia_principal: "pmm",
    })

    expect(decodeToken(token)).toEqual({
      sub: "11111111-1111-1111-1111-111111111111",
      rol: "jefe_rescate",
      instancia_principal: "pmm",
    })
  })

  it("rechaza un token sin los 3 claims esperados", () => {
    const token = buildFixtureToken({ sub: "solo-esto" })
    expect(() => decodeToken(token)).toThrow()
  })

  it("getClaims lee del storage lo que guardó saveToken", () => {
    const token = buildFixtureToken({
      sub: "u1",
      rol: "duty_manager",
      instancia_principal: "coe",
    })

    saveToken(token)

    expect(getToken()).toBe(token)
    expect(getClaims()?.rol).toBe("duty_manager")
  })

  it("logout limpia el storage", () => {
    saveToken(buildFixtureToken({ sub: "u1", rol: "m4", instancia_principal: "pmm" }))

    logout()

    expect(getToken()).toBeNull()
    expect(getClaims()).toBeNull()
  })

  it("saveToken registra el momento del login; logout lo limpia", () => {
    expect(getSesionIniciadaEn()).toBeNull()

    const antes = Date.now()
    saveToken(buildFixtureToken({ sub: "u1", rol: "m4", instancia_principal: "pmm" }))
    const despues = Date.now()

    const iniciadaEn = getSesionIniciadaEn()
    expect(iniciadaEn).not.toBeNull()
    expect(iniciadaEn as number).toBeGreaterThanOrEqual(antes)
    expect(iniciadaEn as number).toBeLessThanOrEqual(despues)

    logout()
    expect(getSesionIniciadaEn()).toBeNull()
  })
})
