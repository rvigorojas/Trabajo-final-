/*
 * Cliente HTTP tipado — FRONTEND-SPEC.md sección 2 (contrato de API, manejo de 401/403/422).
 * No importa el store de sesión directamente (evita dependencia circular): recibe `getToken`
 * inyectado por quien lo instancie (apps/coe, apps/pmm), que en la práctica será el store de
 * sesión de la Task 5.
 */

export type ApiErrorKind = "unauthorized" | "forbidden" | "validation" | "unknown"

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number

  constructor(kind: ApiErrorKind, status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.kind = kind
    this.status = status
  }
}

export interface ApiClientConfig {
  baseUrl: string
  getToken: () => string | null
}

export interface ApiClient {
  apiFetch: <T>(path: string, options?: RequestInit) => Promise<T>
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = config.getToken()
    const headers = new Headers(options.headers)
    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }
    if (options.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json")
    }

    const response = await fetch(`${config.baseUrl}${path}`, { ...options, headers })

    if (!response.ok) {
      const message = await readErrorMessage(response)
      const kind = errorKindForStatus(response.status)
      throw new ApiError(kind, response.status, message)
    }

    if (response.status === 204) {
      return undefined as T
    }
    return (await response.json()) as T
  }

  return { apiFetch }
}

function errorKindForStatus(status: number): ApiErrorKind {
  if (status === 401) return "unauthorized"
  if (status === 403) return "forbidden"
  if (status === 422) return "validation"
  return "unknown"
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json()
    if (typeof data?.detail === "string") return data.detail
    return JSON.stringify(data)
  } catch {
    return response.statusText
  }
}
