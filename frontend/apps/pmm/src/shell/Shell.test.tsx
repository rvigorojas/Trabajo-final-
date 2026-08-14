import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router"
import { getClaims } from "@pce/api-client"
import { routes } from "../router"
import { agregarACola, listarCola, quitarDeCola } from "../offline/db"
import { EVENTO_CAMBIO_COLA } from "../offline/colaOffline"

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
  beforeEach(async () => {
    for (const entrada of await listarCola()) {
      await quitarDeCola(entrada.id)
    }
  })

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

  it("con el rol correcto, muestra el enlace a Relevo de mando", () => {
    vi.mocked(getClaims).mockReturnValue({
      sub: "1",
      rol: "jefe_rescate",
      instancia_principal: "pmm",
    })

    renderAt("/nueva-activacion")

    expect(screen.getByRole("link", { name: "Relevo de mando" })).toBeInTheDocument()
  })

  it("sin cola pendiente, no muestra el contador; con cola pendiente, muestra el conteo", async () => {
    vi.mocked(getClaims).mockReturnValue(null)

    renderAt("/nueva-activacion")
    expect(screen.queryByTestId("contador-sin-sincronizar")).not.toBeInTheDocument()

    await agregarACola({ id: "x1", path: "/marcadores-incidente", body: {}, encoladoEn: Date.now() })
    window.dispatchEvent(new Event(EVENTO_CAMBIO_COLA))

    expect(await screen.findByTestId("contador-sin-sincronizar")).toHaveTextContent(
      "1 sin sincronizar",
    )
  })
})
