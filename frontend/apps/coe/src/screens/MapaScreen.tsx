import { useState } from "react"
import type { ActivacionConConvocatoria, CapaMapa, MarcadorIncidente } from "@pce/api-client"
import { apiClient } from "../apiClient"
import { usePolling } from "../hooks/usePolling"
import { activacionActual } from "../lib/activacionActual"
import { DIMENSIONES_FOTO, coordenadaAPosicionEnFoto } from "../lib/georreferenciacion"

const CAPAS_ACTIVABLES: { capa: CapaMapa; etiqueta: string }[] = [
  { capa: "cuadricula", etiqueta: "Cuadrícula" },
  { capa: "incidente", etiqueta: "Incidente" },
  { capa: "accesos", etiqueta: "Accesos" },
]

/*
 * Sin proveedor de mapas real (spec.md, "Decisiones confirmadas" #4): sobre la foto satelital
 * (`georreferenciacion.ts`) solo se ubican los marcadores cuyo `coordenada_cuadricula` ya es
 * lat/lon real — el mapa cuadriculado en papel sigue sin georreferenciar (PRD sección 8). El
 * resto se sigue listando como fila de texto, igual que antes.
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

  const marcadoresVisibles = marcadores
    .filter((marcador) => capasActivas.has(marcador.capa))
    .map((marcador) => ({
      marcador,
      posicion: coordenadaAPosicionEnFoto(marcador.coordenada_cuadricula),
    }))
  const marcadoresConPosicion = marcadoresVisibles.filter(
    (m): m is { marcador: MarcadorIncidente; posicion: { xPct: number; yPct: number } } =>
      m.posicion !== null,
  )
  const marcadoresSinPosicion = marcadoresVisibles
    .filter((m) => m.posicion === null)
    .map((m) => m.marcador)

  return (
    <div className="p-4">
      <h1 className="text-headline-md font-headline">Mapa</h1>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Capas del mapa">
        {CAPAS_ACTIVABLES.map(({ capa, etiqueta }) => (
          <label
            key={capa}
            className="min-h-touch-target-min text-body-md flex items-center gap-1"
          >
            <input
              type="checkbox"
              checked={capasActivas.has(capa)}
              onChange={() => alternarCapa(capa)}
            />
            {etiqueta}
          </label>
        ))}
        <label className="min-h-touch-target-min text-body-md flex items-center gap-1 opacity-50">
          <input type="checkbox" checked={false} disabled />
          Unidades (fase 2)
        </label>
      </div>

      <div
        className="rounded-lg border-outline-variant relative mt-4 w-full overflow-hidden border"
        style={{ aspectRatio: `${DIMENSIONES_FOTO.ancho} / ${DIMENSIONES_FOTO.alto}` }}
      >
        <img
          src="/mapa-aijc-satelite.jpg"
          alt="Foto satelital del AIJC"
          className="h-full w-full object-cover"
        />
        {marcadoresConPosicion.map(({ marcador, posicion }) => (
          <div
            key={marcador.id}
            role="img"
            aria-label={`${marcador.tipo_incidente} (${marcador.capa})`}
            title={`${marcador.tipo_incidente} — ${marcador.coordenada_cuadricula}`}
            className="bg-alerta-iii border-on-surface absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow"
            style={{ left: `${posicion.xPct}%`, top: `${posicion.yPct}%` }}
          />
        ))}
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {marcadoresSinPosicion.map((marcador) => (
          <li key={marcador.id} className="text-body-md">
            {marcador.coordenada_cuadricula} — {marcador.tipo_incidente} ({marcador.capa})
          </li>
        ))}
      </ul>
    </div>
  )
}
