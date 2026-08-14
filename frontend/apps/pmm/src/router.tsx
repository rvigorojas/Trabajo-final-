import { createBrowserRouter, Navigate } from "react-router"
import { Shell } from "./shell/Shell"
import { NuevaActivacionScreen } from "./screens/NuevaActivacionScreen"
import { EvaluacionInicialScreen } from "./screens/EvaluacionInicialScreen"
import { MarcadorIncidenteScreen } from "./screens/MarcadorIncidenteScreen"
import { RelevoMandoScreen } from "./screens/RelevoMandoScreen"

/*
 * Array plano (no createBrowserRouter([...]) directo) para que los tests puedan construir un
 * createMemoryRouter(routes, ...) idéntico al que corre en producción — mismo criterio que
 * apps/coe/src/router.tsx.
 */
export const routes = [
  {
    path: "/",
    element: <Shell />,
    children: [
      { index: true, element: <Navigate to="/nueva-activacion" replace /> },
      { path: "nueva-activacion", element: <NuevaActivacionScreen /> },
      { path: "evaluacion-inicial", element: <EvaluacionInicialScreen /> },
      { path: "marcador-incidente", element: <MarcadorIncidenteScreen /> },
      { path: "relevo-mando", element: <RelevoMandoScreen /> },
    ],
  },
]

export const router = createBrowserRouter(routes)
