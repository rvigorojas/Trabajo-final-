import { RouterProvider } from "react-router"
import { Login, getToken } from "@pce/api-client"
import { router } from "./router"
import { apiClient } from "./apiClient"

function App() {
  if (!getToken()) {
    return <Login apiClient={apiClient} onSuccess={() => window.location.reload()} />
  }
  return <RouterProvider router={router} />
}

export default App
