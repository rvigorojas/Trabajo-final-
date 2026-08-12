import type { Rol } from "@pce/api-client"

/*
 * Copia literal de backend/app/deps.py (mismo criterio que apps/coe/src/shell/roles.ts) — sin
 * forma automática de mantener Python y TS sincronizados. Solo ROLES_EDICION_EVALUACION_RELEVO:
 * pmm no agrega Desactivar ni Relevo de mando en este ítem, no necesita ROLES_DESACTIVACION.
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
