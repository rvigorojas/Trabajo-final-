import { useEffect, useState } from "react"
import type { ActivacionConConvocatoria, RelevoMando } from "@pce/api-client"
import { apiClient } from "../apiClient"
import { activacionActual } from "../lib/activacionActual"

/*
 * Sin activación en curso, muestra el histórico completo sin filtrar (decisión confirmada del
 * usuario, tasks/item-03-resumen-cadena-mando/spec.md) — es el destino del redirect de Resumen.
 */
export function CadenaDeMandoScreen() {
  const [relevos, setRelevos] = useState<RelevoMando[] | null>(null)

  useEffect(() => {
    let cancelado = false

    async function cargar() {
      const activaciones = await apiClient.apiFetch<ActivacionConConvocatoria[]>("/activaciones")
      const actual = activacionActual(activaciones)
      const query = actual ? `?activacion_id=${actual.id}` : ""
      const datos = await apiClient.apiFetch<RelevoMando[]>(`/relevos-mando${query}`)
      if (!cancelado) setRelevos(datos)
    }

    cargar()
    return () => {
      cancelado = true
    }
  }, [])

  if (relevos === null) {
    return <h1 className="text-headline-md font-headline p-4">Cadena de mando</h1>
  }

  const coe = relevos.filter((relevo) => relevo.instancia === "coe")
  const pmm = relevos.filter((relevo) => relevo.instancia === "pmm_ci")

  return (
    <div className="p-4">
      <h1 className="text-headline-md font-headline">Cadena de mando</h1>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <section aria-label="Carril COE">
          <h2 className="text-status-label">COE</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {coe.map((relevo) => (
              <li key={relevo.id} className="text-body-md">
                {relevo.responsable_saliente} → {relevo.responsable_entrante}
              </li>
            ))}
          </ul>
        </section>
        <section aria-label="Carril PMM">
          <h2 className="text-status-label">PMM</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {pmm.map((relevo) => (
              <li key={relevo.id} className="text-body-md">
                {relevo.responsable_saliente} → {relevo.responsable_entrante}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
