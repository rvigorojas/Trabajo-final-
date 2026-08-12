import { Login, getToken } from "@pce/api-client"
import { apiClient } from "./apiClient"
import { ActualizacionDisponible } from "./components/ActualizacionDisponible"
import { NuevaActivacionScreen } from "./screens/NuevaActivacionScreen"

/*
 * Gateo de sesión (FRONTEND-SPEC.md sección 5, "Login"): con una sesión ya guardada, no se llama
 * al backend al arrancar — requisito de "funcionar sin conexión si el usuario ya se había
 * logueado antes". Sin router todavía (una sola pantalla real, ítem #8) — se arma cuando el
 * ítem #9 agregue una segunda pantalla.
 *
 * ActualizacionDisponible se monta siempre, no solo post-login: es la que dispara el registro
 * del service worker (useRegisterSW), y el caché del shell de la app debe existir desde antes del
 * primer login para que la propia pantalla de Login pueda recargar sin conexión.
 */
function App() {
  return (
    <>
      {getToken() ? (
        <NuevaActivacionScreen />
      ) : (
        <Login apiClient={apiClient} onSuccess={() => window.location.reload()} />
      )}
      <ActualizacionDisponible />
    </>
  )
}

export default App
