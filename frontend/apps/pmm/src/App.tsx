import { RouterProvider } from "react-router"
import { Login, getToken } from "@pce/api-client"
import { apiClient } from "./apiClient"
import { router } from "./router"
import { ActualizacionDisponible } from "./components/ActualizacionDisponible"

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
  return <RouterProvider router={router} />
}

export default App
