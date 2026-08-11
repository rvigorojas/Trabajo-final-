import { describe, expect, it } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { createMemoryRouter, RouterProvider } from "react-router"
import { BASE_URL, server } from "../mocks/server"
import { routes } from "../router"

const activacionActiva = {
  id: "a1",
  tipo_emergencia: "aeronautica",
  nivel_alerta: "II",
  clasificacion_origen: null,
  tipo_alerta: 5,
  tipo_incidente: "incendio en pista",
  estado: "activa",
  hora_evento: new Date(Date.now() - 65_000).toISOString(),
  hora_recepcion: new Date(Date.now() - 64_000).toISOString(),
  convocatoria: [
    { id: "c1", activacion_id: "a1", usuario_id: "u-coe", rol: "duty_manager", hora_confirmacion: "2026-08-10T10:00:00Z" },
    { id: "c2", activacion_id: "a1", usuario_id: "u-pmm", rol: "jefe_rescate", hora_confirmacion: null },
  ],
}

const usuarios = [
  { id: "u-coe", nombre: "Ana", username: "ana", rol: "duty_manager", instancia_principal: "coe", contacto: null, activo: true },
  { id: "u-pmm", nombre: "Beto", username: "beto", rol: "jefe_rescate", instancia_principal: "pmm", contacto: null, activo: true },
]

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

describe("ResumenScreen", () => {
  it("con activación activa muestra alerta, cronómetro, convocatoria y evaluación inicial", async () => {
    server.use(
      http.get(`${BASE_URL}/activaciones`, () => HttpResponse.json([activacionActiva])),
      http.get(`${BASE_URL}/usuarios`, () => HttpResponse.json(usuarios)),
      http.get(`${BASE_URL}/evaluaciones-iniciales`, () =>
        HttpResponse.json([
          {
            id: "e1",
            activacion_id: "a1",
            magnitud: "alta",
            riesgos_secundarios: null,
            hora_evento: "2026-08-10T10:00:00Z",
            hora_recepcion: "2026-08-10T10:00:05Z",
          },
        ]),
      ),
    )

    renderAt("/resumen")

    expect(await screen.findByText("Alerta II — incendio en pista")).toBeInTheDocument()
    expect(screen.getByText("Convocatoria COE 1/3 · PMM 0/3")).toBeInTheDocument()
    expect(screen.getByTestId("evaluacion-resumen")).toHaveTextContent("Evaluación inicial: alta")
    await waitFor(() => {
      expect(screen.getByTestId("cronometro").textContent).toMatch(/^\d{2}:\d{2}:\d{2}$/)
      expect(screen.getByTestId("cronometro").textContent).not.toBe("00:00:00")
    })
  })

  it("sin activación activa redirige a Cadena de mando", async () => {
    server.use(http.get(`${BASE_URL}/activaciones`, () => HttpResponse.json([])))

    const router = renderAt("/resumen")

    expect(await screen.findByRole("heading", { name: "Cadena de mando" })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe("/cadena-de-mando")
  })
})
