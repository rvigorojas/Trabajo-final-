import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import type {
  ActivacionConConvocatoria,
  EvaluacionInicial,
  MarcadorIncidente,
  RelevoMando,
  Usuario,
} from "@pce/api-client"
import { apiClient } from "../apiClient"
import { usePolling } from "../hooks/usePolling"
import { activacionActual } from "../lib/activacionActual"
import { ultimosEventos } from "../lib/ultimosEventos"

const CONVOCATORIA_ESPERADA = 3

function useCronometro(horaEvento: string | undefined) {
  const [transcurridoMs, setTranscurridoMs] = useState(0)

  useEffect(() => {
    if (!horaEvento) return
    const inicio = new Date(horaEvento).getTime()

    function tick() {
      setTranscurridoMs(Date.now() - inicio)
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [horaEvento])

  const totalSegundos = Math.max(0, Math.floor(transcurridoMs / 1000))
  const horas = String(Math.floor(totalSegundos / 3600)).padStart(2, "0")
  const minutos = String(Math.floor((totalSegundos % 3600) / 60)).padStart(2, "0")
  const segundos = String(totalSegundos % 60).padStart(2, "0")
  return `${horas}:${minutos}:${segundos}`
}

export function ResumenScreen() {
  const navigate = useNavigate()
  const [activacion, setActivacion] = useState<ActivacionConConvocatoria | null>()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionInicial[]>([])
  const [eventos, setEventos] = useState<ReturnType<typeof ultimosEventos>>([])
  const cronometro = useCronometro(activacion?.hora_evento)

  usePolling(async () => {
    const [activaciones, todosUsuarios] = await Promise.all([
      apiClient.apiFetch<ActivacionConConvocatoria[]>("/activaciones"),
      apiClient.apiFetch<Usuario[]>("/usuarios"),
    ])
    const actual = activacionActual(activaciones)
    setActivacion(actual)
    setUsuarios(todosUsuarios)

    if (!actual) return

    const [todasEvaluaciones, todosMarcadores, relevos] = await Promise.all([
      apiClient.apiFetch<EvaluacionInicial[]>("/evaluaciones-iniciales"),
      apiClient.apiFetch<MarcadorIncidente[]>("/marcadores-incidente"),
      apiClient.apiFetch<RelevoMando[]>(`/relevos-mando?activacion_id=${actual.id}`),
    ])
    const evaluacionesDeActivacion = todasEvaluaciones.filter(
      (evaluacion) => evaluacion.activacion_id === actual.id,
    )
    const marcadoresDeActivacion = todosMarcadores.filter(
      (marcador) => marcador.activacion_id === actual.id,
    )
    setEvaluaciones(evaluacionesDeActivacion)
    setEventos(
      ultimosEventos({
        evaluaciones: evaluacionesDeActivacion,
        marcadores: marcadoresDeActivacion,
        relevos,
        convocatoria: actual.convocatoria,
      }),
    )
  })

  useEffect(() => {
    if (activacion === null) {
      navigate("/cadena-de-mando", { replace: true })
    }
  }, [activacion, navigate])

  if (!activacion) {
    return <h1 className="text-headline-md font-headline p-4">Resumen</h1>
  }

  const usuarioPorId = new Map(usuarios.map((usuario) => [usuario.id, usuario]))
  const confirmadosPor = (instancia: "coe" | "pmm") =>
    activacion.convocatoria.filter(
      (miembro) =>
        miembro.hora_confirmacion !== null &&
        usuarioPorId.get(miembro.usuario_id)?.instancia_principal === instancia,
    ).length

  return (
    <div className="p-4">
      <h1 className="text-headline-md font-headline">Resumen</h1>

      <p className="text-status-label mt-2">
        Alerta {activacion.nivel_alerta} — {activacion.tipo_incidente}
      </p>
      <p className="text-timer-display font-mono mt-2" data-testid="cronometro">
        {cronometro}
      </p>
      <p className="text-body-md mt-2">
        Convocatoria COE {confirmadosPor("coe")}/{CONVOCATORIA_ESPERADA} · PMM{" "}
        {confirmadosPor("pmm")}/{CONVOCATORIA_ESPERADA}
      </p>

      {evaluaciones[0] && (
        <p className="text-body-md mt-2" data-testid="evaluacion-resumen">
          Evaluación inicial: {evaluaciones[0].magnitud}
        </p>
      )}

      <h2 className="text-status-label mt-4">Últimos eventos</h2>
      <ul className="mt-2 flex flex-col gap-1">
        {eventos.map((evento) => (
          <li key={`${evento.tipo}-${evento.hora_recepcion}`} className="text-body-md">
            {evento.descripcion}
          </li>
        ))}
      </ul>
    </div>
  )
}
