import { setupServer } from "msw/node"

export const BASE_URL = "http://localhost:8000"

/*
 * Servidor MSW compartido por todos los tests de pmm (arrancado en test-setup.ts). Sin handlers
 * por defecto todavía — el primer test que necesite mockear un endpoint lo agrega con
 * `server.use(...)`, mismo patrón que apps/coe/src/mocks/server.ts.
 */
export const server = setupServer()
