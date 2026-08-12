import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { getClaims } from "@pce/api-client"
import { BASE_URL, server } from "../mocks/server"
import { EvaluacionInicialScreen } from "./EvaluacionInicialScreen"

vi.mock("@pce/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@pce/api-client")>()),
  getClaims: vi.fn(),
}))

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

describe("EvaluacionInicialScreen", () => {
  it("con el rol correcto, completar y enviar dispara el POST con los campos correctos", async () => {
    const user = userEvent.setup()
    vi.mocked(getClaims).mockReturnValue({
      sub: "1",
      rol: "jefe_rescate",
      instancia_principal: "pmm",
    })
    let cuerpoRecibido: unknown = null

    server.use(
      http.get(`${BASE_URL}/activaciones`, () => HttpResponse.json([activacionActiva])),
      http.post(`${BASE_URL}/evaluaciones-iniciales`, async ({ request }) => {
        cuerpoRecibido = await request.json()
        return HttpResponse.json({ id: "e1", ...(cuerpoRecibido as object) }, { status: 201 })
      }),
    )

    render(<EvaluacionInicialScreen />)

    await user.type(await screen.findByLabelText("Magnitud"), "alta")
    await user.type(screen.getByLabelText("Riesgos secundarios"), "colapso estructural")
    await user.click(screen.getByRole("button", { name: "Enviar" }))

    expect(cuerpoRecibido).toMatchObject({
      activacion_id: "a1",
      magnitud: "alta",
      riesgos_secundarios: "colapso estructural",
    })
    expect(await screen.findByText("Evaluación registrada.")).toBeInTheDocument()
  })

  it("sin el rol correcto, no muestra el formulario", () => {
    vi.mocked(getClaims).mockReturnValue({
      sub: "2",
      rol: "bombero_aeronautico",
      instancia_principal: "pmm",
    })

    render(<EvaluacionInicialScreen />)

    expect(screen.getByText("Tu rol no puede completar la evaluación inicial.")).toBeInTheDocument()
    expect(screen.queryByLabelText("Magnitud")).not.toBeInTheDocument()
  })
})
