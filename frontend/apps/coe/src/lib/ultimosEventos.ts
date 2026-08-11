import type {
  ConvocatoriaMiembro,
  EvaluacionInicial,
  MarcadorIncidente,
  RelevoMando,
} from "@pce/api-client"

/*
 * No hay endpoint de auditoría expuesto (FRONTEND-SPEC.md sección 6.2, decisión ya tomada: no
 * agregarlo). El feed de "últimos eventos" se arma acá combinando las fuentes de dominio ya
 * consumidas por Resumen, normalizadas a un evento común y ordenadas por hora_recepcion desc.
 */
export interface Evento {
  tipo: "evaluacion_inicial" | "marcador_incidente" | "relevo_mando" | "convocatoria_confirmada"
  descripcion: string
  hora_recepcion: string
}

const CANTIDAD_MAXIMA = 10

export function ultimosEventos(fuentes: {
  evaluaciones: EvaluacionInicial[]
  marcadores: MarcadorIncidente[]
  relevos: RelevoMando[]
  convocatoria: ConvocatoriaMiembro[]
}): Evento[] {
  const eventos: Evento[] = [
    ...fuentes.evaluaciones.map(
      (evaluacion): Evento => ({
        tipo: "evaluacion_inicial",
        descripcion: `Evaluación inicial: ${evaluacion.magnitud}`,
        hora_recepcion: evaluacion.hora_recepcion,
      }),
    ),
    ...fuentes.marcadores.map(
      (marcador): Evento => ({
        tipo: "marcador_incidente",
        descripcion: `Marcador (${marcador.capa}): ${marcador.tipo_incidente}`,
        hora_recepcion: marcador.hora_recepcion,
      }),
    ),
    ...fuentes.relevos.map(
      (relevo): Evento => ({
        tipo: "relevo_mando",
        descripcion: `Relevo ${relevo.instancia}: ${relevo.responsable_saliente} → ${relevo.responsable_entrante}`,
        hora_recepcion: relevo.hora_recepcion,
      }),
    ),
    ...fuentes.convocatoria
      .filter((miembro): miembro is ConvocatoriaMiembro & { hora_confirmacion: string } =>
        miembro.hora_confirmacion !== null,
      )
      .map(
        (miembro): Evento => ({
          tipo: "convocatoria_confirmada",
          descripcion: `Convocatoria confirmada (rol ${miembro.rol})`,
          hora_recepcion: miembro.hora_confirmacion,
        }),
      ),
  ]

  return eventos
    .sort((a, b) => new Date(b.hora_recepcion).getTime() - new Date(a.hora_recepcion).getTime())
    .slice(0, CANTIDAD_MAXIMA)
}
