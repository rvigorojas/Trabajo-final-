import * as Tabs from "@radix-ui/react-tabs"
import { useLocation, useNavigate } from "react-router"
import { TAB_ROUTES } from "../router"

/*
 * Barra de tabs fija abajo (Opción 1A, Tablet_app_structures.pptx). El valor activo se deriva de
 * la URL (no de estado propio) para que la navegación por tab, deep-link y botón atrás queden
 * sincronizados. `overflow-x-auto` comprime la lista con scroll horizontal en portrait — sin
 * verificación automatizada posible en JSDOM, ver tasks/item-02-shell-navegacion/plan.md.
 */
export function TabBar() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <Tabs.Root
      value={location.pathname}
      onValueChange={(path) => navigate(path)}
      className="border-t border-outline-variant bg-surface-container-low"
    >
      <Tabs.List className="flex overflow-x-auto" aria-label="Navegación principal">
        {TAB_ROUTES.map((route) => (
          <Tabs.Trigger
            key={route.path}
            value={route.path}
            className="min-h-touch-target-min flex-1 shrink-0 whitespace-nowrap px-4 text-label-sm text-on-surface-variant data-[state=active]:text-on-surface data-[state=active]:font-headline"
          >
            {route.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs.Root>
  )
}
