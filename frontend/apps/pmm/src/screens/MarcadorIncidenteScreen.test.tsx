import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
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

function mockGeolocationExitoso() {
  vi.stubGlobal("navigator", {
    ...navigator,
    geolocation: {
      getCurrentPosition: (success: PositionCallback) => {
        success({
          coords: { latitude: -12.021806, longitude: -77.114611 },
        } as GeolocationPosition)
      },
    },
  })
}

function mockGeolocationFallido() {
  vi.stubGlobal("navigator", {
    ...navigator,
    geolocation: {
      getCurrentPosition: (
        _success: PositionCallback,
        error: PositionErrorCallback,
      ) => {
        error({} as GeolocationPositionError)
      },
    },
  })
}

describe("MarcadorIncidenteScreen", () => {
  beforeEach(() => {
    server.use(http.get(`${BASE_URL}/activaciones`, () => HttpResponse.json([activacionActiva])))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("captura la posición por GPS y la envía en el marcador", async () => {
    mockGeolocationExitoso()
    const user = userEvent.setup()
    let cuerpoRecibido: unknown = null
    let liberarRespuesta: () => void = () => {}
    const respuestaControlada = new Promise<void>((resolve) => {
      liberarRespuesta = resolve
    })

    server.use(
      http.post(`${BASE_URL}/marcadores-incidente`, async ({ request }) => {
        cuerpoRecibido = await request.json()
        await respuestaControlada
        return HttpResponse.json({ id: "m1", ...(cuerpoRecibido as object) }, { status: 201 })
      }),
    )

    render(<MarcadorIncidenteScreen />)

    expect(await screen.findByTestId("ubicacion-gps")).toHaveTextContent(
      "Posición GPS: -12.021806,-77.114611",
    )

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
      coordenada_cuadricula: "-12.021806,-77.114611",
      tipo_incidente: "fuego focalizado",
      capa: "incidente",
    })
  })

  it("si el GPS falla, permite ingresar la coordenada de cuadrícula a mano", async () => {
    mockGeolocationFallido()
    const user = userEvent.setup()
    let cuerpoRecibido: unknown = null

    server.use(
      http.post(`${BASE_URL}/marcadores-incidente`, async ({ request }) => {
        cuerpoRecibido = await request.json()
        return HttpResponse.json({ id: "m1", ...(cuerpoRecibido as object) }, { status: 201 })
      }),
    )

    render(<MarcadorIncidenteScreen />)

    expect(
      await screen.findByText(
        "No se pudo obtener la posición GPS. Reintentá o ingresala manualmente.",
      ),
    ).toBeInTheDocument()

    await user.type(screen.getByLabelText("Coordenada de cuadrícula (manual)"), "C4")
    await user.type(screen.getByLabelText("Tipo de incidente"), "fuego focalizado")
    await user.click(screen.getByRole("button", { name: "Registrar marcador" }))

    await waitFor(() => {
      expect(cuerpoRecibido).toMatchObject({
        activacion_id: "a1",
        coordenada_cuadricula: "C4",
        tipo_incidente: "fuego focalizado",
      })
    })
  })
})
