import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { BASE_URL, server } from "../mocks/server"
import { RelevoModal } from "./RelevoModal"

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

describe("RelevoModal", () => {
  it("completar y enviar el formulario dispara POST /relevos-mando con los datos correctos", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    let cuerpoRecibido: unknown = null

    server.use(
      http.get(`${BASE_URL}/activaciones`, () => HttpResponse.json([activacionActiva])),
      http.post(`${BASE_URL}/relevos-mando`, async ({ request }) => {
        cuerpoRecibido = await request.json()
        return HttpResponse.json({ id: "r1", ...(cuerpoRecibido as object) }, { status: 201 })
      }),
    )

    render(<RelevoModal onClose={onClose} />)

    await user.selectOptions(await screen.findByLabelText("Instancia"), "PMM")
    await user.type(screen.getByLabelText("Responsable saliente"), "Ana")
    await user.type(screen.getByLabelText("Responsable entrante"), "Beto")
    await user.click(screen.getByRole("button", { name: "Confirmar relevo" }))

    expect(cuerpoRecibido).toMatchObject({
      activacion_id: "a1",
      instancia: "pmm_ci",
      responsable_saliente: "Ana",
      responsable_entrante: "Beto",
    })
    expect(onClose).toHaveBeenCalled()
  })

  it("sin activación en curso muestra un aviso en vez del formulario", async () => {
    server.use(http.get(`${BASE_URL}/activaciones`, () => HttpResponse.json([])))

    render(<RelevoModal onClose={vi.fn()} />)

    expect(await screen.findByText("No hay una activación en curso.")).toBeInTheDocument()
  })
})
