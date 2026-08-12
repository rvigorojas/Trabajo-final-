import { describe, expect, it } from "vitest"
import { payloadActivacion } from "./payloadActivacion"

describe("payloadActivacion", () => {
  it("aeronautica: incluye nivel_alerta/tipo_alerta, omite clasificacion_origen", () => {
    const body = payloadActivacion({
      id: "u1",
      categoria: "aeronautica",
      tipoIncidente: "incendio en pista",
      horaEvento: "2026-08-11T10:00:00.000Z",
      nivelAlerta: "II",
      tipoAlerta: 5,
    })

    expect(body).toEqual({
      id: "u1",
      tipo_emergencia: "aeronautica",
      tipo_incidente: "incendio en pista",
      hora_evento: "2026-08-11T10:00:00.000Z",
      nivel_alerta: "II",
      tipo_alerta: 5,
    })
    expect(body).not.toHaveProperty("clasificacion_origen")
  })

  it("epidemiologica: incluye clasificacion_origen, omite nivel_alerta/tipo_alerta", () => {
    const body = payloadActivacion({
      id: "u2",
      categoria: "epidemiologica",
      tipoIncidente: "brote sospechoso",
      horaEvento: "2026-08-11T10:00:00.000Z",
      clasificacionOrigen: "EMERGENCIA",
    })

    expect(body).toEqual({
      id: "u2",
      tipo_emergencia: "epidemiologica",
      tipo_incidente: "brote sospechoso",
      hora_evento: "2026-08-11T10:00:00.000Z",
      clasificacion_origen: "EMERGENCIA",
    })
    expect(body).not.toHaveProperty("nivel_alerta")
    expect(body).not.toHaveProperty("tipo_alerta")
  })

  it("estructural_incidentes: clasificacion_origen con capitalizacion exacta", () => {
    const body = payloadActivacion({
      id: "u3",
      categoria: "estructural_incidentes",
      tipoIncidente: "derrumbe parcial",
      horaEvento: "2026-08-11T10:00:00.000Z",
      clasificacionOrigen: "Estructural",
    })

    expect(body.clasificacion_origen).toBe("Estructural")
  })

  it("matpel: clasificacion_origen tipo Clase N", () => {
    const body = payloadActivacion({
      id: "u4",
      categoria: "matpel",
      tipoIncidente: "derrame de combustible",
      horaEvento: "2026-08-11T10:00:00.000Z",
      clasificacionOrigen: "Clase 3",
    })

    expect(body.clasificacion_origen).toBe("Clase 3")
    expect(body).not.toHaveProperty("nivel_alerta")
  })
})
