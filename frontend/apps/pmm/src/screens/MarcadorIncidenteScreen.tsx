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
 *
 * `coordenada_cuadricula` se captura por GPS de la tablet GETAC (Camino 2, decidido con Renzo
 * 2026-08-16: en vez de resolver el levantamiento del mapa cuadriculado en papel, los marcadores
 * nuevos usan la geolocalización de la tablet, ya paga y sin explotar — PRD sección 3). El campo
 * se llena solo al abrir la pantalla, en formato decimal "lat,lon" (el mismo que ya lee
 * `frontend/apps/coe/src/lib/georreferenciacion.ts` para ubicar el marcador en la foto satelital).
 * Si el GPS falla o no hay permiso (ej. dentro de un edificio), se ofrece un input manual como
 * respaldo — no se retira la referencia de cuadrícula en papel como último recurso.
 */

type EstadoUbicacion =
  | { estado: "capturando" }
  | { estado: "lista"; coordenada: string }
  | { estado: "error"; mensaje: string }

function capturarUbicacion(): Promise<EstadoUbicacion> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve({ estado: "error", mensaje: "Este dispositivo no tiene GPS disponible." })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        const { latitude, longitude } = posicion.coords
        resolve({
          estado: "lista",
          coordenada: `${latitude.toFixed(6)},${longitude.toFixed(6)}`,
        })
      },
      () => {
        resolve({
          estado: "error",
          mensaje: "No se pudo obtener la posición GPS. Reintentá o ingresala manualmente.",
        })
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  })
}

export function MarcadorIncidenteScreen() {
  const [activacion, setActivacion] = useState<ActivacionConConvocatoria | null>()
  const [ubicacion, setUbicacion] = useState<EstadoUbicacion>({ estado: "capturando" })
  const [coordenadaManual, setCoordenadaManual] = useState("")
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

  useEffect(() => {
    capturarUbicacion().then(setUbicacion)
  }, [])

  function reintentarUbicacion() {
    setUbicacion({ estado: "capturando" })
    capturarUbicacion().then(setUbicacion)
  }

  const coordenadaCuadricula =
    ubicacion.estado === "lista" ? ubicacion.coordenada : coordenadaManual

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
          {ubicacion.estado === "capturando" && (
            <p className="text-body-md" data-testid="ubicacion-capturando">
              Obteniendo posición GPS…
            </p>
          )}
          {ubicacion.estado === "lista" && (
            <div className="flex flex-col gap-1">
              <p className="text-body-md" data-testid="ubicacion-gps">
                Posición GPS: {ubicacion.coordenada}
              </p>
              <button
                type="button"
                onClick={reintentarUbicacion}
                className="min-h-touch-target-min w-fit rounded-DEFAULT border border-outline px-3 text-on-surface"
              >
                Volver a capturar posición
              </button>
            </div>
          )}
          {ubicacion.estado === "error" && (
            <div className="flex flex-col gap-2">
              <p className="text-body-md" role="alert">
                {ubicacion.mensaje}
              </p>
              <button
                type="button"
                onClick={reintentarUbicacion}
                className="min-h-touch-target-min w-fit rounded-DEFAULT border border-outline px-3 text-on-surface"
              >
                Reintentar GPS
              </button>
              <label className="text-body-md" htmlFor="coordenada-cuadricula-manual">
                Coordenada de cuadrícula (manual)
              </label>
              <input
                id="coordenada-cuadricula-manual"
                value={coordenadaManual}
                onChange={(event) => setCoordenadaManual(event.target.value)}
                required
                className="min-h-touch-target-min rounded-DEFAULT border border-outline bg-surface-container-low px-3 text-on-surface"
              />
            </div>
          )}

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
            disabled={enviando || ubicacion.estado === "capturando" || !coordenadaCuadricula}
            className="min-h-touch-target-min mt-2 rounded-DEFAULT bg-secondary px-4 text-on-secondary"
          >
            Registrar marcador
          </button>
        </form>
      )}
    </div>
  )
}
