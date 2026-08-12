import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { createMemoryRouter, RouterProvider } from "react-router"
import { BASE_URL, server } from "../mocks/server"
import { routes } from "../router"

const prePAIs = [
  {
    id: "p1",
    nombre_escenario: "Derrame de combustible",
    sector: "Plataforma norte",
    tipo_emergencia: "matpel",
    caracterizacion: "Derrame menor de combustible de aeronave",
    riesgos: "Incendio, contaminación",
    contactos_emergencia: "Central MATPEL",
    recursos: "Kit de contención",
    estrategias_control: "Contener y neutralizar",
    plano_acceso: null,
    dimensiones_escenario: null,
  },
  {
    id: "p2",
    nombre_escenario: "Incendio en hangar",
    sector: "Hangar 3",
    tipo_emergencia: "aeronautica",
    caracterizacion: "Incendio estructural en hangar de mantenimiento",
    riesgos: null,
    contactos_emergencia: null,
    recursos: null,
    estrategias_control: null,
    plano_acceso: null,
    dimensiones_escenario: null,
  },
]

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

describe("PrePAIScreen", () => {
  it("lista los Pre-PAI y muestra el detalle al seleccionar uno", async () => {
    const user = userEvent.setup()
    server.use(http.get(`${BASE_URL}/pre-pai`, () => HttpResponse.json(prePAIs)))

    renderAt("/pre-pai")

    expect(await screen.findByText("Derrame de combustible — Plataforma norte")).toBeInTheDocument()
    expect(screen.getByText("Incendio en hangar — Hangar 3")).toBeInTheDocument()
    expect(screen.queryByTestId("detalle-pre-pai")).not.toBeInTheDocument()

    await user.click(screen.getByText("Derrame de combustible — Plataforma norte"))

    const detalle = screen.getByTestId("detalle-pre-pai")
    expect(detalle).toHaveTextContent("Derrame menor de combustible de aeronave")
    expect(detalle).toHaveTextContent("Central MATPEL")
  })
})
