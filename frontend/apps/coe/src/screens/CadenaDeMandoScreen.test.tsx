import { describe, expect, it } from "vitest"
import { render, screen, within } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { BASE_URL, server } from "../mocks/server"
import { CadenaDeMandoScreen } from "./CadenaDeMandoScreen"

const relevo = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "r1",
  activacion_id: "a1",
  instancia: "coe",
  responsable_saliente: "Ana",
  responsable_entrante: "Beto",
  hora_evento: "2026-08-10T10:00:00Z",
  hora_recepcion: "2026-08-10T10:00:01Z",
  ...overrides,
})

describe("CadenaDeMandoScreen", () => {
  it("separa los relevos en carriles COE y PMM", async () => {
    server.use(
      http.get(`${BASE_URL}/relevos-mando`, () =>
        HttpResponse.json([
          relevo({ id: "r-coe", instancia: "coe" }),
          relevo({
            id: "r-pmm",
            instancia: "pmm_ci",
            responsable_saliente: "Carla",
            responsable_entrante: "Dario",
          }),
        ]),
      ),
    )

    render(<CadenaDeMandoScreen />)

    const carrilCoe = await screen.findByRole("region", { name: "Carril COE" })
    const carrilPmm = screen.getByRole("region", { name: "Carril PMM" })

    expect(within(carrilCoe).getByText("Ana → Beto")).toBeInTheDocument()
    expect(within(carrilPmm).getByText("Carla → Dario")).toBeInTheDocument()
    expect(within(carrilCoe).queryByText("Carla → Dario")).not.toBeInTheDocument()
  })
})
