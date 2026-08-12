/*
 * Tipos TS espejo de los schemas Pydantic reales del backend.
 * Sincronización MANUAL — riesgo de drift conocido y aceptado (ver tasks/plan.md, ítem #1 del
 * BACKLOG.md). Fuente exacta de cada tipo anotada arriba de cada bloque; no inventar campos.
 * Automatizarlo con openapi-typescript contra /docs es una mejora futura, no bloqueante.
 */

// backend/app/models/usuario.py — Rol
export type Rol =
  | "gerente_seguridad"
  | "gerente_operaciones_aeroportuarias"
  | "duty_manager"
  | "jefe_rescate"
  | "supervisor_gral_rescate"
  | "supervisor_rescate"
  | "m4"
  | "m7"
  | "sgo"
  | "bombero_aeronautico"
  | "servicio_medico"

// backend/app/models/usuario.py — InstanciaPrincipal
export type InstanciaPrincipal = "coe" | "pmm"

// backend/app/models/activacion.py — TipoEmergencia
export type TipoEmergencia =
  | "aeronautica"
  | "epidemiologica"
  | "estructural_incidentes"
  | "matpel"

// backend/app/models/activacion.py — NivelAlerta
export type NivelAlerta = "I" | "II" | "III"

// backend/app/models/activacion.py — EstadoActivacion
export type EstadoActivacion = "activa" | "cerrada"

// backend/app/schemas/usuario.py — UsuarioRead
export interface Usuario {
  id: string
  nombre: string
  username: string
  rol: Rol
  instancia_principal: InstanciaPrincipal
  contacto: string | null
  activo: boolean
}

// backend/app/schemas/usuario.py — LoginRequest / TokenResponse
export interface LoginRequest {
  username: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

// backend/app/schemas/convocatoria_miembro.py — ConvocatoriaMiembroRead
export interface ConvocatoriaMiembro {
  id: string
  activacion_id: string
  usuario_id: string
  rol: Rol
  hora_confirmacion: string | null
}

// backend/app/schemas/activacion.py — ActivacionCreate
// Regla de validación server-side (no repetir en el cliente sin motivo, pero sí respetar el
// contrato al armar el payload — FRONTEND-SPEC.md sección 2):
//  - Aeronáutica: tipo_alerta (1-10) + nivel_alerta obligatorios, clasificacion_origen prohibido.
//  - No-Aeronáutica: clasificacion_origen obligatorio, tipo_alerta y nivel_alerta prohibidos
//    (el backend los deriva).
export interface ActivacionCreate {
  id?: string
  tipo_emergencia: TipoEmergencia
  nivel_alerta?: NivelAlerta | null
  clasificacion_origen?: string | null
  tipo_alerta?: number | null
  tipo_incidente: string
  hora_evento: string
}

// backend/app/schemas/activacion.py — ActivacionRead
export interface Activacion {
  id: string
  tipo_emergencia: TipoEmergencia
  nivel_alerta: NivelAlerta
  clasificacion_origen: string | null
  tipo_alerta: number | null
  tipo_incidente: string
  estado: EstadoActivacion
  hora_evento: string
  hora_recepcion: string
}

// backend/app/schemas/activacion.py — ActivacionConConvocatoria
export interface ActivacionConConvocatoria extends Activacion {
  convocatoria: ConvocatoriaMiembro[]
}

// backend/app/schemas/evaluacion_inicial.py — EvaluacionInicialRead
export interface EvaluacionInicial {
  id: string
  activacion_id: string
  magnitud: string
  riesgos_secundarios: string | null
  hora_evento: string
  hora_recepcion: string
}

// backend/app/models/relevo_mando.py — Instancia
export type Instancia = "coe" | "pmm_ci"

// backend/app/schemas/relevo_mando.py — RelevoMandoRead
export interface RelevoMando {
  id: string
  activacion_id: string
  instancia: Instancia
  responsable_saliente: string
  responsable_entrante: string
  hora_evento: string
  hora_recepcion: string
}

// backend/app/models/marcador_incidente.py — CapaMapa
export type CapaMapa = "cuadricula" | "incidente" | "accesos" | "unidades_fase2"

// backend/app/schemas/marcador_incidente.py — MarcadorIncidenteRead
export interface MarcadorIncidente {
  id: string
  activacion_id: string
  coordenada_cuadricula: string
  tipo_incidente: string
  riesgo: string | null
  capa: CapaMapa
  estado_sincronizado: boolean
  hora_evento: string
  hora_recepcion: string
}

// backend/app/models/unidad.py — EstadoUnidad
export type EstadoUnidad = "ok" | "fuera_de_servicio" | "no_aplica"

// backend/app/schemas/unidad.py — UnidadRead
export interface Unidad {
  identificador: string
  estado: EstadoUnidad
  hora_recepcion: string
}

// backend/app/schemas/pre_pai.py — PrePAIRead
export interface PrePAI {
  id: string
  nombre_escenario: string
  sector: string
  tipo_emergencia: TipoEmergencia
  caracterizacion: string
  riesgos: string | null
  contactos_emergencia: string | null
  recursos: string | null
  estrategias_control: string | null
  plano_acceso: string | null
  dimensiones_escenario: string | null
}

// backend/app/schemas/reporte_cierre.py — ReporteCierreRead
export interface ReporteCierre {
  id: string
  activacion_id: string
  tipo_emergencia: TipoEmergencia
  generado_en: string
  datos: Record<string, unknown>
}
