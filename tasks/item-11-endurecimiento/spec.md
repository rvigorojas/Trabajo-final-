# Spec: Endurecimiento (ítem #11 del BACKLOG.md — último del backlog)

Último ítem del backlog (`BACKLOG.md`), deriva de `FRONTEND-TASKS.md` Fase 4. A diferencia de los
ítems #1-#10, no agrega pantallas ni funcionalidad — es una pasada de verificación/auditoría sobre
lo ya construido, con 4 frentes independientes (PRD sección 7, `FRONTEND-TASKS.md` Fase 4):

1. Al menos un flujo end-to-end por cliente contra backend real (no mocks).
2. Verificación manual del límite de 3 clics (PRD sección 7, "Usabilidad") con el shell 1A.
3. Accesibilidad básica: contraste y tap targets.
4. Prueba real de corte de conectividad en el Cliente PMM, confirmando sync sin duplicados.

## Decisiones (confirmadas con el usuario en el gate, 2026-08-14)

1. **E2E por cliente = walkthrough manual documentado, no automatizado.** Mismo patrón que los
   ítems #1-#10 (verificación en el navegador real contra el backend real, con los pasos y el
   resultado documentados acá). No se agrega Playwright ni ninguna herramienta de E2E nueva —
   sería la primera dependencia de ese tipo en el proyecto y no la pidió nadie explícitamente.
2. **Corte de conectividad: ya cubierto por el ítem #10, no se repite.** La verificación de cierre
   del ítem #10 detuvo/reinició el proceso real de `uvicorn` (falla de red real de la app, no
   throttling de devtools) para las 4 escrituras offline-capaces, incluyendo el caso de JWT
   vencido con relogin forzado. Ese trabajo ya satisface este punto de la Fase 4 — acá solo se
   referencia como evidencia (`tasks/item-10-cola-offline-token-blando/todo.md`).
3. **Tap targets: el token `--spacing-touch-target-min: 48px` ya alcanza.** Es el mínimo WCAG 2.2
   (criterio 2.5.8, "Target Size Minimum") y el propio `design-tokens.css` ya lo documenta como
   pensado para "tablet con guantes" (comentario preexistente, línea "Espaciado — base 8px, touch
   targets grandes para tablet con guantes"). Este ítem audita que esté aplicado consistentemente
   en todos los controles interactivos de ambas apps, no rediseña el tamaño.
4. **Estándar de contraste: WCAG 2.2 AA** (4.5:1 texto normal, 3:1 texto grande/componentes de UI
   no textuales). Sin mención de AAA en PRD/TDD.

## Objective

Cerrar el backlog confirmando que lo construido en los ítems #1-#10 cumple los requisitos no
funcionales del PRD sección 7 (usabilidad de 3 clics, accesibilidad básica, offline real) con
evidencia verificable, no solo con tests unitarios/de componente ya existentes (que corren contra
MSW, no contra el backend real ni contra el layout renderizado real).

Fuente: `BACKLOG.md` ítem #11, `FRONTEND-TASKS.md` Fase 4, PRD sección 7 ("Requisitos no
funcionales").

**Éxito:** un documento de verificación (`todo.md` de este ítem) con evidencia concreta —no solo
casillas tildadas— de cada uno de los 4 frentes, más cualquier corrección de código que la
auditoría de tap targets encuentre necesaria (la de contraste no se espera que requiera cambios,
ver "Decisiones" #3/#4 y el cálculo ya hecho en el gate).

## Tech Stack

Ninguna herramienta nueva. Se reutiliza lo ya instalado: navegador real (Claude in Chrome) contra
`vite dev` + backend real (mismo patrón que la verificación manual del ítem #10), y un cálculo de
contraste WCAG hecho una vez con el intérprete de Python del backend (sin agregarlo como
dependencia del frontend — es una verificación puntual, no una herramienta que quede en el repo).

## Project Structure

Sin cambios de estructura esperados. Posibles ediciones puntuales de clases Tailwind
(`min-h-touch-target-min`/`min-w-touch-target-min`) en componentes existentes si la auditoría de
tap targets encuentra controles sin el token aplicado — a confirmar en `plan.md` tras la
auditoría real (no se puede saber el alcance exacto sin correrla).

## Code Style

Mismo estilo que el resto del frontend. Sin componentes ni pantallas nuevas.

## Testing Strategy

No aplica en el sentido de "tests automatizados nuevos" — este ítem es en sí mismo la
verificación. Si la auditoría de tap targets corrige algún componente, se corre la suite existente
(`npm run test --workspace=coe`, `npm run test --workspace=pmm`) para confirmar que no se rompe
nada, más `lint`/`build` de ambas apps.

## Boundaries

- **Always:** documentar evidencia concreta de cada verificación (qué se probó, contra qué
  backend/estado, qué se observó) — no alcanza con tildar la casilla del `FRONTEND-TASKS.md`.
- **Ask first:** cualquier cambio de diseño visible más allá de agregar la clase de tap target
  faltante a un control ya existente (ej. si la auditoría sugiriera rediseñar un componente, se
  para y se pregunta antes de tocar el sistema de diseño de Stitch).
- **Never:** agregar herramientas de E2E automatizado o de auditoría de accesibilidad (axe-core,
  Playwright, Lighthouse CI, etc.) sin pedido explícito — decisión ya tomada en el gate (ver
  "Decisiones" #1).

## Success Criteria

- Flujo E2E documentado y ejecutado contra backend real en **COE** (mínimo: ver activación activa
  en Resumen → relevo de mando → verlo reflejado en Cadena de mando → editar una unidad → ver un
  Pre-PAI) y en **PMM** (activación → evaluación inicial → marcador de incidente → relevo de
  mando, en modo online — el caso offline ya se verificó en el ítem #10).
- Conteo real de clics desde la pantalla principal de cada cliente hasta cada función listada en
  el PRD sección 7, con el shell 1A real (no solo lectura del código de rutas) — todas dentro de 3.
- Auditoría de contraste documentada (cálculo WCAG AA de los pares texto/fondo del design system)
  y de tap targets (grep de controles interactivos sin el token de 48px, con corrección si
  aplica).
- Referencia a la evidencia de corte de conectividad real ya generada en el ítem #10.
- `npm run test`, `npm run lint` y `npm run build` de `coe` y `pmm` limpios al cierre.

## Open Questions

Ninguna bloqueante tras el gate del 2026-08-14.
