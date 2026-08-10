/*
 * Pantalla de login compartida (Opción 1F del pptx): mismo componente para apps/coe y apps/pmm —
 * "el rol define permisos, no la pantalla" (FRONTEND-SPEC.md sección 3).
 */

import { useState, type FormEvent } from "react"
import type { ApiClient } from "../client"
import type { TokenResponse } from "../types"
import { saveToken } from "../session"

export interface LoginProps {
  apiClient: ApiClient
  onSuccess?: () => void
}

export function Login({ apiClient, onSuccess }: LoginProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const response = await apiClient.apiFetch<TokenResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      })
      saveToken(response.access_token)
      onSuccess?.()
    } catch {
      setError("Usuario o contraseña incorrectos")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 max-w-sm">
      <h1 className="text-headline-md font-headline">Ingresar — PCE</h1>

      <label className="flex flex-col gap-1">
        <span className="text-label-sm">Usuario</span>
        <input
          className="min-h-touch-target-min rounded-DEFAULT border border-outline bg-surface-container-low px-3 text-on-surface"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          required
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-label-sm">Contraseña</span>
        <input
          type="password"
          className="min-h-touch-target-min rounded-DEFAULT border border-outline bg-surface-container-low px-3 text-on-surface"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
      </label>

      {error && (
        <p role="alert" className="text-error">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="min-h-touch-target-min rounded-DEFAULT bg-primary text-on-primary text-body-lg"
      >
        {loading ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  )
}
