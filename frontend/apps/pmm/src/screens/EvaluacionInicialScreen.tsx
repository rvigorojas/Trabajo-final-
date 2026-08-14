import { useEffect, useState, type FormEvent } from "react"
import type { ActivacionConConvocatoria } from "@pce/api-client"
import { getClaims } from "@pce/api-client"
import { apiClient } from "../apiClient"
import { activacionActual } from "../lib/activacionActual"
import { ROLES_EDICION_EVALUACION_RELEVO } from "../roles"
import { enviarOEncolar } from "../offline/colaOffline"

export function EvaluacionInicialScreen() {
  const [activacion, setActivacion] = useState<ActivacionConConvocatoria | null>()
  const [magnitud, setMagnitud] = useState("")
  const [riesgosSecundarios, setRiesgosSecundarios] = useState("")
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
    await enviarOEncolar("/evaluaciones-iniciales", {
      id: crypto.randomUUID(),
      activacion_id: activacion.id,
      magnitud,
      riesgos_secundarios: riesgosSecundarios || null,
      hora_evento: new Date().toISOString(),
    })
    setEnviando(false)
    setEnviado(true)
  }

  if (!puedeEditar) {
    return (
      <div className="p-4">
        <h1 className="text-headline-md font-headline">Evaluación inicial</h1>
        <p className="text-body-md mt-2">Tu rol no puede completar la evaluación inicial.</p>
      </div>
    )
  }

  if (enviado) {
    return (
      <div className="p-4">
        <h1 className="text-headline-md font-headline">Evaluación inicial</h1>
        <p className="text-body-md mt-2">Evaluación registrada.</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-headline-md font-headline">Evaluación inicial</h1>

      {activacion === undefined && <p className="text-body-md mt-2">Cargando…</p>}
      {activacion === null && (
        <p className="text-body-md mt-2">No hay una activación en curso.</p>
      )}
      {activacion && (
        <form onSubmit={enviar} className="mt-2 flex flex-col gap-2">
          <label className="text-body-md" htmlFor="magnitud">
            Magnitud
          </label>
          <input
            id="magnitud"
            value={magnitud}
            onChange={(event) => setMagnitud(event.target.value)}
            required
            className="min-h-touch-target-min rounded-DEFAULT border border-outline bg-surface-container-low px-3 text-on-surface"
          />

          <label className="text-body-md" htmlFor="riesgos-secundarios">
            Riesgos secundarios
          </label>
          <input
            id="riesgos-secundarios"
            value={riesgosSecundarios}
            onChange={(event) => setRiesgosSecundarios(event.target.value)}
            className="min-h-touch-target-min rounded-DEFAULT border border-outline bg-surface-container-low px-3 text-on-surface"
          />

          <button
            type="submit"
            disabled={enviando}
            className="min-h-touch-target-min mt-2 rounded-DEFAULT bg-secondary px-4 text-on-secondary"
          >
            Enviar
          </button>
        </form>
      )}
    </div>
  )
}
