import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { getClaims } from "@pce/api-client"
import { FloatingActions } from "./FloatingActions"

vi.mock("@pce/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@pce/api-client")>()),
  getClaims: vi.fn(),
}))

describe("FloatingActions", () => {
  it("con un rol en ambas listas (duty_manager) muestra Relevo y Desactivar", () => {
    vi.mocked(getClaims).mockReturnValue({
      sub: "1",
      rol: "duty_manager",
      instancia_principal: "coe",
    })

    render(<FloatingActions />)

    expect(screen.getByRole("button", { name: "Relevo de mando" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Desactivar" })).toBeInTheDocument()
  })

  it("con un rol fuera de ambas listas (bombero_aeronautico) no muestra ningún botón", () => {
    vi.mocked(getClaims).mockReturnValue({
      sub: "2",
      rol: "bombero_aeronautico",
      instancia_principal: "pmm",
    })

    render(<FloatingActions />)

    expect(screen.queryByRole("button", { name: "Relevo de mando" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Desactivar" })).not.toBeInTheDocument()
  })

  it("sin sesión (getClaims null) no muestra ningún botón", () => {
    vi.mocked(getClaims).mockReturnValue(null)

    render(<FloatingActions />)

    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("clickear Relevo de mando abre RelevoModal", async () => {
    const user = userEvent.setup()
    vi.mocked(getClaims).mockReturnValue({
      sub: "1",
      rol: "duty_manager",
      instancia_principal: "coe",
    })

    render(<FloatingActions />)
    await user.click(screen.getByRole("button", { name: "Relevo de mando" }))

    expect(await screen.findByRole("dialog")).toHaveTextContent("Relevo de mando")
  })

  it("clickear Desactivar abre DesactivarModal", async () => {
    const user = userEvent.setup()
    vi.mocked(getClaims).mockReturnValue({
      sub: "1",
      rol: "duty_manager",
      instancia_principal: "coe",
    })

    render(<FloatingActions />)
    await user.click(screen.getByRole("button", { name: "Desactivar" }))

    expect(await screen.findByRole("dialog")).toHaveTextContent("Desactivar activación")
  })
})
