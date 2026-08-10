import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { setupServer } from "msw/node"
import { Login } from "./Login"
import { createApiClient } from "../client"
import { getToken, logout } from "../session"

const BASE_URL = "http://localhost:8000"

const server = setupServer(
  http.post(`${BASE_URL}/auth/login`, () =>
    HttpResponse.json({ access_token: "fixture-access-token", token_type: "bearer" }, { status: 200 }),
  ),
)

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  logout()
})
afterAll(() => server.close())

describe("Login", () => {
  it("al enviar el formulario con credenciales válidas, guarda el token en el store de sesión", async () => {
    const user = userEvent.setup()
    const apiClient = createApiClient({ baseUrl: BASE_URL, getToken: () => null })

    render(<Login apiClient={apiClient} />)

    await user.type(screen.getByLabelText("Usuario"), "renzo")
    await user.type(screen.getByLabelText("Contraseña"), "secreto")
    await user.click(screen.getByRole("button", { name: /ingresar/i }))

    await waitFor(() => expect(getToken()).toBe("fixture-access-token"))
  })

  it("en un login fallido (401), NO guarda ningún token y muestra el error", async () => {
    server.use(
      http.post(`${BASE_URL}/auth/login`, () =>
        HttpResponse.json({ detail: "Credenciales inválidas" }, { status: 401 }),
      ),
    )
    const user = userEvent.setup()
    const apiClient = createApiClient({ baseUrl: BASE_URL, getToken: () => null })

    render(<Login apiClient={apiClient} />)

    await user.type(screen.getByLabelText("Usuario"), "renzo")
    await user.type(screen.getByLabelText("Contraseña"), "incorrecta")
    await user.click(screen.getByRole("button", { name: /ingresar/i }))

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument())
    expect(getToken()).toBeNull()
  })
})
