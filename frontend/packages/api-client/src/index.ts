/*
 * Punto de entrada público del paquete @pce/api-client.
 * Encontrado en `verify` (Sesión 09): package.json declaraba `main`/`types: src/index.ts` pero
 * el archivo no existía — el paquete no era importable por nombre desde apps/coe ni apps/pmm.
 */

export { createApiClient, ApiError } from "./client"
export type { ApiClient, ApiClientConfig, ApiErrorKind } from "./client"

export { decodeToken, saveToken, getToken, getClaims, getSesionIniciadaEn, logout } from "./session"
export type { SessionClaims } from "./session"

export { Login } from "./components/Login"
export type { LoginProps } from "./components/Login"

export type {
  Rol,
  InstanciaPrincipal,
  TipoEmergencia,
  NivelAlerta,
  EstadoActivacion,
  Usuario,
  LoginRequest,
  TokenResponse,
  ConvocatoriaMiembro,
  ActivacionCreate,
  Activacion,
  ActivacionConConvocatoria,
  EvaluacionInicial,
  Instancia,
  RelevoMando,
  CapaMapa,
  MarcadorIncidente,
  EstadoUnidad,
  Unidad,
  PrePAI,
  ReporteCierre,
} from "./types"
