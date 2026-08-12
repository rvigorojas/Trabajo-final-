import { useEffect, useState } from "react"
import type { PrePAI } from "@pce/api-client"
import { apiClient } from "../apiClient"

const CAMPOS_DETALLE: { campo: keyof PrePAI; etiqueta: string }[] = [
  { campo: "caracterizacion", etiqueta: "Caracterización" },
  { campo: "riesgos", etiqueta: "Riesgos" },
  { campo: "contactos_emergencia", etiqueta: "Contactos de emergencia" },
  { campo: "recursos", etiqueta: "Recursos" },
  { campo: "estrategias_control", etiqueta: "Estrategias de control" },
  { campo: "plano_acceso", etiqueta: "Plano de acceso" },
  { campo: "dimensiones_escenario", etiqueta: "Dimensiones del escenario" },
]

/*
 * Solo lectura en este ítem (spec.md, "Decisiones confirmadas" #1): "Activar" con precarga real
 * hacia el formulario de evaluación inicial es el ítem #9 (Cliente PMM).
 */
export function PrePAIScreen() {
  const [prePAIs, setPrePAIs] = useState<PrePAI[]>([])
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    apiClient.apiFetch<PrePAI[]>("/pre-pai").then((datos) => {
      if (!cancelado) setPrePAIs(datos)
    })
    return () => {
      cancelado = true
    }
  }, [])

  const seleccionado = prePAIs.find((prePAI) => prePAI.id === seleccionadoId) ?? null

  return (
    <div className="p-4">
      <h1 className="text-headline-md font-headline">Pre-PAI</h1>

      <ul className="mt-4 flex flex-col gap-2">
        {prePAIs.map((prePAI) => (
          <li key={prePAI.id}>
            <button
              type="button"
              className="text-body-md underline"
              onClick={() => setSeleccionadoId(prePAI.id)}
            >
              {prePAI.nombre_escenario} — {prePAI.sector}
            </button>
          </li>
        ))}
      </ul>

      {seleccionado && (
        <div className="mt-4" data-testid="detalle-pre-pai">
          <h2 className="text-status-label">{seleccionado.nombre_escenario}</h2>
          {CAMPOS_DETALLE.map(({ campo, etiqueta }) =>
            seleccionado[campo] ? (
              <p key={campo} className="text-body-md mt-1">
                {etiqueta}: {seleccionado[campo]}
              </p>
            ) : null,
          )}
        </div>
      )}
    </div>
  )
}
