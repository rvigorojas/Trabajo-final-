import { beforeEach, describe, expect, it } from "vitest"
import { saveToken } from "@pce/api-client"
import { puedeEncolarNueva } from "./ventanaSesion"

function fixtureToken(): string {
  const base64url = (value: unknown) =>
    btoa(JSON.stringify(value))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")
  const header = base64url({ alg: "HS256", typ: "JWT" })
  const body = base64url({ sub: "u1", rol: "m4", instancia_principal: "pmm" })
  return `${header}.${body}.firma-fixture`
}

describe("ventanaSesion", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("sin sesión iniciada, no permite encolar", () => {
    expect(puedeEncolarNueva()).toBe(false)
  })

  it("dentro de las 24h desde el login, permite encolar", () => {
    saveToken(fixtureToken())
    expect(puedeEncolarNueva()).toBe(true)
  })

  it("pasadas las 24h desde el login, no permite encolar", () => {
    saveToken(fixtureToken())
    const en25Horas = Date.now() + 25 * 60 * 60 * 1000
    expect(puedeEncolarNueva(en25Horas)).toBe(false)
  })
})
