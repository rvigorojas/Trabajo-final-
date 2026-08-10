import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { useNavigate } from "react-router"
import { MENU_APARTE_ROUTES } from "../router"

/*
 * Acceso a Pre-PAI y Reportes fuera de la barra de tabs principal — Design.md Flujo B, Hueco 2
 * ("menú aparte del header, fuera de la barra de tabs principal").
 */
export function MenuAparte() {
  const navigate = useNavigate()

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Más opciones"
          className="min-h-touch-target-min min-w-touch-target-min rounded-DEFAULT px-3 text-body-lg text-on-surface"
        >
          ⋮
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="rounded-DEFAULT border border-outline-variant bg-surface-container-high p-1"
        >
          {MENU_APARTE_ROUTES.map((route) => (
            <DropdownMenu.Item
              key={route.path}
              onSelect={() => navigate(route.path)}
              className="min-h-touch-target-min flex cursor-pointer items-center px-3 text-body-md text-on-surface outline-none data-[highlighted]:bg-surface-container-highest"
            >
              {route.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
