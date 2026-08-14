# Tasks: Ítem #11 del BACKLOG.md — Endurecimiento (último del backlog)

Cada task es completable en una sesión, con criterio de aceptación y verificación explícita. Orden
= orden de dependencia (ver `tasks/item-11-endurecimiento/plan.md`).

- [x] Task: Auditoría de contraste (WCAG 2.2 AA).
  - Acceptance: cálculo de ratio de contraste de cada par `on-X`/`X` del `design-tokens.css`
    usado como texto sobre fondo, contra el mínimo 4.5:1 (texto normal)/3:1 (texto grande, no
    aplica acá). Documentado con los valores reales, no solo "pasa/no pasa".
  - Verify: todos los pares en uso real (background, surface-container-*, primary, secondary,
    error) ≥4.5:1. Colores semánticos de alerta (`alerta-i/ii/iii`) y `outline-variant`
    documentados aparte (sin uso actual como texto / uso solo decorativo, respectivamente).
  - Files: ninguno (verificación).
  - **Resultado** (fórmula WCAG de luminancia relativa, calculada con el intérprete de Python del
    backend sobre los valores hex reales de `packages/api-client/src/design-tokens.css`):

    | Par (texto/fondo) | Ratio | AA (4.5:1) |
    |---|---|---|
    | on-background / background | 14.34:1 | ✅ |
    | on-surface / surface-container-low | 13.30:1 | ✅ |
    | on-surface / surface-container-high | 11.10:1 | ✅ |
    | on-surface-variant / background | 10.86:1 | ✅ |
    | on-secondary / secondary (botones) | 7.72:1 | ✅ |
    | on-primary / primary | 7.71:1 | ✅ |
    | on-error / error | 7.72:1 | ✅ |
    | on-error-container / error-container | 7.24:1 | ✅ |

    Todos los pares realmente usados como texto pasan AA con margen amplio (mínimo 7.71:1, la
    mayoría pasaría incluso AAA). Casos aparte:
    - `--color-alerta-i` (4.02:1), `--color-alerta-ii` (6.84:1), `--color-alerta-iii` (3.71:1),
      `--color-success-safe` (4.49:1), `--color-offline-badge` (7.21:1) sobre `background`: son
      tokens semánticos definidos en `design-tokens.css` pero **sin ningún uso todavía** en
      `apps/coe/src` ni `apps/pmm/src` (confirmado por grep). `alerta-i` y `alerta-iii` quedarían
      por debajo de 4.5:1 si se adoptan como texto — nota para quien los use en el futuro, no un
      hallazgo activo hoy.
    - `--color-outline-variant` (1.99:1 sobre `background`): se usa únicamente como borde
      decorativo entre secciones de layout (`Shell.tsx` de ambas apps, `MenuAparte.tsx`,
      `TabBar.tsx`), nunca como borde de foco/estado de un control interactivo — fuera del
      alcance de WCAG 1.4.11 (non-text contrast) en su uso actual.
  - Sin cambios de código (resultado ya conforme).

- [x] Task: Auditoría de tap targets (48px).
  - Acceptance: grep de todos los elementos interactivos (`<button`, `<input`, `<select`, Radix
    `Trigger`/`Item`) en `apps/coe/src` y `apps/pmm/src`; cada uno tiene
    `min-h-touch-target-min`/`min-w-touch-target-min` o mide ≥48px renderizado. Los que no lo
    tengan y sean corregibles se corrigen; los que no aplican (ej. `<select>` nativo) se
    documentan como excepción conocida.
  - Verify: lista de controles auditados con su resultado; si hubo corrección, test/lint/build de
    la app tocada en verde.
  - **Resultado**: todos los `<button type="submit">`/botones de acción principal ya tenían el
    token aplicado (incluido `Login.tsx`, que además ya aplicaba el mismo patrón completo —
    borde + tap target — a sus `<input>`, sirvió de referencia). **Hallazgo real y sistemático**:
    los `<input>`/`<select>` de los formularios operativos (evaluación inicial, marcador de
    incidente, nueva activación, relevo de mando en ambos clientes) no tenían ninguna clase de
    altura mínima ni borde visible — quedaban con el alto natural de línea (~24-32px), muy por
    debajo del mínimo de 48px, justo en las pantallas más usadas durante una emergencia real.
    Corregido agregando `min-h-touch-target-min rounded-DEFAULT border border-outline
    bg-surface-container-low px-3 text-on-surface` (mismo patrón exacto de `Login.tsx`) a:
    - `frontend/apps/coe/src/shell/RelevoModal.tsx` (select instancia + 2 inputs)
    - `frontend/apps/coe/src/screens/UnidadesScreen.tsx` (select de estado por unidad)
    - `frontend/apps/pmm/src/screens/EvaluacionInicialScreen.tsx` (2 inputs)
    - `frontend/apps/pmm/src/screens/MarcadorIncidenteScreen.tsx` (2 inputs + select de capa)
    - `frontend/apps/pmm/src/screens/NuevaActivacionScreen.tsx` (select categoría, select nivel
      de alerta, input tipo de alerta, select clasificación, input tipo de incidente)
    - `frontend/apps/pmm/src/screens/RelevoMandoScreen.tsx` (select instancia + 2 inputs)

    También se agregó `min-h-touch-target-min` al `<label>` que envuelve cada checkbox de capa en
    `frontend/apps/coe/src/screens/MapaScreen.tsx` (agranda el área clickeable total sin cambiar
    el tamaño visual del checkbox nativo — patrón estándar para checkboxes accesibles), y a los
    botones de selección de fila (estilo "link", `text-body-md underline`) en
    `frontend/apps/coe/src/screens/PrePAIScreen.tsx` y `ReportesScreen.tsx`.

    **Excepción documentada, sin corrección**: el desplegable interno de un `<select>` nativo
    (las `<option>` una vez abierto) depende 100% del navegador/SO y no es controlable por CSS —
    solo el control colapsado (que sí recibió el token) es ajustable.
  - Verify: `npm run test`/`lint`/`build` de `coe` (28/28 tests, lint limpio, build limpio) y
    `pmm` (29/29 tests, lint limpio, build limpio) tras la corrección — sin regresiones, los tests
    seleccionan por rol/label, no por clase.

- [x] Task: Walkthrough E2E — Cliente COE contra backend real.
  - Acceptance: con backend real y `vite dev` de `coe` corriendo, flujo completo ejecutado a mano:
    ver una activación activa en Resumen → registrar un relevo de mando → verlo reflejado en
    Cadena de mando → editar el estado de una unidad desde Unidades → abrir un Pre-PAI. Cada paso
    con su resultado observado documentado acá.
  - **Resultado** (usuario de prueba `verif_item11_coe`, rol `gerente_seguridad`,
    `instancia_principal: coe`, contra backend real en :8000, `coe` en :5174):
    1. Resumen mostró la activación real "Verificacion offline item10" (creada en el ítem #10),
       cronómetro corriendo, convocatoria COE 0/3 · PMM 0/3, evaluación inicial "Moderada" y el
       feed de "Últimos eventos" con las 4 escrituras reales del ítem #10 (marcador, relevo,
       marcador, evaluación) — confirma que el feed client-side arma el orden correcto desde
       datos reales, no mockeados.
    2. Botón flotante "Relevo de mando" → modal → completado ("Gerente de Seguridad saliente" →
       "Duty Manager entrante") → `POST /relevos-mando` real, apareció al instante en "Últimos
       eventos" de Resumen (polling de 3s).
    3. Tab "Cadena de mando" → el relevo recién creado apareció en el carril COE, junto al de
       PMM del ítem #10 en el carril PMM — confirma los 2 carriles independientes por
       `activacion_id`.
    4. Tab "Unidades" → unidad R1 (estaba "Fuera de servicio" de una prueba anterior) cambiada a
       "OK" vía el `<select>` → `PUT /unidades/R1` real, "Última actualización" saltó al
       timestamp real de la edición — confirma la escritura real, no solo el cambio visual local.
    5. Menú aparte (⋮, header) → 2 clics (abrir menú + elegir "Pre-PAI") → lista con
       "Prueba Item 5 - Derrame — Plataforma sur" → clic → detalle real cargado
       (caracterización, riesgos) desde `GET /pre-pai/{id}`.
    - Ningún paso requirió recargar por error. Los 3 datos escritos (relevo, estado de unidad) se
      confirmaron reflejados en pantalla sin refrescar manualmente (polling real).

- [x] Task: Walkthrough E2E — Cliente PMM contra backend real (caso online).
  - Acceptance: con backend real y `vite dev` de `pmm` corriendo, flujo completo online: Nueva
    activación → Evaluación inicial → Marcador de incidente → Relevo de mando, sin cortar la red
    (el caso offline ya está cubierto por el ítem #10). Cada paso documentado con su resultado.
  - **Resultado** (usuario `verif_item10`, `pmm` en :5173, red intacta en todo el flujo):
    1. Nueva activación "Walkthrough item11 online" (Aeronáutica, Alerta I) → pantalla
       "Activación creada" (respuesta síncrona real, no el estado "sin sincronizar" del ítem #10)
       con "Convocados: 0".
    2. Evaluación inicial (Magnitud "Leve", Riesgos "Ninguno") → "Evaluación registrada.", sin
       badge "sin sincronizar" en el header.
    3. Marcador de incidente (Coordenada "A-1", Tipo "Walkthrough item11") → "Marcador
       registrado.", sin badge.
    4. Relevo de mando (PMM, "CI saliente" → "CI entrante") → "Relevo registrado.", sin badge.
  - Verify: confirmado contra el backend real (`GET /evaluaciones-iniciales`,
    `/marcadores-incidente`, `/relevos-mando` filtrados por `activacion_id`) que las 3 escrituras
    dependientes existen **exactamente una vez** cada una, atadas a la activación recién creada —
    sin duplicados, y en ningún momento pasaron por la cola offline (caso online real, distinto
    del offline ya verificado en el ítem #10).

- [x] Task: Conteo real de clics (PRD sección 7, límite de 3).
  - Acceptance: sobre el mismo shell renderizado de los 2 walkthroughs anteriores, contar clics
    reales desde la pantalla principal de cada cliente hasta: activación de alerta, evaluación
    inicial, marcador de mapa, relevo de mando (críticas); Pre-PAI, panel de unidades, reportes de
    cierre (consulta/administración).
  - **Resultado** (contado interactuando, no solo leyendo `router.tsx`):

    **Cliente COE** (pantalla principal tras login = Resumen):
    | Función | Clics reales |
    |---|---|
    | Ver alerta activa / evaluación inicial (Resumen) | 0 (pantalla principal) |
    | Marcador de mapa (tab Mapa) | 1 |
    | Relevo de mando (botón flotante) | 1 |
    | Desactivar (botón flotante) | 1 |
    | Panel de unidades (tab Unidades) | 1 |
    | Cadena de mando (tab) | 1 |
    | Pre-PAI (menú aparte → item) | **2** |
    | Reportes de cierre (menú aparte → item) | **2** |

    **Cliente PMM** (pantalla principal tras login = Nueva activación):
    | Función | Clics reales |
    |---|---|
    | Activación de alerta (pantalla principal) | 0 |
    | Evaluación inicial (enlace de nav) | 1 |
    | Marcador de mapa (enlace de nav) | 1 |
    | Relevo de mando (enlace de nav) | 1 |

  - Verify: máximo real observado = **2 clics** (Pre-PAI/Reportes en COE, vía menú aparte). Las 7
    funciones del PRD sección 7 quedan dentro del límite de 3 con margen — confirmado
    interactuando con el shell real, no solo por lectura de `TAB_ROUTES`/`MENU_APARTE_ROUTES`.

- [x] Task: Referenciar la evidencia de corte de conectividad real (ya cubierta en el ítem #10).
  - Acceptance: enlazar la sección "Verificación final del ítem" de
    `tasks/item-10-cola-offline-token-blando/todo.md` como evidencia de este punto de la Fase 4,
    sin repetir el trabajo.
  - **Resultado**: ver `tasks/item-10-cola-offline-token-blando/todo.md`, sección "Verificación
    final del ítem" — el backend real se detuvo/reinició (proceso `uvicorn`, falla de red real de
    la app, no throttling de devtools) para las 4 escrituras offline-capaces (Nueva activación,
    Evaluación inicial, Marcador de incidente, Relevo de mando): las 4 se encolaron sin red y
    sincronizaron sin duplicados al reconectar (evento `online` real). Repetido con un JWT vencido
    firmado a mano con el secreto real del backend: se encoló igual offline, el 401 al reconectar
    forzó logout + relogin, la cola sobrevivió en IndexedDB y sincronizó sola tras el siguiente
    login. Este ítem no repite el trabajo.

## Verificación final del ítem

- [x] Los 4 frentes de la Fase 4 (`FRONTEND-TASKS.md`) documentados con evidencia concreta en este
      archivo, no solo casilleros tildados.
- [x] La auditoría de tap targets corrigió 6 componentes (ver task de arriba): `npm run test`,
      `npm run lint`, `npm run build` de `coe` (28/28 tests) y `pmm` (29/29 tests), limpios.
- [x] `BACKLOG.md` y `CLAUDE.md` actualizados con el cierre del ítem #11 y del backlog completo.
- [ ] Commit (y push, a confirmar con el usuario en el momento).
