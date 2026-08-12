import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { BASE_URL, server } from "../mocks/server"
import { DesactivarModal } from "./DesactivarModal"

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

describe("DesactivarModal", () => {
  it("confirmar dispara POST /activaciones/{id}/desactivar contra el id correcto", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    let rutaLlamada: string | null = null

    server.use(
      http.get(`${BASE_URL}/activaciones`, () => HttpResponse.json([activacionActiva])),
      http.post(`${BASE_URL}/activaciones/:id/desactivar`, ({ params }) => {
        rutaLlamada = params.id as string
        return HttpResponse.json({ ...activacionActiva, estado: "cerrada" })
      }),
    )

    render(<DesactivarModal onClose={onClose} />)

    expect(await screen.findByText('¿Confirmás desactivar "incendio en pista"?')).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Confirmar" }))

    expect(rutaLlamada).toBe("a1")
    expect(onClose).toHaveBeenCalled()
  })
})
