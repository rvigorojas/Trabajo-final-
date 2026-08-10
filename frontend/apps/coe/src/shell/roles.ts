import type { Rol } from "@pce/api-client"

/*
 * Copia literal de backend/app/deps.py — sin forma automática de mantener Python y TS
 * sincronizados (mismo riesgo aceptado ya en packages/api-client/src/types.ts, ítem #1).
 * Si el backend cambia estas listas, actualizar acá a mano.
 */

// backend/app/deps.py — ROLES_EDICION_EVALUACION_RELEVO
export const ROLES_EDICION_EVALUACION_RELEVO: Rol[] = [
  "jefe_rescate",
  "supervisor_gral_rescate",
  "supervisor_rescate",
  "gerente_seguridad",
  "gerente_operaciones_aeroportuarias",
  "duty_manager",
]

// backend/app/deps.py — ROLES_DESACTIVACION
export const ROLES_DESACTIVACION: Rol[] = [
  "gerente_seguridad",
  "gerente_operaciones_aeroportuarias",
  "duty_manager",
]
