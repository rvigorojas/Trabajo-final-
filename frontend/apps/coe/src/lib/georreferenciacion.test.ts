import { describe, expect, it } from "vitest"
import { coordenadaAPosicionEnFoto, parseLatLon } from "./georreferenciacion"

describe("parseLatLon", () => {
  it("parsea formato DMS con hemisferios S/W", () => {
    expect(parseLatLon(`12°01'16.3"S 77°07'30.7"W`)).toEqual({
      lat: -(12 + 1 / 60 + 16.3 / 3600),
      lon: -(77 + 7 / 60 + 30.7 / 3600),
    })
  })

  it("parsea formato decimal separado por coma", () => {
    expect(parseLatLon("-12.0211944,-77.1251944")).toEqual({
      lat: -12.0211944,
      lon: -77.1251944,
    })
  })

  it("devuelve null para una referencia de cuadrícula en papel (todavía sin calibrar)", () => {
    expect(parseLatLon("C4")).toBeNull()
  })
})

describe("coordenadaAPosicionEnFoto", () => {
  it("ubica los 3 puntos de referencia exactamente donde se marcaron en la foto", () => {
    const casos: [string, { xPct: number; yPct: number }][] = [
      [`12°02'28.5"S 77°06'28.6"W`, { xPct: (646 / 890) * 100, yPct: (608 / 785) * 100 }],
      [`12°00'07.3"S 77°08'05.5"W`, { xPct: (202 / 890) * 100, yPct: (5 / 785) * 100 }],
      [`12°01'20.1"S 77°06'22.9"W`, { xPct: (676 / 890) * 100, yPct: (259 / 785) * 100 }],
    ]

    for (const [coordenada, esperado] of casos) {
      const resultado = coordenadaAPosicionEnFoto(coordenada)
      expect(resultado).not.toBeNull()
      expect(resultado!.xPct).toBeCloseTo(esperado.xPct, 1)
      expect(resultado!.yPct).toBeCloseTo(esperado.yPct, 1)
    }
  })

  it("devuelve null para una coordenada de cuadrícula en papel (no lat/lon)", () => {
    expect(coordenadaAPosicionEnFoto("C4")).toBeNull()
  })

  it("devuelve null si la lat/lon cae fuera del recuadro de la foto", () => {
    expect(coordenadaAPosicionEnFoto(`12°10'00.0"S 77°20'00.0"W`)).toBeNull()
  })
})
