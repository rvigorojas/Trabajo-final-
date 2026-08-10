import { createBrowserRouter, Navigate } from "react-router"
import { Shell } from "./shell/Shell"
import { ResumenScreen } from "./screens/ResumenScreen"
import { MapaScreen } from "./screens/MapaScreen"
import { UnidadesScreen } from "./screens/UnidadesScreen"
import { ComunicacionesScreen } from "./screens/ComunicacionesScreen"
import { CadenaDeMandoScreen } from "./screens/CadenaDeMandoScreen"
import { PrePAIScreen } from "./screens/PrePAIScreen"
import { ReportesScreen } from "./screens/ReportesScreen"

/*
 * Las 5 pantallas principales de la barra de tabs (Opción 1A) — fuente única para TabBar.
 * Pre-PAI y Reportes NO van acá: viven en MENU_APARTE_ROUTES (Design.md Flujo B, Hueco 2).
 */
export const TAB_ROUTES = [
  { path: "/resumen", label: "Resumen" },
  { path: "/mapa", label: "Mapa" },
  { path: "/unidades", label: "Unidades" },
  { path: "/comunicaciones", label: "Comunicaciones" },
  { path: "/cadena-de-mando", label: "Cadena de mando" },
] as const

export const MENU_APARTE_ROUTES = [
  { path: "/pre-pai", label: "Pre-PAI" },
  { path: "/reportes", label: "Reportes" },
] as const

/*
 * Árbol de rutas como array plano (no `createBrowserRouter([...])` directo) para que los tests
 * puedan construir un `createMemoryRouter(routes, ...)` con exactamente la misma configuración
 * que corre en producción — evita que un router de test diverja del real.
 */
export const routes = [
  {
    path: "/",
    element: <Shell />,
    children: [
      { index: true, element: <Navigate to="/resumen" replace /> },
      { path: "resumen", element: <ResumenScreen /> },
      { path: "mapa", element: <MapaScreen /> },
      { path: "unidades", element: <UnidadesScreen /> },
      { path: "comunicaciones", element: <ComunicacionesScreen /> },
      { path: "cadena-de-mando", element: <CadenaDeMandoScreen /> },
      { path: "pre-pai", element: <PrePAIScreen /> },
      { path: "reportes", element: <ReportesScreen /> },
    ],
  },
]

export const router = createBrowserRouter(routes)
