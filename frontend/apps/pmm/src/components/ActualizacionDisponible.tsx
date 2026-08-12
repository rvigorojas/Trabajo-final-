import { useRegisterSW } from "virtual:pwa-register/react"

/*
 * registerType "prompt" (ADR-4): nunca aplicar una versión nueva del PWA en silencio — avisar y
 * dejar que el usuario dispare el reload explícitamente.
 */
export function ActualizacionDisponible() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed inset-x-0 bottom-0 flex items-center justify-between bg-surface-container-highest p-4">
      <p className="text-body-md">Actualización disponible</p>
      <button
        type="button"
        onClick={() => updateServiceWorker(true)}
        className="min-h-touch-target-min rounded-DEFAULT bg-secondary px-4 text-on-secondary"
      >
        Reiniciar para aplicar
      </button>
    </div>
  )
}
