import { useEffect, useState, type FormEvent } from "react"
import type { ActivacionConConvocatoria, Instancia } from "@pce/api-client"
import { getClaims } from "@pce/api-client"
import { activacionActual } from "../lib/activacionActual"
import { ROLES_EDICION_EVALUACION_RELEVO } from "../roles"
import { enviarOEncolar } from "../offline/colaOffline"
import { apiClient } from "../apiClient"

/*
 * Pantalla de ruta (no modal) — pmm no tiene el patrón de acciones flotantes de coe (ítem #9,
 * decisión de navegación). Mismos campos que RelevoModal de coe (apps/coe/src/shell/
 * RelevoModal.tsx), duplicado en vez de compartido (mismo criterio ya aplicado con
 * apiClient.ts/activacionActual.ts). Agregada en el ítem #10 para que "relevo de mando" sea una
 * de las 4 escrituras offline-capaces reales de ADR-6, no solo de nombre.
 */
export function RelevoMandoScreen() {
  const [activacion, setActivacion] = useState<ActivacionConConvocatoria | null>()
  const [instancia, setInstancia] = useState<Instancia>("pmm_ci")
  const [responsableSaliente, setResponsableSaliente] = useState("")
  const [responsableEntrante, setResponsableEntrante] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const rol = getClaims()?.rol
  const puedeEditar = rol !== undefined && ROLES_EDICION_EVALUACION_RELEVO.includes(rol)

  useEffect(() => {
    apiClient
      .apiFetch<ActivacionConConvocatoria[]>("/activaciones")
      .then((activaciones) => setActivacion(activacionActual(activaciones)))
  }, [])

  async function enviar(event: FormEvent) {
    event.preventDefault()
    if (!activacion) return
    setEnviando(true)
    await enviarOEncolar("/relevos-mando", {
      id: crypto.randomUUID(),
      activacion_id: activacion.id,
      instancia,
      responsable_saliente: responsableSaliente,
      responsable_entrante: responsableEntrante,
      hora_evento: new Date().toISOString(),
    })
    setEnviando(false)
    setEnviado(true)
  }

  if (!puedeEditar) {
    return (
      <div className="p-4">
        <h1 className="text-headline-md font-headline">Relevo de mando</h1>
        <p className="text-body-md mt-2">Tu rol no puede registrar un relevo de mando.</p>
      </div>
    )
  }

  if (enviado) {
    return (
      <div className="p-4">
        <h1 className="text-headline-md font-headline">Relevo de mando</h1>
        <p className="text-body-md mt-2">Relevo registrado.</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-headline-md font-headline">Relevo de mando</h1>

      {activacion === undefined && <p className="text-body-md mt-2">Cargando…</p>}
      {activacion === null && (
        <p className="text-body-md mt-2">No hay una activación en curso.</p>
      )}
      {activacion && (
        <form onSubmit={enviar} className="mt-2 flex flex-col gap-2">
          <label className="text-body-md" htmlFor="relevo-instancia">
            Instancia
          </label>
          <select
            id="relevo-instancia"
            value={instancia}
            onChange={(event) => setInstancia(event.target.value as Instancia)}
          >
            <option value="coe">COE</option>
            <option value="pmm_ci">PMM</option>
          </select>

          <label className="text-body-md" htmlFor="relevo-saliente">
            Responsable saliente
          </label>
          <input
            id="relevo-saliente"
            value={responsableSaliente}
            onChange={(event) => setResponsableSaliente(event.target.value)}
            required
          />

          <label className="text-body-md" htmlFor="relevo-entrante">
            Responsable entrante
          </label>
          <input
            id="relevo-entrante"
            value={responsableEntrante}
            onChange={(event) => setResponsableEntrante(event.target.value)}
            required
          />

          <button
            type="submit"
            disabled={enviando}
            className="min-h-touch-target-min mt-2 rounded-DEFAULT bg-secondary px-4 text-on-secondary"
          >
            Confirmar relevo
          </button>
        </form>
      )}
    </div>
  )
}
