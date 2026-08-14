# Plan: Ítem #11 del BACKLOG.md — Endurecimiento (último del backlog)

Insumos: `tasks/item-11-endurecimiento/spec.md` (validado), `tasks/item-10-cola-offline-token-
blando/todo.md` (evidencia de corte de conectividad real ya generada), PRD sección 7
(`30 07/PRD_PCE_JorgeChavez.3.md`), `frontend/packages/api-client/src/design-tokens.css` (paleta
"Sentinel Command" y token de tap target), routers de `apps/coe` y `apps/pmm` (mapa de navegación
real para el conteo de clics).

## Frentes y dependencias

Los 4 frentes de `FRONTEND-TASKS.md` Fase 4 son independientes entre sí — no hay cadena de
dependencia real, se ejecutan en el orden que minimiza levantar/bajar el entorno (backend + dev
servers) una sola vez para los frentes que lo necesitan.

1. **Auditoría de contraste (sin entorno corriendo)** — cálculo WCAG 2.2 AA de los pares
   texto/fondo del `design-tokens.css` ya hecho en el gate (ver `spec.md`): todos los pares
   `on-X`/`X` usados como texto dan ≥7.71:1 (AA exige 4.5:1) — pasan con margen amplio, varios
   pasarían incluso AAA (7:1). Los 3 colores semánticos de alerta (`--color-alerta-i/ii/iii`) y
   `--color-success-safe`/`--color-offline-badge` están definidos pero **sin ningún uso todavía**
   en `apps/coe`/`apps/pmm` (confirmado por grep) — no hay hallazgo activo, se documenta como nota
   para cuando se adopten (si se usan como texto, `alerta-i` en 4.02:1 y `alerta-iii` en 3.71:1
   quedarían por debajo de 4.5:1 y necesitarían revisión en ese momento). `--color-outline-variant`
   (1.99:1) se usa solo como borde decorativo entre secciones de layout (`Shell.tsx` de ambas apps,
   `MenuAparte.tsx`, `TabBar.tsx`), no como borde de foco/estado de un control interactivo — fuera
   del alcance de WCAG 1.4.11 (non-text contrast) en su uso actual. Sin cambios de código.
2. **Auditoría de tap targets (sin entorno corriendo)** — grep de todos los `<button`, `<input`,
   `<select` y triggers de Radix en `apps/coe/src` y `apps/pmm/src`, cruzado contra la presencia de
   `min-h-touch-target-min`/`min-w-touch-target-min` (o el tamaño real renderizado, para
   componentes de Radix que no toman className directo en el elemento raíz). Corrige los que falten
   si el control es interactivo real (excluye `<select>` nativo, cuyo tamaño depende del SO/
   navegador y no es controlable por CSS de forma consistente — se documenta como limitación
   conocida, no como hallazgo a corregir).
3. **Walkthroughs E2E manuales + conteo de clics (requieren backend + `vite dev` de ambas apps)** —
   un solo levantamiento del entorno para los dos: se abre `coe` y `pmm` reales, se ejecuta el
   flujo E2E de cada cliente contra el backend real (ver `spec.md`, "Success Criteria") y, sobre el
   mismo shell ya renderizado, se cuentan los clics reales desde la pantalla principal hasta cada
   función del PRD sección 7 (no basta con leer `TAB_ROUTES`/`MENU_APARTE_ROUTES` en el código —
   hay que confirmarlo interactuando, un dropdown mal cerrado o un modal que tape la navegación no
   se ve en el código de rutas).
4. **Corte de conectividad** — sin trabajo nuevo, se referencia la verificación ya cerrada en el
   ítem #10 (`tasks/item-10-cola-offline-token-blando/todo.md`, sección "Verificación final del
   ítem").

## Orden de ejecución

(1) y (2) primero (no requieren entorno corriendo, resultado ya conocido para (1) desde el gate) →
levantar backend + `vite dev` de `coe` y `pmm` una sola vez → (3) → apagar entorno → (4) (solo
referencia, sin entorno) → si (2) generó cambios de código, correr `test`/`lint`/`build` de la app
tocada antes de cerrar.

## Riesgos y mitigación

- **Contraste de colores no usados todavía**: `alerta-i`/`alerta-iii` no cumplirían AA como texto
  si se adoptan sin revisar — no es un bug hoy (no hay código que los use como texto), pero se dejó
  la nota en `spec.md`/este plan para que quien los adopte no lo pase por alto.
- **Radix sin className directo**: algunos triggers de Radix (`DropdownMenu.Trigger`,
  `Tabs.Trigger`) podrían no aceptar el tap target vía `className` simple si envuelven un elemento
  distinto internamente — verificar con el navegador real (medir el elemento renderizado), no
  asumir por el código fuente.
- **Conteo de clics con datos vacíos**: si no hay una activación en curso al momento de la
  verificación, algunas pantallas muestran el estado "no hay activación" en vez del formulario real
  — no cambia el conteo de clics de navegación (la pantalla es la misma, alcanzable en los mismos
  clics), pero para el walkthrough E2E completo hace falta una activación real creada antes.
- **Reutilizar el usuario de prueba del ítem #10** (`verif_item10`, rol `jefe_rescate`,
  `instancia_principal: pmm`) para el walkthrough de PMM; para COE hace falta un usuario con
  `instancia_principal: coe` — crear uno nuevo si no existe ya uno reutilizable del backend de
  desarrollo.

## Checkpoints de verificación

- Después de (1)-(2): sin checkpoint de test nuevo si no hubo cambios de código; si (2) corrigió
  algún componente, correr la suite existente de la app tocada.
- Después de (3): evidencia escrita en `todo.md` de cada paso del walkthrough (qué se hizo, contra
  qué backend, qué se observó) y del conteo de clics por función.
- Cierre: `npm run test`, `npm run lint`, `npm run build` de `coe` y `pmm` limpios; commit y push
  (a confirmar con el usuario en el momento, mismo criterio que ítems anteriores).
