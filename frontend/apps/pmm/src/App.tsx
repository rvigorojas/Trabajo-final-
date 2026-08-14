import { useEffect } from "react"
import { RouterProvider } from "react-router"
import { Login, getToken, logout } from "@pce/api-client"
import { apiClient } from "./apiClient"
import { router } from "./router"
import { ActualizacionDisponible } from "./components/ActualizacionDisponible"
import { flushColaOffline, SesionVencidaError } from "./offline/colaOffline"

/*
 * Al montar con sesión (login recién hecho, o reapertura de la app) y en cada evento "online",
 * intenta vaciar la cola offline. Si el backend responde 401 (hueco 6.4, JWT vencido) la cola
 * queda intacta y se fuerza relogin — el próximo login exitoso recarga la página (mismo patrón
 * que el `onSuccess` de abajo), lo que vuelve a montar este efecto y reintenta el flush.
 */
function AppAutenticada() {
  useEffect(() => {
    function sincronizar() {
      flushColaOffline().catch((error) => {
        if (error instanceof SesionVencidaError) {
          logout()
          window.location.reload()
        }
      })
    }
    sincronizar()
    window.addEventListener("online", sincronizar)
    return () => window.removeEventListener("online", sincronizar)
  }, [])

  return <RouterProvider router={router} />
}

/*
 * Gateo de sesión (FRONTEND-SPEC.md sección 5, "Login"): con una sesión ya guardada, no se llama
 * al backend al arrancar — requisito de "funcionar sin conexión si el usuario ya se había
 * logueado antes". Mismo patrón que apps/coe/src/App.tsx.
 *
 * ActualizacionDisponible se monta en ambas ramas (acá directo sin sesión; dentro de Shell con
 * sesión, ítem #9) — dispara el registro del service worker desde antes del primer login.
 */
function App() {
  if (!getToken()) {
    return (
      <>
        <Login apiClient={apiClient} onSuccess={() => window.location.reload()} />
        <ActualizacionDisponible />
      </>
    )
  }
  return <AppAutenticada />
}

export default App
