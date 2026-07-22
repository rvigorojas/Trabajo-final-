# ADR 4: Stack por componente

## Estado

Aceptado

## Contexto

El equipo que construye el PCE es pequeño (1-3 personas), con experiencia previa en backend fuera
del ecosistema JS (Python) y en frontend web estándar. El frontend queda forzado a JavaScript/
TypeScript por ser la única opción viable para una PWA offline-first en navegador (cliente PMM,
ADR 1) más el cliente COE. El backend y el servicio de sincronización (ADR 1) se construyen en
Python para aprovechar el conocimiento ya existente del equipo y evitar sumar un segundo lenguaje
de servidor a mantener con un equipo chico.

## Decisión

- **Backend (API principal + servicio de sync):** FastAPI (Python), asíncrono nativo, tipado con
  Pydantic.
- **Frontend (cliente PMM y cliente COE):** React + Vite, con soporte PWA vía `vite-plugin-pwa`
  (Workbox) para el cliente PMM offline-first.

## Alternativas consideradas

- **Django + DRF** — incluiría ORM, panel de admin y auth listos de fábrica, útil para gestionar
  internamente catálogos como Unidades SSEI o la biblioteca de Pre-PAI sin construir un panel a
  medida. No se eligió porque es más pesado y síncrono por defecto, lo que complica el servicio de
  sync si necesita manejar concurrencia alta de reintentos de clientes offline reconectando.
- **Flask** — daría control máximo sobre cada pieza (routing, ORM, auth elegidos aparte). No se
  eligió porque, con un equipo chico y sin batería de librerías incluida, cablear cada componente a
  mano ralentiza el arranque y aumenta el riesgo de inconsistencias frente a un framework más
  opinado como FastAPI.
- **Vue 3** — curva de aprendizaje más suave que React y también con buen soporte PWA vía
  `vite-plugin-pwa`. No se eligió porque el pool de talento y el ecosistema de librerías de mapas/
  integraciones es algo más chico que el de React, relevante si el equipo necesita crecer más
  adelante.
- **Svelte/SvelteKit** — produciría bundles más livianos, relevante para tablets con conectividad
  limitada. No se eligió porque el soporte de librerías de mapas y offline-first es menos maduro
  que en React/Vue, sumando riesgo de tener que resolver integraciones a mano en un proyecto que ya
  tiene su propia complejidad de sincronización offline.

## Consecuencias

- El equipo reutiliza el conocimiento de Python que ya tiene para el backend y el servicio de sync,
  y React + Vite da acceso al ecosistema más maduro de PWA/service workers y de librerías de mapas
  (relevante para el flujo de marcador geoespacial, sección 6 del PRD).
- FastAPI no trae panel de administración ni auth de fábrica como Django: habrá que construir (o
  adoptar una librería externa para) la gestión de catálogos internos (Unidades SSEI, Pre-PAI) y el
  control de acceso por rol que exige el PRD (sección 7), en vez de heredarlo del framework.
