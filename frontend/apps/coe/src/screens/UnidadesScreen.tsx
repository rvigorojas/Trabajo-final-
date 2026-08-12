import { useState } from "react"
import type { EstadoUnidad, Unidad } from "@pce/api-client"
import { apiClient } from "../apiClient"
import { usePolling } from "../hooks/usePolling"

const ESTADOS: { estado: EstadoUnidad; etiqueta: string }[] = [
  { estado: "ok", etiqueta: "OK" },
  { estado: "fuera_de_servicio", etiqueta: "Fuera de servicio" },
  { estado: "no_aplica", etiqueta: "No aplica" },
]

export function UnidadesScreen() {
  const [unidades, setUnidades] = useState<Unidad[]>([])

  usePolling(async () => {
    setUnidades(await apiClient.apiFetch<Unidad[]>("/unidades"))
  })

  async function cambiarEstado(identificador: string, estado: EstadoUnidad) {
    const actualizada = await apiClient.apiFetch<Unidad>(`/unidades/${identificador}`, {
      method: "PUT",
      body: JSON.stringify({ estado }),
    })
    setUnidades((previas) =>
      previas.map((unidad) => (unidad.identificador === identificador ? actualizada : unidad)),
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-headline-md font-headline">Unidades</h1>

      <ul className="mt-4 flex flex-col gap-2">
        {unidades.map((unidad) => (
          <li key={unidad.identificador} className="flex items-center gap-2 text-body-md">
            <span>{unidad.identificador}</span>
            <label className="sr-only" htmlFor={`estado-${unidad.identificador}`}>
              Estado de {unidad.identificador}
            </label>
            <select
              id={`estado-${unidad.identificador}`}
              value={unidad.estado}
              onChange={(event) =>
                cambiarEstado(unidad.identificador, event.target.value as EstadoUnidad)
              }
            >
              {ESTADOS.map(({ estado, etiqueta }) => (
                <option key={estado} value={estado}>
                  {etiqueta}
                </option>
              ))}
            </select>
            <span className="text-status-label">
              Última actualización: {new Date(unidad.hora_recepcion).toLocaleTimeString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
