import { RouterProvider } from "react-router"
import { Login, createApiClient, getToken } from "@pce/api-client"
import { router } from "./router"

const apiClient = createApiClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
  getToken,
})

function App() {
  if (!getToken()) {
    return <Login apiClient={apiClient} onSuccess={() => window.location.reload()} />
  }
  return <RouterProvider router={router} />
}

export default App
