import { useState, type FormEvent } from "react"
import type { ActivacionConConvocatoria, NivelAlerta, TipoEmergencia } from "@pce/api-client"
import { payloadActivacion } from "../lib/payloadActivacion"
import { enviarOEncolar } from "../offline/colaOffline"

const CLASIFICACIONES: Record<Exclude<TipoEmergencia, "aeronautica">, string[]> = {
  epidemiologica: ["EMERGENCIA", "URGENCIA", "CONSULTA"],
  estructural_incidentes: ["Estructural", "Incidente"],
  matpel: Array.from({ length: 9 }, (_, i) => `Clase ${i + 1}`),
}

const CATEGORIAS: { valor: TipoEmergencia; etiqueta: string }[] = [
  { valor: "aeronautica", etiqueta: "Aeronáutica" },
  { valor: "epidemiologica", etiqueta: "Epidemiológica" },
  { valor: "estructural_incidentes", etiqueta: "Estructural / Incidentes" },
  { valor: "matpel", etiqueta: "MATPEL" },
]

export function NuevaActivacionScreen() {
  const [categoria, setCategoria] = useState<TipoEmergencia>("aeronautica")
  const [nivelAlerta, setNivelAlerta] = useState<NivelAlerta>("I")
  const [tipoAlerta, setTipoAlerta] = useState(1)
  const [clasificacionOrigen, setClasificacionOrigen] = useState(CLASIFICACIONES.epidemiologica[0])
  const [tipoIncidente, setTipoIncidente] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [creada, setCreada] = useState<ActivacionConConvocatoria | null>(null)
  const [encolada, setEncolada] = useState(false)

  async function enviar(event: FormEvent) {
    event.preventDefault()
    setEnviando(true)
    const body = payloadActivacion({
      id: crypto.randomUUID(),
      categoria,
      tipoIncidente,
      horaEvento: new Date().toISOString(),
      nivelAlerta: categoria === "aeronautica" ? nivelAlerta : undefined,
      tipoAlerta: categoria === "aeronautica" ? tipoAlerta : undefined,
      clasificacionOrigen: categoria !== "aeronautica" ? clasificacionOrigen : undefined,
    })
    const respuesta = await enviarOEncolar<ActivacionConConvocatoria>("/activaciones", body)
    setEnviando(false)
    if (respuesta) {
      setCreada(respuesta)
    } else {
      setEncolada(true)
    }
  }

  if (encolada) {
    return (
      <div className="p-4">
        <h1 className="text-headline-md font-headline">Activación sin sincronizar</h1>
        <p className="text-body-md mt-2">
          Se guardó localmente y se enviará sola al reconectar.
        </p>
        <button
          type="button"
          onClick={() => setEncolada(false)}
          className="min-h-touch-target-min mt-4 rounded-DEFAULT bg-secondary px-4 text-on-secondary"
        >
          Nueva activación
        </button>
      </div>
    )
  }

  if (creada) {
    return (
      <div className="p-4">
        <h1 className="text-headline-md font-headline">Activación creada</h1>
        <p className="text-body-md mt-2">{creada.tipo_incidente}</p>
        <p className="text-body-md mt-2">Convocados: {creada.convocatoria.length}</p>
        <button
          type="button"
          onClick={() => setCreada(null)}
          className="min-h-touch-target-min mt-4 rounded-DEFAULT bg-secondary px-4 text-on-secondary"
        >
          Nueva activación
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-2 p-4">
      <h1 className="text-headline-md font-headline">Nueva activación</h1>

      <label className="text-body-md" htmlFor="categoria">
        Categoría de emergencia
      </label>
      <select
        id="categoria"
        value={categoria}
        onChange={(event) => setCategoria(event.target.value as TipoEmergencia)}
      >
        {CATEGORIAS.map(({ valor, etiqueta }) => (
          <option key={valor} value={valor}>
            {etiqueta}
          </option>
        ))}
      </select>

      {categoria === "aeronautica" ? (
        <>
          <label className="text-body-md" htmlFor="nivel-alerta">
            Nivel de alerta
          </label>
          <select
            id="nivel-alerta"
            value={nivelAlerta}
            onChange={(event) => setNivelAlerta(event.target.value as NivelAlerta)}
          >
            <option value="I">I</option>
            <option value="II">II</option>
            <option value="III">III</option>
          </select>

          <label className="text-body-md" htmlFor="tipo-alerta">
            Tipo de alerta
          </label>
          <input
            id="tipo-alerta"
            type="number"
            min={1}
            max={10}
            value={tipoAlerta}
            onChange={(event) => setTipoAlerta(Number(event.target.value))}
          />
        </>
      ) : (
        <>
          <label className="text-body-md" htmlFor="clasificacion-origen">
            Clasificación
          </label>
          <select
            id="clasificacion-origen"
            value={clasificacionOrigen}
            onChange={(event) => setClasificacionOrigen(event.target.value)}
          >
            {CLASIFICACIONES[categoria as Exclude<TipoEmergencia, "aeronautica">].map((valor) => (
              <option key={valor} value={valor}>
                {valor}
              </option>
            ))}
          </select>
        </>
      )}

      <label className="text-body-md" htmlFor="tipo-incidente">
        Tipo de incidente
      </label>
      <input
        id="tipo-incidente"
        value={tipoIncidente}
        onChange={(event) => setTipoIncidente(event.target.value)}
        required
      />

      <p className="text-body-md mt-2">
        La convocatoria de COE y PMM se genera automáticamente al enviar.
      </p>

      <button
        type="submit"
        disabled={enviando}
        className="min-h-touch-target-min mt-2 rounded-DEFAULT bg-secondary px-4 text-on-secondary"
      >
        Activar
      </button>
    </form>
  )
}
