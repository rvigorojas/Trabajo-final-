# Plan: Ítem #2 del BACKLOG.md — Shell de navegación Cliente COE (Opción 1A)

Insumos: `tasks/item-02-shell-navegacion/spec.md` (validado), `FRONTEND-SPEC.md` sección 4,
`FRONTEND-TASKS.md` Fase 2, `Tablet_app_structures.pptx` (Opción 1A), `backend/app/deps.py`
(`ROLES_EDICION_EVALUACION_RELEVO`, `ROLES_DESACTIVACION`).

## Componentes y dependencias

1. **React Router** — instalar `react-router` (última estable), definir rutas con
   `createBrowserRouter` en `router.tsx`, y modificar `App.tsx` para que, con sesión activa,
   monte `<RouterProvider>` en vez de solo `<Login>`. Sin dependencias previas — primer
   componente.
2. **Pantallas stub** — 7 componentes (`ResumenScreen`, `MapaScreen`, `UnidadesScreen`,
   `ComunicacionesScreen`, `CadenaDeMandoScreen`, `PrePAIScreen`, `ReportesScreen`), cada uno solo
   con un `<h1>`. Depende de (1) — necesitan rutas a las que asociarse.
3. **`Shell.tsx` + `TabBar.tsx`** — layout con `<Outlet/>` de React Router, barra de tabs Radix UI
   con las 5 pantallas principales, compresión con scroll horizontal en portrait (CSS
   `overflow-x-auto`, sin JS de carrusel). Depende de (1), (2).
4. **`FloatingActions.tsx`** — botones Relevo/Desactivar, cada uno visible solo si
   `getClaims()?.rol` está en la lista de roles copiada literal de `backend/app/deps.py`. Depende
   de (1) (sesión ya disponible vía el gate de `App.tsx`, no de (2) ni (3)) — puede ir en paralelo
   a (3).
5. **`MenuAparte.tsx`** — acceso a Pre-PAI/Reportes fuera de la barra de tabs (menú simple, ej.
   ícono de header con dropdown Radix). Depende de (1), (2). Puede ir en paralelo a (3) y (4).

## Orden de implementación

(1) → (2) → { (3), (4), (5) en paralelo, no dependen entre sí }.

No hay nada después de este ítem dentro de este plan — el contenido real de cada pantalla es de
los ítems #3-#6 del backlog, fuera de alcance acá (ver Boundaries en `spec.md`).

## Riesgos y mitigación

- **Versión de React Router**: hay drift real entre la API "declarativa" (`<Routes>`/`<Route>`,
  v6 clásico) y la API de "data router" (`createBrowserRouter`, v6.4+/v7). Mitigación: confirmar
  con `npm view react-router version` antes de instalar, usar la API de data router desde el
  inicio (es la recomendada para proyectos nuevos) y no mezclar ambos estilos.
- **Primer uso real de Radix `Tabs`**: sin precedente en el repo (documentado en
  `tasks/item-01-setup/spec.md` como "pendiente de uso real"). Mitigación: seguir el patrón
  oficial de Radix (`Tabs.Root`/`Tabs.List`/`Tabs.Trigger`/`Tabs.Content`) sin envolver con
  abstracciones propias todavía — evita deuda de diseño antes de tener un segundo caso de uso.
- **Drift entre la lista de roles del frontend y `backend/app/deps.py`**: no hay forma automática
  de mantenerlos sincronizados entre Python y TS (mismo riesgo aceptado ya en `types.ts`, ítem
  #1). Mitigación: comentario en el archivo de roles del frontend apuntando literal a
  `backend/app/deps.py` con los nombres exactos de las constantes, para que un grep futuro los
  encuentre.
- **Compresión de tabs en portrait no es verificable de forma significativa en JSDOM** (no hay
  layout real en los tests). Mitigación: no fingir una aserción automatizada sobre esto — se
  verifica manualmente en `npm run dev` con devtools en modo responsive, y se anota como
  verificación manual en el checkpoint final, no como test.

## Checkpoints de verificación

- Después de (1)+(2): `npm run dev --workspace=coe`, con sesión simulada, carga `/resumen` (u
  otra ruta) y renderiza el `<h1>` del stub correspondiente sin errores en consola.
- Después de (3): test de RTL con `createMemoryRouter` — click en cada una de las 5 tabs cambia
  la URL activa y el contenido stub mostrado.
- Después de (4): test de RTL con `getClaims()` mockeado — un rol de `ROLES_DESACTIVACION` (ej.
  `duty_manager`) muestra ambos botones; un rol fuera de las dos listas no muestra ninguno.
- Después de (5): Pre-PAI y Reportes alcanzables desde el menú aparte, confirmando que no
  aparecen en la lista de `TabBar` (ni por accidente ni por copy-paste).
- Verificación manual (no automatizada): compresión de la barra de tabs con scroll horizontal en
  viewport angosto, y conteo real de clics de navegación (PRD sección 7, máximo 3).
