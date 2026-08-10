import { Login, createApiClient, getToken } from "@pce/api-client"

const apiClient = createApiClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
  getToken,
})

function App() {
  return <Login apiClient={apiClient} onSuccess={() => window.location.reload()} />
}

export default App
