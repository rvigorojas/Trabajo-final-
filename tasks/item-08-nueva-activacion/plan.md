# Plan: Ítem #8 del BACKLOG.md — Cliente PMM: Nueva activación

Insumos: `tasks/item-08-nueva-activacion/spec.md` (validado), `FRONTEND-SPEC.md` secciones 2 y 5,
`packages/api-client/src/types.ts` (`ActivacionCreate`, ya tipado con el contrato exacto).

## Componentes y dependencias

1. **`lib/payloadActivacion.ts`** — función pura `payloadActivacion(input): ActivacionCreate`.
   Recibe `{ id, categoria, tipoIncidente, horaEvento, nivelAlerta?, tipoAlerta?,
   clasificacionOrigen? }` y arma el body exacto: si `categoria === "aeronautica"`, incluye
   `nivel_alerta`/`tipo_alerta` y omite `clasificacion_origen`; si no, incluye
   `clasificacion_origen` y omite los otros dos. Sin dependencias previas de este ítem.
2. **`NuevaActivacionScreen.tsx`** — formulario controlado: select de categoría (default
   `"aeronautica"`) → campos dependientes (nivel + tipo_alerta si aeronáutica, clasificación si
   no) → tipo de incidente → aviso informativo de convocatoria → botón enviar. `onSubmit`: arma
   `hora_evento = new Date().toISOString()`, `id = crypto.randomUUID()`, llama (1), `POST
   /activaciones`, y con la respuesta muestra confirmación + convocatoria (cantidad por
   instancia, reutilizando el mismo criterio de agrupación que `ResumenScreen` de `coe`, ítem #3,
   pero sin duplicar código entre apps — cada app tiene su propia copia mínima, no se comparte
   por ahora). Depende de (1).
3. **`App.tsx` (modificado)** — reemplaza el placeholder "Sesión iniciada" por
   `<NuevaActivacionScreen />`. Depende de (2).

## Orden de implementación

(1) → (2) → (3).

Siguiente ítem del backlog: #9 (Evaluación inicial y Marcador de incidente) — ahí sí hace falta
un router en `pmm` (2+ pantallas reales).

## Riesgos y mitigación

- **Mezclar campos entre categorías**: el riesgo real que motivó separar (1) como función pura —
  un test unitario por categoría es más simple y confiable que verificarlo solo a través del
  formulario completo.
- **`tipo_alerta` como número**: el `<select>`/`<input>` HTML siempre da un string — convertir con
  `Number(...)` antes de armar el payload, no confiar en que TypeScript lo haga solo.
- **Opciones de `clasificacion_origen` con capitalización exacta** (`"Estructural"`, no
  `"estructural"`; `"EMERGENCIA"` en mayúsculas) — copiarlas literal de `FRONTEND-SPEC.md` sección
  2, no normalizar a un estilo propio, porque el backend las valida contra strings exactos.
- **Confirmación sin convocatoria** (backend no encontró miembros para convocar — lista vacía): la
  pantalla de confirmación debe mostrar "0 convocados" sin romperse, no asumir que siempre hay al
  menos uno.

## Checkpoints de verificación

- Después de (1): test unitario — 4 categorías, cada una arma el body exacto (incluye lo que debe
  incluir, omite lo que debe omitir).
- Después de (2): test con MSW — Aeronáutica y una categoría no aeronáutica (MATPEL) confirman el
  body recibido por `POST /activaciones`; la respuesta con convocatoria se refleja en pantalla.
- Después de (3): `npm run build --workspace=pmm` limpio, `App.tsx` monta la pantalla real.
- Verificación manual final contra backend real (Postgres levantado): crear una activación
  Aeronáutica y una MATPEL reales, confirmar en la base (`GET /activaciones` por API) que
  `nivel_alerta`/`clasificacion_origen` quedaron como corresponde a cada una.
