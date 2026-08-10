import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router"
import { routes } from "../router"

describe("MenuAparte", () => {
  it("navega a /pre-pai y esa ruta no aparece como tab principal", async () => {
    const user = userEvent.setup()
    const router = createMemoryRouter(routes, { initialEntries: ["/resumen"] })
    render(<RouterProvider router={router} />)

    await user.click(screen.getByRole("button", { name: "Más opciones" }))
    await user.click(await screen.findByText("Pre-PAI"))

    expect(router.state.location.pathname).toBe("/pre-pai")
    expect(screen.getByRole("heading", { name: "Pre-PAI" })).toBeInTheDocument()
    expect(screen.queryByRole("tab", { name: "Pre-PAI" })).not.toBeInTheDocument()
  })
})
