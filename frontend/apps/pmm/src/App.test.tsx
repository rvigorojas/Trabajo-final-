import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { getToken, logout } from "@pce/api-client"
import App from "./App"
import { BASE_URL, server } from "./mocks/server"
import { agregarACola, listarCola, quitarDeCola } from "./offline/db"

vi.mock("@pce/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@pce/api-client")>()),
  getToken: vi.fn(),
  logout: vi.fn(),
}))

vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: () => ({
    needRefresh: [false, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}))

describe("App", () => {
  beforeEach(async () => {
    for (const entrada of await listarCola()) {
      await quitarDeCola(entrada.id)
    }
  })

  it("sin sesión guardada muestra Login", () => {
    vi.mocked(getToken).mockReturnValue(null)

    render(<App />)

    expect(screen.getByRole("heading", { name: "Ingresar — PCE" })).toBeInTheDocument()
  })

  it("con sesión guardada muestra Nueva activación sin llamar al backend", () => {
    vi.mocked(getToken).mockReturnValue("token-valido")

    render(<App />)

    // MSW (test-setup.ts) tiene onUnhandledRequest: "error" y este archivo no registra ningún
    // handler — si App llamara al backend acá, el test fallaría por la request sin interceptar.
    expect(screen.getByRole("heading", { name: "Nueva activación" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Ingresar — PCE" })).not.toBeInTheDocument()
  })

  it("al montar con un 401 en la cola offline, fuerza logout (hueco 6.4)", async () => {
    vi.mocked(getToken).mockReturnValue("token-vencido")
    await agregarACola({
      id: "m1",
      path: "/marcadores-incidente",
      body: { id: "m1" },
      encoladoEn: Date.now(),
    })
    server.use(
      http.post(`${BASE_URL}/marcadores-incidente`, () =>
        HttpResponse.json({ detail: "token vencido" }, { status: 401 }),
      ),
    )
    vi.spyOn(window.location, "reload").mockImplementation(() => {})

    render(<App />)

    await waitFor(() => expect(logout).toHaveBeenCalled())
    expect(window.location.reload).toHaveBeenCalled()
    expect(await listarCola()).toHaveLength(1) // la cola no se vacía en un 401
  })
})
