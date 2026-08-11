import type { ActivacionConConvocatoria } from "@pce/api-client"

/*
 * GET /activaciones no tiene filtro `?estado=` (backend/app/routers/activaciones.py) — se trae
 * la lista completa y se filtra acá. El modelo de negocio no permite dos activaciones activas
 * simultáneas, pero el backend no lo impone: si hubiera más de una, gana la de `hora_evento` más
 * reciente (asunción documentada en tasks/item-03-resumen-cadena-mando/spec.md).
 */
export function activacionActual(
  activaciones: ActivacionConConvocatoria[],
): ActivacionConConvocatoria | null {
  const activas = activaciones.filter((activacion) => activacion.estado === "activa")
  if (activas.length === 0) return null

  return activas.reduce((masReciente, candidata) =>
    new Date(candidata.hora_evento) > new Date(masReciente.hora_evento) ? candidata : masReciente,
  )
}
