/*
 * Transforma coordenadas GPS (lat/lon) a posición en píxeles sobre `mapa-aijc-satelite.jpg`
 * (890x785). No resuelve el mapa cuadriculado en papel (PRD sección 8, riesgo abierto: ese
 * levantamiento sigue pendiente) — solo ubica marcadores cuyo `coordenada_cuadricula` ya viene
 * como lat/lon real (ej. leída del GPS de la tablet GETAC, o de Google Maps a mano).
 *
 * Los 3 puntos de referencia salen de calibracion-mapa-aijc.html (2026-08-15): clics reales sobre
 * la foto con su lat/lon correspondiente leída de Google Maps. Un triángulo grande y bien
 * distribuido da una transformación afín estable en toda la foto — ver bitácora/conversación,
 * un primer intento con 3 puntos agrupados en 30x30px se descartó por poco confiable.
 */

export const DIMENSIONES_FOTO = { ancho: 890, alto: 785 } as const

interface PuntoReferencia {
  pixelX: number
  pixelY: number
  latLon: string
}

const PUNTOS_REFERENCIA: PuntoReferencia[] = [
  { pixelX: 646, pixelY: 608, latLon: `12°02'28.5"S 77°06'28.6"W` },
  { pixelX: 202, pixelY: 5, latLon: `12°00'07.3"S 77°08'05.5"W` },
  { pixelX: 676, pixelY: 259, latLon: `12°01'20.1"S 77°06'22.9"W` },
]

export function parseLatLon(texto: string): { lat: number; lon: number } | null {
  const dms = texto
    .trim()
    .match(/(\d+)°(\d+)'([\d.]+)"([NS])\s+(\d+)°(\d+)'([\d.]+)"([EW])/)
  if (dms) {
    const [, latG, latM, latS, latH, lonG, lonM, lonS, lonH] = dms
    const lat = gradosDecimal(latG, latM, latS, latH === "S")
    const lon = gradosDecimal(lonG, lonM, lonS, lonH === "W")
    return { lat, lon }
  }

  const decimal = texto.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/)
  if (decimal) {
    return { lat: Number(decimal[1]), lon: Number(decimal[2]) }
  }

  return null
}

function gradosDecimal(grados: string, minutos: string, segundos: string, negativo: boolean) {
  const valor = Number(grados) + Number(minutos) / 60 + Number(segundos) / 3600
  return negativo ? -valor : valor
}

// Resuelve [x,y,z] tal que filas[i] · [x,y,z] = resultados[i], por regla de Cramer.
function resolverSistema3x3(
  filas: [number, number, number][],
  resultados: [number, number, number],
): [number, number, number] {
  const det = determinante3x3(filas)
  const conColumna = (columna: 0 | 1 | 2) =>
    filas.map((fila, i) => fila.map((v, j) => (j === columna ? resultados[i] : v))) as [
      number,
      number,
      number,
    ][]

  return [
    determinante3x3(conColumna(0)) / det,
    determinante3x3(conColumna(1)) / det,
    determinante3x3(conColumna(2)) / det,
  ]
}

function determinante3x3(m: [number, number, number][]): number {
  const [[a, b, c], [d, e, f], [g, h, i]] = m
  return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g)
}

const puntosParseados = PUNTOS_REFERENCIA.map((p) => {
  const latLon = parseLatLon(p.latLon)
  if (!latLon) throw new Error(`Punto de referencia inválido: ${p.latLon}`)
  return { ...p, ...latLon }
})

const filasLatLon = puntosParseados.map(
  (p) => [p.lat, p.lon, 1] as [number, number, number],
)
const [coefX, coefY] = [
  resolverSistema3x3(
    filasLatLon,
    puntosParseados.map((p) => p.pixelX) as [number, number, number],
  ),
  resolverSistema3x3(
    filasLatLon,
    puntosParseados.map((p) => p.pixelY) as [number, number, number],
  ),
]

/** Posición en píxeles (sobre `mapa-aijc-satelite.jpg`, 890x785) para una lat/lon real. */
export function latLonAPixel(lat: number, lon: number): { x: number; y: number } {
  return {
    x: coefX[0] * lat + coefX[1] * lon + coefX[2],
    y: coefY[0] * lat + coefY[1] * lon + coefY[2],
  }
}

/**
 * Posición en porcentaje (0-100) para un `coordenada_cuadricula` que sea lat/lon real
 * (DMS "12°01'16.3\"S 77°07'30.7\"W" o decimal "-12.0211,-77.1251"). Devuelve `null` si el texto
 * no es lat/lon (ej. una referencia de cuadrícula en papel tipo "C4", todavía sin calibrar) o si
 * cae fuera del recuadro de la foto.
 */
export function coordenadaAPosicionEnFoto(
  coordenadaCuadricula: string,
): { xPct: number; yPct: number } | null {
  const latLon = parseLatLon(coordenadaCuadricula)
  if (!latLon) return null

  const { x, y } = latLonAPixel(latLon.lat, latLon.lon)
  if (x < 0 || y < 0 || x > DIMENSIONES_FOTO.ancho || y > DIMENSIONES_FOTO.alto) return null

  return { xPct: (x / DIMENSIONES_FOTO.ancho) * 100, yPct: (y / DIMENSIONES_FOTO.alto) * 100 }
}
