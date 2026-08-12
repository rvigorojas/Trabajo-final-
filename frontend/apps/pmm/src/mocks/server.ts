import { http, HttpResponse } from "msw"
import { setupServer } from "msw/node"

export const BASE_URL = "http://localhost:8000"

/*
 * Servidor MSW compartido por todos los tests de pmm (arrancado en test-setup.ts). Handler por
 * defecto en "vacío" para /activaciones — cualquier test que monte el árbol de rutas completo
 * (Shell) puede terminar montando EvaluacionInicialScreen/MarcadorIncidenteScreen sin querer, y
 * ambas hacen GET /activaciones al montar; sin esto, MSW tira "intercepted a request without a
 * matching request handler" (mismo hallazgo que apps/coe/src/mocks/server.ts, ítems #4/#5). Cada
 * test file sobreescribe con `server.use(...)` los endpoints que le importan.
 */
export const server = setupServer(http.get(`${BASE_URL}/activaciones`, () => HttpResponse.json([])))
