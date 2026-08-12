import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { createMemoryRouter, RouterProvider } from "react-router"
import { BASE_URL, server } from "../mocks/server"
import { routes } from "../router"

const activaciones = [
  {
    id: "a1",
    tipo_emergencia: "aeronautica",
    nivel_alerta: "II",
    clasificacion_origen: null,
    tipo_alerta: 5,
    tipo_incidente: "incendio en pista",
    estado: "cerrada",
    hora_evento: "2026-08-10T10:00:00Z",
    hora_recepcion: "2026-08-10T10:00:01Z",
    convocatoria: [],
  },
  {
    id: "a2",
    tipo_emergencia: "aeronautica",
    nivel_alerta: "I",
    clasificacion_origen: null,
    tipo_alerta: 2,
    tipo_incidente: "activación en curso",
    estado: "activa",
    hora_evento: "2026-08-11T10:00:00Z",
    hora_recepcion: "2026-08-11T10:00:01Z",
    convocatoria: [],
  },
]

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

describe("ReportesScreen", () => {
  it("solo lista activaciones cerradas y muestra el reporte generado al pedirlo", async () => {
    const user = userEvent.setup()
    server.use(
      http.get(`${BASE_URL}/activaciones`, () => HttpResponse.json(activaciones)),
      http.post(`${BASE_URL}/reportes-cierre`, () =>
        HttpResponse.json({
          id: "r1",
          activacion_id: "a1",
          tipo_emergencia: "aeronautica",
          generado_en: "2026-08-11T12:00:00Z",
          datos: { tipo_incidente: "incendio en pista", nivel_alerta: "II" },
        }),
      ),
    )

    renderAt("/reportes")

    expect(await screen.findByText("incendio en pista")).toBeInTheDocument()
    expect(screen.queryByText("activación en curso")).not.toBeInTheDocument()

    await user.click(screen.getByText("Ver reporte"))

    const reporte = await screen.findByTestId("reporte-a1")
    expect(reporte).toHaveTextContent("nivel_alerta")
    expect(reporte).toHaveTextContent("II")
  })
})
