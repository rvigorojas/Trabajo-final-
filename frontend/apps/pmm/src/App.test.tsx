import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { getToken } from "@pce/api-client"
import App from "./App"

vi.mock("@pce/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@pce/api-client")>()),
  getToken: vi.fn(),
}))

vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: () => ({
    needRefresh: [false, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}))

describe("App", () => {
  it("sin sesión guardada muestra Login", () => {
    vi.mocked(getToken).mockReturnValue(null)

    render(<App />)

    expect(screen.getByRole("heading", { name: "Ingresar — PCE" })).toBeInTheDocument()
  })

  it("con sesión guardada muestra el contenido post-login sin llamar al backend", () => {
    vi.mocked(getToken).mockReturnValue("token-valido")

    render(<App />)

    // MSW (test-setup.ts) tiene onUnhandledRequest: "error" y este archivo no registra ningún
    // handler — si App llamara al backend acá, el test fallaría por la request sin interceptar.
    expect(screen.getByText("Sesión iniciada")).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Ingresar — PCE" })).not.toBeInTheDocument()
  })
})
