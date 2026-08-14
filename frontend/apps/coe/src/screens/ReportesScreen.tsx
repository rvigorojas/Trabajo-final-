import { useEffect, useState } from "react"
import type { ActivacionConConvocatoria, ReporteCierre } from "@pce/api-client"
import { apiClient } from "../apiClient"

function valorLegible(valor: unknown): string {
  if (typeof valor === "string" || typeof valor === "number") return String(valor)
  return JSON.stringify(valor, null, 2)
}

export function ReportesScreen() {
  const [activaciones, setActivaciones] = useState<ActivacionConConvocatoria[]>([])
  const [reportes, setReportes] = useState<Record<string, ReporteCierre>>({})

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
