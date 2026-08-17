import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { setupServer } from "msw/node"
import { ApiError, createApiClient } from "./client"

const BASE_URL = "http://localhost:8000"

const server = setupServer(
  http.get(`${BASE_URL}/activaciones/expired`, () =>
    HttpResponse.json({ detail: "Token inválido o expirado" }, { status: 401 }),
  ),
  http.get(`${BASE_URL}/activaciones/forbidden`, () =>
    HttpResponse.json({ detail: "Rol no autorizado para esta acción" }, { status: 403 }),
  ),
  http.get(`${BASE_URL}/activaciones/ok`, () => HttpResponse.json({ id: "1" }, { status: 200 })),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe("createApiClient", () => {
  it("lanza ApiError con kind 'unauthorized' en un 401, no un Error genérico", async () => {
    const client = createApiClient({ baseUrl: BASE_URL, getToken: () => "token-vencido" })

    await expect(client.apiFetch("/activaciones/expired")).rejects.toMatchObject({
      kind: "unauthorized",
      status: 401,
    })
    await expect(client.apiFetch("/activaciones/expired")).rejects.toBeInstanceOf(ApiError)
  })

  it("lanza ApiError con kind 'forbidden' en un 403", async () => {
    const client = createApiClient({ baseUrl: BASE_URL, getToken: () => "token-valido" })

    await expect(client.apiFetch("/activaciones/forbidden")).rejects.toMatchObject({
      kind: "forbidden",
      status: 403,
    })
  })

  it("dispara onUnauthorized en un 401 antes de lanzar el ApiError", async () => {
    let llamado = false
    const client = createApiClient({
      baseUrl: BASE_URL,
      getToken: () => "token-vencido",
      onUnauthorized: () => {
        llamado = true
      },
    })

    await expect(client.apiFetch("/activaciones/expired")).rejects.toBeInstanceOf(ApiError)
    expect(llamado).toBe(true)
  })

  it("no dispara onUnauthorized en un 403", async () => {
    let llamado = false
    const client = createApiClient({
      baseUrl: BASE_URL,
      getToken: () => "token-valido",
      onUnauthorized: () => {
        llamado = true
      },
    })

    await expect(client.apiFetch("/activaciones/forbidden")).rejects.toBeInstanceOf(ApiError)
    expect(llamado).toBe(false)
  })

  it("inyecta el Authorization header desde getToken", async () => {
    let capturedAuth: string | null = null
    server.use(
      http.get(`${BASE_URL}/activaciones/ok`, ({ request }) => {
        capturedAuth = request.headers.get("Authorization")
        return HttpResponse.json({ id: "1" }, { status: 200 })
      }),
    )
    const client = createApiClient({ baseUrl: BASE_URL, getToken: () => "abc123" })

    await client.apiFetch("/activaciones/ok")

    expect(capturedAuth).toBe("Bearer abc123")
  })
})
