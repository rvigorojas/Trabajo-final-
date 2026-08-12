import { useEffect, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import type { ActivacionConConvocatoria } from "@pce/api-client"
import { apiClient } from "../apiClient"
import { activacionActual } from "../lib/activacionActual"

interface DesactivarModalProps {
  onClose: () => void
}

export function DesactivarModal({ onClose }: DesactivarModalProps) {
  const [activacion, setActivacion] = useState<ActivacionConConvocatoria | null>()
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    apiClient
      .apiFetch<ActivacionConConvocatoria[]>("/activaciones")
      .then((activaciones) => setActivacion(activacionActual(activaciones)))
  }, [])

  async function confirmar() {
    if (!activacion) return
    setEnviando(true)
    await apiClient.apiFetch(`/activaciones/${activacion.id}/desactivar`, { method: "POST" })
    setEnviando(false)
    onClose()
  }

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-80 -translate-x-1/2 -translate-y-1/2 rounded-DEFAULT bg-surface-container-high p-4">
          <Dialog.Title className="text-status-label">Desactivar activación</Dialog.Title>

          {activacion === undefined && <p className="text-body-md mt-2">Cargando…</p>}
          {activacion === null && (
            <p className="text-body-md mt-2">No hay una activación en curso.</p>
          )}
          {activacion && (
            <>
              <p className="text-body-md mt-2">
                ¿Confirmás desactivar "{activacion.tipo_incidente}"?
              </p>
              <div className="mt-4 flex gap-2">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="min-h-touch-target-min rounded-DEFAULT px-4 text-on-surface"
                  >
                    Cancelar
                  </button>
                </Dialog.Close>
                <button
                  type="button"
                  disabled={enviando}
                  onClick={confirmar}
                  className="min-h-touch-target-min rounded-DEFAULT bg-error px-4 text-on-error"
                >
                  Confirmar
                </button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
