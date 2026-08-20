import { useEffect, useState } from "react"
import type { ActivacionConConvocatoria, ReporteCierre, TipoEmergencia } from "@pce/api-client"
import { getToken } from "@pce/api-client"
import { apiClient } from "../apiClient"

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"

const CATEGORIAS_EXPORTAR: { valor: TipoEmergencia; etiqueta: string }[] = [
  { valor: "aeronautica", etiqueta: "Aeronáutica" },
  { valor: "epidemiologica", etiqueta: "Epidemiológica" },
  { valor: "estructural_incidentes", etiqueta: "Estructural / Incidentes" },
  { valor: "matpel", etiqueta: "MATPEL" },
]

// GET /reportes-cierre/exportar devuelve un archivo binario (.xlsx), no JSON — no puede
// pasar por apiClient.apiFetch (siempre hace response.json()). Fetch aparte, mismo patrón
// de Authorization que createApiClient pero leyendo el body como blob.
async function descargarReporteExcel(tipoEmergencia: TipoEmergencia): Promise<void> {
  const token = getToken()
  const headers = new Headers()
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const response = await fetch(
    `${BASE_URL}/reportes-cierre/exportar?tipo_emergencia=${tipoEmergencia}`,
    { headers },
  )
  if (!response.ok) return

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement("a")
  enlace.href = url
  enlace.download = `cuadro-estadistico-${tipoEmergencia}.xlsx`
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  URL.revokeObjectURL(url)
}

function valorLegible(valor: unknown): string {
  // La mayoría de las columnas reales de ReporteCierre.datos quedan en null:
  // detalle operativo que el PCE v1 no captura, a completar manualmente
  // (ver backend/app/services/reporte_cierre.py) — se muestra vacío, no el
  // literal "null".
  if (valor === null || valor === undefined) return "—"
  if (typeof valor === "string" || typeof valor === "number") return String(valor)
  return JSON.stringify(valor, null, 2)
}

export function ReportesScreen() {
  const [activaciones, setActivaciones] = useState<ActivacionConConvocatoria[]>([])
  const [reportes, setReportes] = useState<Record<string, ReporteCierre>>({})
  const [categoriaExportar, setCategoriaExportar] = useState<TipoEmergencia>("aeronautica")

  useEffect(() => {
    let cancelado = false
    apiClient.apiFetch<ActivacionConConvocatoria[]>("/activaciones").then((datos) => {
      if (!cancelado) setActivaciones(datos)
    })
    return () => {
      cancelado = true
    }
  }, [])

  const cerradas = activaciones.filter((activacion) => activacion.estado === "cerrada")

  async function verReporte(activacionId: string) {
    const reporte = await apiClient.apiFetch<ReporteCierre>("/reportes-cierre", {
      method: "POST",
      body: JSON.stringify({ activacion_id: activacionId }),
    })
    setReportes((previos) => ({ ...previos, [activacionId]: reporte }))
  }

  return (
    <div className="p-4">
      <h1 className="text-headline-md font-headline">Reportes</h1>

      <div className="mt-4 flex items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-body-md" htmlFor="categoria-exportar">
            Descargar Excel consolidado
          </label>
          <select
            id="categoria-exportar"
            value={categoriaExportar}
            onChange={(event) => setCategoriaExportar(event.target.value as TipoEmergencia)}
            className="min-h-touch-target-min rounded-DEFAULT border border-outline bg-surface-container-low px-3 text-on-surface"
          >
            {CATEGORIAS_EXPORTAR.map(({ valor, etiqueta }) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="min-h-touch-target-min rounded-DEFAULT bg-secondary px-4 text-on-secondary"
          onClick={() => descargarReporteExcel(categoriaExportar)}
        >
          Descargar
        </button>
      </div>

      <ul className="mt-4 flex flex-col gap-4">
        {cerradas.map((activacion) => {
          const reporte = reportes[activacion.id]
          return (
            <li key={activacion.id}>
              <p className="text-body-md">{activacion.tipo_incidente}</p>
              <button
                type="button"
                className="min-h-touch-target-min text-body-md underline"
                onClick={() => verReporte(activacion.id)}
              >
                Ver reporte
              </button>
              {reporte && (
                <dl className="mt-2" data-testid={`reporte-${activacion.id}`}>
                  {Object.entries(reporte.datos).map(([clave, valor]) => (
                    <div key={clave} className="mt-1">
                      <dt className="text-status-label">{clave}</dt>
                      <dd className="text-body-md whitespace-pre-wrap">{valorLegible(valor)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
