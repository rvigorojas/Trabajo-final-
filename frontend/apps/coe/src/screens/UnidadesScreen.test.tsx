import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { createMemoryRouter, RouterProvider } from "react-router"
import { BASE_URL, server } from "../mocks/server"
import { routes } from "../router"

const unidades = [
  { identificador: "R1", estado: "ok", hora_recepcion: "2026-08-10T10:00:00Z" },
  { identificador: "R2", estado: "fuera_de_servicio", hora_recepcion: "2026-08-10T09:00:00Z" },
]

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

describe("UnidadesScreen", () => {
  it("cambiar el estado de una unidad dispara PUT /unidades/{id} con el estado correcto", async () => {
    const user = userEvent.setup()
    let cuerpoRecibido: unknown = null

    server.use(
      http.get(`${BASE_URL}/unidades`, () => HttpResponse.json(unidades)),
      http.put(`${BASE_URL}/unidades/R1`, async ({ request }) => {
        cuerpoRecibido = await request.json()
        return HttpResponse.json({
          identificador: "R1",
          estado: "fuera_de_servicio",
          hora_recepcion: "2026-08-10T10:10:00Z",
        })
      }),
    )

    renderAt("/unidades")

    const selectR1 = await screen.findByLabelText("Estado de R1")
    await user.selectOptions(selectR1, "Fuera de servicio")

    expect(cuerpoRecibido).toEqual({ estado: "fuera_de_servicio" })
  })
})
