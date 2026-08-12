import { useState } from "react"
import type { ActivacionConConvocatoria, CapaMapa, MarcadorIncidente } from "@pce/api-client"
import { apiClient } from "../apiClient"
import { usePolling } from "../hooks/usePolling"
import { activacionActual } from "../lib/activacionActual"

const CAPAS_ACTIVABLES: { capa: CapaMapa; etiqueta: string }[] = [
  { capa: "cuadricula", etiqueta: "Cuadrícula" },
  { capa: "incidente", etiqueta: "Incidente" },
  { capa: "accesos", etiqueta: "Accesos" },
]

/*
 * Sin proveedor de mapas real (spec.md, "Decisiones confirmadas" #4): cada marcador se muestra
 * como fila con su coordenada de cuadrícula, no como un pin sobre un mapa.
 */
export function MapaScreen() {
  const [marcadores, setMarcadores] = useState<MarcadorIncidente[]>([])
  const [capasActivas, setCapasActivas] = useState<Set<CapaMapa>>(
    () => new Set(CAPAS_ACTIVABLES.map((c) => c.capa)),
  )

  usePolling(async () => {
    const [activaciones, todosMarcadores] = await Promise.all([
      apiClient.apiFetch<ActivacionConConvocatoria[]>("/activaciones"),
      apiClient.apiFetch<MarcadorIncidente[]>("/marcadores-incidente"),
    ])
    const actual = activacionActual(activaciones)
    setMarcadores(
      actual ? todosMarcadores.filter((marcador) => marcador.activacion_id === actual.id) : [],
    )
  })

  function alternarCapa(capa: CapaMapa) {
    setCapasActivas((previas) => {
      const siguientes = new Set(previas)
      if (siguientes.has(capa)) {
        siguientes.delete(capa)
      } else {
        siguientes.add(capa)
      }
      return siguientes
    })
  }

  const marcadoresVisibles = marcadores.filter((marcador) => capasActivas.has(marcador.capa))

  return (
    <div className="p-4">
      <h1 className="text-headline-md font-headline">Mapa</h1>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Capas del mapa">
        {CAPAS_ACTIVABLES.map(({ capa, etiqueta }) => (
          <label key={capa} className="text-body-md flex items-center gap-1">
            <input
              type="checkbox"
              checked={capasActivas.has(capa)}
              onChange={() => alternarCapa(capa)}
            />
            {etiqueta}
          </label>
        ))}
        <label className="text-body-md flex items-center gap-1 opacity-50">
          <input type="checkbox" checked={false} disabled />
          Unidades (fase 2)
        </label>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {marcadoresVisibles.map((marcador) => (
          <li key={marcador.id} className="text-body-md">
            {marcador.coordenada_cuadricula} — {marcador.tipo_incidente} ({marcador.capa})
          </li>
        ))}
      </ul>
    </div>
  )
}
