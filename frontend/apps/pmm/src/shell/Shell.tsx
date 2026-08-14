import { useEffect, useState } from "react"
import { NavLink, Outlet } from "react-router"
import { getClaims } from "@pce/api-client"
import { ROLES_EDICION_EVALUACION_RELEVO } from "../roles"
import { ActualizacionDisponible } from "../components/ActualizacionDisponible"
import { EVENTO_CAMBIO_COLA, tamañoCola } from "../offline/colaOffline"

/*
 * Sin diseño de navegación documentado para el PMM de campo (Design.md solo cubre Flujo A/B/C/D,
 * todos del lado COE o de una sola pantalla) — nav simple de enlaces, no la barra de tabs +
 * acciones flotantes de coe (esa complejidad la pide Design.md para el dashboard COE en vivo).
 */
export function Shell() {
  const rol = getClaims()?.rol
  const puedeEditarEvaluacion = rol !== undefined && ROLES_EDICION_EVALUACION_RELEVO.includes(rol)
  const [pendientes, setPendientes] = useState(0)

  useEffect(() => {
    function actualizar() {
      tamañoCola().then(setPendientes)
    }
    actualizar()
    window.addEventListener(EVENTO_CAMBIO_COLA, actualizar)
    return () => window.removeEventListener(EVENTO_CAMBIO_COLA, actualizar)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background">
      <nav className="flex items-center gap-4 border-b border-outline-variant p-2">
        <NavLink to="/nueva-activacion" className="text-body-md">
          Nueva activación
        </NavLink>
        {puedeEditarEvaluacion && (
          <>
            <NavLink to="/evaluacion-inicial" className="text-body-md">
              Evaluación inicial
            </NavLink>
            <NavLink to="/relevo-mando" className="text-body-md">
              Relevo de mando
            </NavLink>
          </>
        )}
        <NavLink to="/marcador-incidente" className="text-body-md">
          Marcador de incidente
        </NavLink>
        {pendientes > 0 && (
          <span className="text-body-md ml-auto" data-testid="contador-sin-sincronizar">
            {pendientes} sin sincronizar
          </span>
        )}
      </nav>
      <main className="flex-1">
        <Outlet />
      </main>
      <ActualizacionDisponible />
    </div>
  )
}
