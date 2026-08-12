import { useEffect, useState, type FormEvent } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import type { ActivacionConConvocatoria, Instancia } from "@pce/api-client"
import { apiClient } from "../apiClient"
import { activacionActual } from "../lib/activacionActual"

interface RelevoModalProps {
  onClose: () => void
}

export function RelevoModal({ onClose }: RelevoModalProps) {
  const [activacion, setActivacion] = useState<ActivacionConConvocatoria | null>()
  const [instancia, setInstancia] = useState<Instancia>("coe")
  const [responsableSaliente, setResponsableSaliente] = useState("")
  const [responsableEntrante, setResponsableEntrante] = useState("")
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    apiClient
      .apiFetch<ActivacionConConvocatoria[]>("/activaciones")
      .then((activaciones) => setActivacion(activacionActual(activaciones)))
  }, [])

  async function enviar(event: FormEvent) {
    event.preventDefault()
    if (!activacion) return
    setEnviando(true)
    await apiClient.apiFetch("/relevos-mando", {
      method: "POST",
      body: JSON.stringify({
        activacion_id: activacion.id,
        instancia,
        responsable_saliente: responsableSaliente,
        responsable_entrante: responsableEntrante,
        hora_evento: new Date().toISOString(),
      }),
    })
    setEnviando(false)
    onClose()
  }

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-80 -translate-x-1/2 -translate-y-1/2 rounded-DEFAULT bg-surface-container-high p-4">
          <Dialog.Title className="text-status-label">Relevo de mando</Dialog.Title>

          {activacion === undefined && <p className="text-body-md mt-2">Cargando…</p>}
          {activacion === null && (
            <p className="text-body-md mt-2">No hay una activación en curso.</p>
          )}
          {activacion && (
            <form onSubmit={enviar} className="mt-2 flex flex-col gap-2">
              <label className="text-body-md" htmlFor="relevo-instancia">
                Instancia
              </label>
              <select
                id="relevo-instancia"
                value={instancia}
                onChange={(event) => setInstancia(event.target.value as Instancia)}
              >
                <option value="coe">COE</option>
                <option value="pmm_ci">PMM</option>
              </select>

              <label className="text-body-md" htmlFor="relevo-saliente">
                Responsable saliente
              </label>
              <input
                id="relevo-saliente"
                value={responsableSaliente}
                onChange={(event) => setResponsableSaliente(event.target.value)}
                required
              />

              <label className="text-body-md" htmlFor="relevo-entrante">
                Responsable entrante
              </label>
              <input
                id="relevo-entrante"
                value={responsableEntrante}
                onChange={(event) => setResponsableEntrante(event.target.value)}
                required
              />

              <button
                type="submit"
                disabled={enviando}
                className="min-h-touch-target-min mt-2 rounded-DEFAULT bg-secondary text-on-secondary"
              >
                Confirmar relevo
              </button>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
