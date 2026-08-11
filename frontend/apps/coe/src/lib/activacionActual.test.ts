import { describe, expect, it } from "vitest"
import type { ActivacionConConvocatoria } from "@pce/api-client"
import { activacionActual } from "./activacionActual"

function fixture(
  overrides: Partial<ActivacionConConvocatoria>,
): ActivacionConConvocatoria {
  return {
    id: "1",
    tipo_emergencia: "aeronautica",
    nivel_alerta: "I",
    clasificacion_origen: null,
    tipo_alerta: 3,
    tipo_incidente: "incendio",
    estado: "activa",
    hora_evento: "2026-08-10T10:00:00Z",
    hora_recepcion: "2026-08-10T10:00:01Z",
    convocatoria: [],
    ...overrides,
  }
}

describe("activacionActual", () => {
  it("devuelve null si no hay ninguna con estado activa", () => {
    expect(activacionActual([fixture({ id: "1", estado: "cerrada" })])).toBeNull()
  })

  it("devuelve la única activa", () => {
    const activa = fixture({ id: "1", estado: "activa" })
    expect(activacionActual([fixture({ id: "2", estado: "cerrada" }), activa])).toBe(activa)
  })

  it("con dos activas, devuelve la de hora_evento más reciente", () => {
    const vieja = fixture({ id: "1", estado: "activa", hora_evento: "2026-08-10T08:00:00Z" })
    const reciente = fixture({ id: "2", estado: "activa", hora_evento: "2026-08-10T10:00:00Z" })
    expect(activacionActual([vieja, reciente])).toBe(reciente)
  })
})
