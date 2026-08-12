import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { BASE_URL, server } from "../mocks/server"
import { NuevaActivacionScreen } from "./NuevaActivacionScreen"

describe("NuevaActivacionScreen", () => {
  it("aeronautica: envia nivel_alerta/tipo_alerta y muestra la convocatoria de la respuesta", async () => {
    const user = userEvent.setup()
    let cuerpoRecibido: unknown = null

    server.use(
      http.post(`${BASE_URL}/activaciones`, async ({ request }) => {
        cuerpoRecibido = await request.json()
        return HttpResponse.json(
          {
            id: "a1",
            tipo_emergencia: "aeronautica",
            nivel_alerta: "II",
            clasificacion_origen: null,
            tipo_alerta: 5,
            tipo_incidente: "incendio en pista",
            estado: "activa",
            hora_evento: "2026-08-11T10:00:00Z",
            hora_recepcion: "2026-08-11T10:00:01Z",
            convocatoria: [{ id: "c1" }, { id: "c2" }],
          },
          { status: 201 },
        )
      }),
    )

    render(<NuevaActivacionScreen />)

    await user.selectOptions(screen.getByLabelText("Nivel de alerta"), "II")
    await user.clear(screen.getByLabelText("Tipo de alerta"))
    await user.type(screen.getByLabelText("Tipo de alerta"), "5")
    await user.type(screen.getByLabelText("Tipo de incidente"), "incendio en pista")
    await user.click(screen.getByRole("button", { name: "Activar" }))

    expect(cuerpoRecibido).toMatchObject({
      tipo_emergencia: "aeronautica",
      nivel_alerta: "II",
      tipo_alerta: 5,
      tipo_incidente: "incendio en pista",
    })
    expect(cuerpoRecibido).not.toHaveProperty("clasificacion_origen")
    expect(await screen.findByText("Convocados: 2")).toBeInTheDocument()
  })

  it("matpel: envia clasificacion_origen sin nivel_alerta/tipo_alerta", async () => {
    const user = userEvent.setup()
    let cuerpoRecibido: unknown = null

    server.use(
      http.post(`${BASE_URL}/activaciones`, async ({ request }) => {
        cuerpoRecibido = await request.json()
        return HttpResponse.json(
          {
            id: "a2",
            tipo_emergencia: "matpel",
            nivel_alerta: "III",
            clasificacion_origen: "Clase 3",
            tipo_alerta: null,
            tipo_incidente: "derrame de combustible",
            estado: "activa",
            hora_evento: "2026-08-11T10:00:00Z",
            hora_recepcion: "2026-08-11T10:00:01Z",
            convocatoria: [],
          },
          { status: 201 },
        )
      }),
    )

    render(<NuevaActivacionScreen />)

    await user.selectOptions(screen.getByLabelText("Categoría de emergencia"), "MATPEL")
    await user.selectOptions(screen.getByLabelText("Clasificación"), "Clase 3")
    await user.type(screen.getByLabelText("Tipo de incidente"), "derrame de combustible")
    await user.click(screen.getByRole("button", { name: "Activar" }))

    expect(cuerpoRecibido).toMatchObject({
      tipo_emergencia: "matpel",
      clasificacion_origen: "Clase 3",
      tipo_incidente: "derrame de combustible",
    })
    expect(cuerpoRecibido).not.toHaveProperty("nivel_alerta")
    expect(cuerpoRecibido).not.toHaveProperty("tipo_alerta")
    expect(await screen.findByText("Convocados: 0")).toBeInTheDocument()
  })
})
