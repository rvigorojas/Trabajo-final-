import { Outlet } from "react-router"
import { TabBar } from "./TabBar"
import { FloatingActions } from "./FloatingActions"
import { MenuAparte } from "./MenuAparte"

/*
 * Layout de la app autenticada (Opción 1A, Tablet_app_structures.pptx): header con MenuAparte
 * (Pre-PAI/Reportes) + TabBar fija abajo + acciones flotantes siempre visibles.
 */
export function Shell() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background text-on-background">
      <header className="flex justify-end border-b border-outline-variant p-2">
        <MenuAparte />
      </header>
      <main className="flex-1 overflow-y-auto pb-52">
        <Outlet />
      </main>
      <FloatingActions />
      <TabBar />
    </div>
  )
}
