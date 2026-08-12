import { describe, expect, it } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { BASE_URL, server } from "../mocks/server"
import { MarcadorIncidenteScreen } from "./MarcadorIncidenteScreen"

const activacionActiva = {
  id: "a1",
  tipo_emergencia: "aeronautica",
  nivel_alerta: "II",
  clasificacion_origen: null,
  tipo_alerta: 5,
  tipo_incidente: "incendio en pista",
  estado: "activa",
  hora_evento: "2026-08-11T10:00:00Z",
  hora_recepcion: "2026-08-11T10:00:01Z",
  convocatoria: [],
}

describe("MarcadorIncidenteScreen", () => {
  it("muestra el badge mientras el POST está en vuelo y lo oculta al confirmarse", async () => {
    const user = userEvent.setup()
    let cuerpoRecibido: unknown = null
    let liberarRespuesta: () => void = () => {}
    const respuestaControlada = new Promise<void>((resolve) => {
      liberarRespuesta = resolve
    })

    server.use(
      http.get(`${BASE_URL}/activaciones`, () => HttpResponse.json([activacionActiva])),
      http.post(`${BASE_URL}/marcadores-incidente`, async ({ request }) => {
        cuerpoRecibido = await request.json()
        await respuestaControlada
        return HttpResponse.json({ id: "m1", ...(cuerpoRecibido as object) }, { status: 201 })
      }),
    )

    render(<MarcadorIncidenteScreen />)

    await user.type(await screen.findByLabelText("Coordenada de cuadrícula"), "C4")
    await user.type(screen.getByLabelText("Tipo de incidente"), "fuego focalizado")
    await user.click(screen.getByRole("button", { name: "Registrar marcador" }))

    expect(await screen.findByTestId("badge-sin-sincronizar")).toBeInTheDocument()

    liberarRespuesta()

    await waitFor(() => {
      expect(screen.queryByTestId("badge-sin-sincronizar")).not.toBeInTheDocument()
    })
    expect(await screen.findByText("Marcador registrado.")).toBeInTheDocument()
    expect(cuerpoRecibido).toMatchObject({
      activacion_id: "a1",
      coordenada_cuadricula: "C4",
      tipo_incidente: "fuego focalizado",
      capa: "incidente",
    })
  })
})
