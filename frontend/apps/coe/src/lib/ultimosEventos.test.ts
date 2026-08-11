import { describe, expect, it } from "vitest"
import { ultimosEventos } from "./ultimosEventos"

describe("ultimosEventos", () => {
  it("combina y ordena las 4 fuentes por hora_recepcion desc", () => {
    const resultado = ultimosEventos({
      evaluaciones: [
        {
          id: "e1",
          activacion_id: "a1",
          magnitud: "media",
          riesgos_secundarios: null,
          hora_evento: "2026-08-10T10:00:00Z",
          hora_recepcion: "2026-08-10T10:00:05Z",
        },
      ],
      marcadores: [
        {
          id: "m1",
          activacion_id: "a1",
          coordenada_cuadricula: "B4",
          tipo_incidente: "incendio",
          riesgo: null,
          capa: "incidente",
          estado_sincronizado: true,
          hora_evento: "2026-08-10T10:05:00Z",
          hora_recepcion: "2026-08-10T10:05:10Z",
        },
      ],
      relevos: [
        {
          id: "r1",
          activacion_id: "a1",
          instancia: "coe",
          responsable_saliente: "Ana",
          responsable_entrante: "Beto",
          hora_evento: "2026-08-10T10:10:00Z",
          hora_recepcion: "2026-08-10T10:10:20Z",
        },
      ],
      convocatoria: [
        { id: "c1", activacion_id: "a1", usuario_id: "u1", rol: "duty_manager", hora_confirmacion: "2026-08-10T10:01:00Z" },
        { id: "c2", activacion_id: "a1", usuario_id: "u2", rol: "jefe_rescate", hora_confirmacion: null },
      ],
    })

    // c2 sin confirmar queda afuera; el resto ordenado desc por hora_recepcion/hora_confirmacion
    // (relevo 10:10:20 > marcador 10:05:10 > convocatoria 10:01:00 > evaluación 10:00:05)
    expect(resultado.map((evento) => evento.tipo)).toEqual([
      "relevo_mando",
      "marcador_incidente",
      "convocatoria_confirmada",
      "evaluacion_inicial",
    ])
  })

  it("corta en los primeros 10 eventos", () => {
    const marcadores = Array.from({ length: 15 }, (_, i) => ({
      id: `m${i}`,
      activacion_id: "a1",
      coordenada_cuadricula: "B4",
      tipo_incidente: "incendio",
      riesgo: null,
      capa: "incidente" as const,
      estado_sincronizado: true,
      hora_evento: "2026-08-10T10:00:00Z",
      hora_recepcion: `2026-08-10T10:${String(i).padStart(2, "0")}:00Z`,
    }))

    const resultado = ultimosEventos({ evaluaciones: [], marcadores, relevos: [], convocatoria: [] })

    expect(resultado).toHaveLength(10)
    expect(resultado[0].hora_recepcion).toBe("2026-08-10T10:14:00Z")
  })
})
