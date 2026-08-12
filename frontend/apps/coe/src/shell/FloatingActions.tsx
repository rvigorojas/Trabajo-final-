import { useState } from "react"
import { getClaims } from "@pce/api-client"
import { ROLES_DESACTIVACION, ROLES_EDICION_EVALUACION_RELEVO } from "./roles"
import { RelevoModal } from "./RelevoModal"
import { DesactivarModal } from "./DesactivarModal"

/*
 * Relevo de mando y Desactivar, siempre a mano (Opción 1A). Ocultas por completo si el rol
 * logueado no está habilitado — no deshabilitadas (spec.md, "Decisiones confirmadas").
 */
export function FloatingActions() {
  const rol = getClaims()?.rol
  const puedeRelevar = rol !== undefined && ROLES_EDICION_EVALUACION_RELEVO.includes(rol)
  const puedeDesactivar = rol !== undefined && ROLES_DESACTIVACION.includes(rol)
  const [modalAbierto, setModalAbierto] = useState<"relevo" | "desactivar" | null>(null)

  if (!puedeRelevar && !puedeDesactivar) {
    return null
  }

  return (
    <>
      <div className="absolute bottom-20 right-4 flex flex-col gap-2">
        {puedeRelevar && (
          <button
            type="button"
            onClick={() => setModalAbierto("relevo")}
            className="min-h-touch-target-min rounded-DEFAULT bg-secondary px-4 text-body-lg text-on-secondary"
          >
            Relevo de mando
          </button>
        )}
        {puedeDesactivar && (
          <button
            type="button"
            onClick={() => setModalAbierto("desactivar")}
            className="min-h-touch-target-min rounded-DEFAULT bg-error px-4 text-body-lg text-on-error"
          >
            Desactivar
          </button>
        )}
      </div>
      {modalAbierto === "relevo" && <RelevoModal onClose={() => setModalAbierto(null)} />}
      {modalAbierto === "desactivar" && (
        <DesactivarModal onClose={() => setModalAbierto(null)} />
      )}
    </>
  )
}
