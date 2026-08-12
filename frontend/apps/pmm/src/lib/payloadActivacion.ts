import type { ActivacionCreate, NivelAlerta, TipoEmergencia } from "@pce/api-client"

interface PayloadActivacionInput {
  id: string
  categoria: TipoEmergencia
  tipoIncidente: string
  horaEvento: string
  nivelAlerta?: NivelAlerta
  tipoAlerta?: number
  clasificacionOrigen?: string
}

/*
 * Arma el body exacto por categoría (FRONTEND-SPEC.md sección 2): Aeronáutica lleva
 * nivel_alerta/tipo_alerta y nunca clasificacion_origen; el resto de las categorías es al revés.
 * El backend rechaza con 422 si se mezclan, pero el cliente no debe depender de eso.
 */
export function payloadActivacion(input: PayloadActivacionInput): ActivacionCreate {
  const base = {
    id: input.id,
    tipo_emergencia: input.categoria,
    tipo_incidente: input.tipoIncidente,
    hora_evento: input.horaEvento,
  }

  if (input.categoria === "aeronautica") {
    return {
      ...base,
      nivel_alerta: input.nivelAlerta,
      tipo_alerta: input.tipoAlerta,
    }
  }

  return {
    ...base,
    clasificacion_origen: input.clasificacionOrigen,
  }
}
