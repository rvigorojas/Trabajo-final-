import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useRegisterSW } from "virtual:pwa-register/react"
import { ActualizacionDisponible } from "./ActualizacionDisponible"

vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: vi.fn(),
}))

describe("ActualizacionDisponible", () => {
  it("con needRefresh en true muestra el aviso y dispara updateServiceWorker al confirmar", async () => {
    const user = userEvent.setup()
    const updateServiceWorker = vi.fn()
    vi.mocked(useRegisterSW).mockReturnValue({
      needRefresh: [true, vi.fn()],
      offlineReady: [false, vi.fn()],
      updateServiceWorker,
    })

    render(<ActualizacionDisponible />)

    expect(screen.getByText("Actualización disponible")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Reiniciar para aplicar" }))
    expect(updateServiceWorker).toHaveBeenCalledWith(true)
  })

  it("con needRefresh en false no renderiza nada", () => {
    vi.mocked(useRegisterSW).mockReturnValue({
      needRefresh: [false, vi.fn()],
      offlineReady: [false, vi.fn()],
      updateServiceWorker: vi.fn(),
    })

    const { container } = render(<ActualizacionDisponible />)

    expect(container).toBeEmptyDOMElement()
  })
})
