import { http, HttpResponse } from "msw"
import { setupServer } from "msw/node"

export const BASE_URL = "http://localhost:8000"

/*
 * Servidor MSW compartido por todos los tests (arrancado en test-setup.ts). Handlers por
 * defecto en "vacío" — cualquier test que renderice el árbol de rutas completo (TabBar,
 * MenuAparte, etc.) puede terminar montando ResumenScreen/CadenaDeMandoScreen sin querer (route
 * index redirige a /resumen); sin esto, esas pantallas hacían fetch real y contaminaban tests
 * que no tienen nada que ver con ellas. Cada test file sobreescribe con `server.use(...)` los
 * endpoints que le importan.
 */
export const server = setupServer(
  http.get(`${BASE_URL}/usuarios`, () => HttpResponse.json([])),
  http.get(`${BASE_URL}/activaciones`, () => HttpResponse.json([])),
  http.get(`${BASE_URL}/evaluaciones-iniciales`, () => HttpResponse.json([])),
  http.get(`${BASE_URL}/marcadores-incidente`, () => HttpResponse.json([])),
  http.get(`${BASE_URL}/relevos-mando`, () => HttpResponse.json([])),
  http.get(`${BASE_URL}/unidades`, () => HttpResponse.json([])),
)
