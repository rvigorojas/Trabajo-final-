import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
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
  hora_evento: "2026-08-10T10:00:00Z",
  hora_recepcion: "2026-08-10T10:00:01Z",
  convocatoria: [],
}

const marcadorDeLaActivacionActual = {
  id: "m1",
  activacion_id: "a1",
  coordenada_cuadricula: "C4",
  tipo_incidente: "fuego focalizado",
  riesgo: null,
  capa: "incidente",
  estado_sincronizado: true,
  hora_evento: "2026-08-10T10:05:00Z",
  hora_recepcion: "2026-08-10T10:05:01Z",
}

const marcadorDeOtraActivacion = {
  ...marcadorDeLaActivacionActual,
  id: "m2",
  activacion_id: "a-otra",
  coordenada_cuadricula: "Z9",
}

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

describe("MapaScreen", () => {
  it("filtra marcadores por la activación en curso", async () => {
    server.use(
      http.get(`${BASE_URL}/activaciones`, () => HttpResponse.json([activacionActiva])),
      http.get(`${BASE_URL}/marcadores-incidente`, () =>
        HttpResponse.json([marcadorDeLaActivacionActual, marcadorDeOtraActivacion]),
      ),
    )

    renderAt("/mapa")

    expect(await screen.findByText(/C4 — fuego focalizado/)).toBeInTheDocument()
    expect(screen.queryByText(/Z9/)).not.toBeInTheDocument()
  })

  it("desactivar una capa oculta sus marcadores", async () => {
    const user = userEvent.setup()
    server.use(
      http.get(`${BASE_URL}/activaciones`, () => HttpResponse.json([activacionActiva])),
      http.get(`${BASE_URL}/marcadores-incidente`, () =>
        HttpResponse.json([marcadorDeLaActivacionActual]),
      ),
    )

    renderAt("/mapa")

    expect(await screen.findByText(/C4 — fuego focalizado/)).toBeInTheDocument()
    await user.click(screen.getByRole("checkbox", { name: "Incidente" }))
    expect(screen.queryByText(/C4 — fuego focalizado/)).not.toBeInTheDocument()
  })

  it("un marcador con lat/lon real se ubica como pin sobre la foto, no en la lista de texto", async () => {
    const marcadorGeorreferenciado = {
      ...marcadorDeLaActivacionActual,
      id: "m3",
      coordenada_cuadricula: `12°02'28.5"S 77°06'28.6"W`,
    }
    server.use(
      http.get(`${BASE_URL}/activaciones`, () => HttpResponse.json([activacionActiva])),
      http.get(`${BASE_URL}/marcadores-incidente`, () =>
        HttpResponse.json([marcadorGeorreferenciado]),
      ),
    )

    renderAt("/mapa")

    expect(await screen.findByRole("img", { name: /fuego focalizado/ })).toBeInTheDocument()
    expect(screen.queryByText(/12°02'28.5"S/)).not.toBeInTheDocument()
  })

  it("sin activación activa no muestra marcadores ni redirige", async () => {
    server.use(
      http.get(`${BASE_URL}/activaciones`, () => HttpResponse.json([])),
      http.get(`${BASE_URL}/marcadores-incidente`, () => HttpResponse.json([])),
    )

    renderAt("/mapa")

    expect(await screen.findByRole("heading", { name: "Mapa" })).toBeInTheDocument()
  })
})
