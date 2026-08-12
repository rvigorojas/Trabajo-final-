import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router"
import { getClaims } from "@pce/api-client"
import { routes } from "../router"

vi.mock("@pce/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@pce/api-client")>()),
  getClaims: vi.fn(),
}))

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

describe("Shell (pmm)", () => {
  it("con el rol correcto, muestra el enlace a Evaluación inicial y navega", async () => {
    const user = userEvent.setup()
    vi.mocked(getClaims).mockReturnValue({
      sub: "1",
      rol: "jefe_rescate",
      instancia_principal: "pmm",
    })

    const router = renderAt("/nueva-activacion")

    await user.click(screen.getByRole("link", { name: "Evaluación inicial" }))

    expect(router.state.location.pathname).toBe("/evaluacion-inicial")
    expect(screen.getByRole("heading", { name: "Evaluación inicial" })).toBeInTheDocument()
  })

  it("sin el rol correcto, el enlace a Evaluación inicial no aparece", () => {
    vi.mocked(getClaims).mockReturnValue({
      sub: "2",
      rol: "bombero_aeronautico",
      instancia_principal: "pmm",
    })

    renderAt("/nueva-activacion")

    expect(screen.queryByRole("link", { name: "Evaluación inicial" })).not.toBeInTheDocument()
  })

  it("la raíz redirige a /nueva-activacion", () => {
    vi.mocked(getClaims).mockReturnValue(null)

    renderAt("/")

    expect(screen.getByRole("heading", { name: "Nueva activación" })).toBeInTheDocument()
  })
})
