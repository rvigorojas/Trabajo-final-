import { Login, createApiClient, getToken } from "@pce/api-client"
import { ActualizacionDisponible } from "./components/ActualizacionDisponible"

const apiClient = createApiClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
  getToken,
})

/*
 * Gateo de sesión (FRONTEND-SPEC.md sección 5, "Login"): con una sesión ya guardada, no se llama
 * al backend al arrancar — requisito de "funcionar sin conexión si el usuario ya se había
 * logueado antes". Sin pantallas reales todavía (ítems #8-#10): placeholder post-login.
 *
 * ActualizacionDisponible se monta siempre, no solo post-login: es la que dispara el registro
 * del service worker (useRegisterSW), y el caché del shell de la app debe existir desde antes del
 * primer login para que la propia pantalla de Login pueda recargar sin conexión.
 */
function App() {
  return (
    <>
      {getToken() ? (
        <p className="p-4 text-body-md">Sesión iniciada</p>
      ) : (
        <Login apiClient={apiClient} onSuccess={() => window.location.reload()} />
      )}
      <ActualizacionDisponible />
    </>
  )
}

export default App
