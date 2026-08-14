import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { BASE_URL, server } from "../mocks/server"
import { listarCola, quitarDeCola } from "./db"
import { enviarOEncolar, flushColaOffline, SesionVencidaError, tamañoCola } from "./colaOffline"

const PATH = "/marcadores-incidente"

describe("colaOffline", () => {
  beforeEach(async () => {
    for (const entrada of await listarCola()) {
      await quitarDeCola(entrada.id)
    }
  })

  it("enviarOEncolar no encola si el POST tiene éxito", async () => {
    server.use(http.post(`${BASE_URL}${PATH}`, () => HttpResponse.json({ id: "1" }, { status: 201 })))

    await enviarOEncolar(PATH, { id: "a1" })

    expect(await tamañoCola()).toBe(0)
  })

  it("enviarOEncolar encola si el POST falla por red, sin lanzar", async () => {
    server.use(http.post(`${BASE_URL}${PATH}`, () => HttpResponse.error()))

    await expect(enviarOEncolar(PATH, { id: "a2" })).resolves.toBeUndefined()

    expect(await tamañoCola()).toBe(1)
  })

  it("enviarOEncolar relanza un error real del servidor (422) sin encolar", async () => {
    server.use(
      http.post(`${BASE_URL}${PATH}`, () =>
        HttpResponse.json({ detail: "dato inválido" }, { status: 422 }),
      ),
    )

    await expect(enviarOEncolar(PATH, { id: "a3" })).rejects.toThrow()
    expect(await tamañoCola()).toBe(0)
  })

  it("flushColaOffline reintenta y vacía la cola en éxito", async () => {
    server.use(http.post(`${BASE_URL}${PATH}`, () => HttpResponse.error()))
    await enviarOEncolar(PATH, { id: "a4" })
    expect(await tamañoCola()).toBe(1)

    server.use(http.post(`${BASE_URL}${PATH}`, () => HttpResponse.json({ id: "a4" }, { status: 201 })))
    await flushColaOffline()

    expect(await tamañoCola()).toBe(0)
  })

  it("flushColaOffline se detiene en el primer 401 sin vaciar el resto de la cola", async () => {
    server.use(http.post(`${BASE_URL}${PATH}`, () => HttpResponse.error()))
    await enviarOEncolar(PATH, { id: "a5" })
    await enviarOEncolar(PATH, { id: "a6" })
    expect(await tamañoCola()).toBe(2)

    server.use(
      http.post(`${BASE_URL}${PATH}`, () =>
        HttpResponse.json({ detail: "token vencido" }, { status: 401 }),
      ),
    )

    await expect(flushColaOffline()).rejects.toThrow(SesionVencidaError)
    expect(await tamañoCola()).toBe(2)
  })
})
