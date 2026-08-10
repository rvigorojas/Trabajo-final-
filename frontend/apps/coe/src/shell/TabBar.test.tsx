import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router"
import { routes } from "../router"

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

describe("TabBar", () => {
  it("marca como activa la tab de la ruta actual", () => {
    renderAt("/mapa")

    expect(screen.getByRole("heading", { name: "Mapa" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Mapa" })).toHaveAttribute("data-state", "active")
    expect(screen.getByRole("tab", { name: "Resumen" })).toHaveAttribute("data-state", "inactive")
  })

  it("click en una tab navega a su ruta y cambia el contenido", async () => {
    const user = userEvent.setup()
    const router = renderAt("/resumen")

    await user.click(screen.getByRole("tab", { name: "Unidades" }))

    expect(router.state.location.pathname).toBe("/unidades")
    expect(screen.getByRole("heading", { name: "Unidades" })).toBeInTheDocument()
  })

  it("redirige la raíz a /resumen", () => {
    renderAt("/")

    expect(screen.getByRole("heading", { name: "Resumen" })).toBeInTheDocument()
  })
})
