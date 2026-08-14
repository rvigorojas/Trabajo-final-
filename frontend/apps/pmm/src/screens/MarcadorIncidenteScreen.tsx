import { useEffect, useState, type FormEvent } from "react"
import type { ActivacionConConvocatoria, CapaMapa } from "@pce/api-client"
import { apiClient } from "../apiClient"
import { activacionActual } from "../lib/activacionActual"
import { enviarOEncolar } from "../offline/colaOffline"

const CAPAS: { valor: CapaMapa; etiqueta: string }[] = [
  { valor: "cuadricula", etiqueta: "Cuadrícula" },
  { valor: "incidente", etiqueta: "Incidente" },
  { valor: "accesos", etiqueta: "Accesos" },
]

/*
 * Badge "sin sincronizar" = estado del envío actual (spec.md, "Decisiones" #3): visible mientras
 * la promesa del POST no resuelve. La cola offline persistente real es el ítem #10.
 */
export function MarcadorIncidenteScreen() {
  const [activacion, setActivacion] = useState<ActivacionConConvocatoria | null>()
  const [coordenadaCuadricula, setCoordenadaCuadricula] = useState("")
  const [tipoIncidente, setTipoIncidente] = useState("")
  const [riesgo, setRiesgo] = useState("")
  const [capa, setCapa] = useState<CapaMapa>("incidente")
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    apiClient
      .apiFetch<ActivacionConConvocatoria[]>("/activaciones")
      .then((activaciones) => setActivacion(activacionActual(activaciones)))
  }, [])

  async function enviar(event: FormEvent) {
    event.preventDefault()
    if (!activacion) return
    setEnviando(true)
    await enviarOEncolar("/marcadores-incidente", {
      id: crypto.randomUUID(),
      activacion_id: activacion.id,
      coordenada_cuadricula: coordenadaCuadricula,
      tipo_incidente: tipoIncidente,
      riesgo: riesgo || null,
      capa,
      hora_evento: new Date().toISOString(),
    })
    setEnviando(false)
    setEnviado(true)
  }

  if (enviado) {
    return (
      <div className="p-4">
        <h1 className="text-headline-md font-headline">Marcador de incidente</h1>
        <p className="text-body-md mt-2">Marcador registrado.</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-headline-md font-headline">Marcador de incidente</h1>
      {enviando && (
        <p className="text-body-md mt-2" data-testid="badge-sin-sincronizar">
          Sin sincronizar
        </p>
      )}

      {activacion === undefined && <p className="text-body-md mt-2">Cargando…</p>}
      {activacion === null && (
        <p className="text-body-md mt-2">No hay una activación en curso.</p>
      )}
      {activacion && (
        <form onSubmit={enviar} className="mt-2 flex flex-col gap-2">
          <label className="text-body-md" htmlFor="coordenada-cuadricula">
            Coordenada de cuadrícula
          </label>
          <input
            id="coordenada-cuadricula"
            value={coordenadaCuadricula}
            onChange={(event) => setCoordenadaCuadricula(event.target.value)}
            required
            className="min-h-touch-target-min rounded-DEFAULT border border-outline bg-surface-container-low px-3 text-on-surface"
          />

          <label className="text-body-md" htmlFor="tipo-incidente-marcador">
            Tipo de incidente
          </label>
          <input
            id="tipo-incidente-marcador"
            value={tipoIncidente}
            onChange={(event) => setTipoIncidente(event.target.value)}
            required
            className="min-h-touch-target-min rounded-DEFAULT border border-outline bg-surface-container-low px-3 text-on-surface"
          />

          <label className="text-body-md" htmlFor="riesgo">
            Riesgo
          </label>
          <input
            id="riesgo"
            value={riesgo}
            onChange={(event) => setRiesgo(event.target.value)}
            className="min-h-touch-target-min rounded-DEFAULT border border-outline bg-surface-container-low px-3 text-on-surface"
          />

          <label className="text-body-md" htmlFor="capa">
            Capa
          </label>
          <select
            id="capa"
            value={capa}
            onChange={(event) => setCapa(event.target.value as CapaMapa)}
            className="min-h-touch-target-min rounded-DEFAULT border border-outline bg-surface-container-low px-3 text-on-surface"
          >
            {CAPAS.map(({ valor, etiqueta }) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={enviando}
            className="min-h-touch-target-min mt-2 rounded-DEFAULT bg-secondary px-4 text-on-secondary"
          >
            Registrar marcador
          </button>
        </form>
      )}
    </div>
  )
}
