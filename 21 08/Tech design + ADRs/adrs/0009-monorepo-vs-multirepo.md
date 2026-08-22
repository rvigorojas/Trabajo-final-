# ADR 9: Un solo repositorio para los tres componentes

## Estado

Aceptado (2026-08-21) — formaliza una decisión implícita desde el inicio del proyecto.

## Contexto

ADR-1 divide el sistema en tres componentes (cliente PMM, cliente COE, backend) pero, pese a su
título, **nunca decidió explícitamente cuántos repositorios los alojan**. En la práctica los tres
viven en un solo repo desde el primer commit, sin que esa elección quedara registrada ni
justificada.

El criterio de la sesión 10 del curso para decidir si algo necesita su propio repo son tres
preguntas: **¿tiene un ciclo de deploy propio? ¿un stack distinto? ¿una capacidad de plataforma que
los demás no tienen?** Aplicadas a este proyecto, dos de las tres dan "sí":

| Componente | ¿Ciclo de deploy propio? | ¿Stack distinto? | ¿Capacidad de plataforma propia? |
|---|---|---|---|
| Backend | **Sí** — Cloud Run, imagen Docker por SHA | **Sí** — Python 3.12 / FastAPI | No |
| Cliente COE | **Sí** — Firebase Hosting, sitio `pce-jorge-chavez` | No — TS/React, comparte tooling con PMM | No |
| Cliente PMM | **Sí** — Firebase Hosting, sitio `pce-jorge-chavez-pmm` | No — mismo stack que COE | **Sí** — service worker + IndexedDB (offline-first, ADR-4/ADR-6) |

Con ese resultado, un multirepo sería defendible. La decisión de no hacerlo necesita argumento
propio, no inercia.

## Decisión

**Los tres componentes se mantienen en un único repositorio** (`rvigorojas/Trabajo-final-`), con
el frontend organizado como monorepo interno de npm workspaces (`frontend/apps/coe`,
`frontend/apps/pmm`, `frontend/packages/api-client`) y el backend como carpeta hermana
(`backend/`).

Los ciclos de deploy siguen siendo independientes **dentro** del mismo repo: `.github/workflows/
ci.yml` define `deploy-backend` (gated por los tests del backend) y `deploy-frontend` (gated por
los del frontend) como jobs separados. Repo único no significa deploy acoplado.

## Razones

1. **El contrato entre componentes es el activo más frágil del sistema, y acá se verifica en cada
   commit.** `@pce/api-client` define los tipos TypeScript espejo de los schemas del backend. En un
   multirepo, un cambio de enum en `app/models/usuario.py` y su reflejo en `types.ts` viajarían en
   dos PRs de dos repos, con una ventana real de desincronización. En un solo repo van en el mismo
   commit y el mismo CI los prueba juntos. Esto ya evitó problemas concretos: cuando la matriz de
   convocatoria agregó 9 roles al enum `Rol`, el tipo espejo se actualizó en el mismo cambio.

2. **Equipo de 1-3 personas (ADR-4).** El costo de un multirepo —coordinar versiones, publicar el
   paquete de tipos, mantener N pipelines, sincronizar N `CLAUDE.md`— se paga con trabajo de
   coordinación que este equipo no tiene capacidad de sostener. La sesión 11 lo define al revés:
   brownfield es "más de una persona, entrando y saliendo del equipo". Este proyecto todavía no es
   eso.

3. **El "sí" del cliente PMM es una capacidad del navegador, no de la plataforma.** El service
   worker y el IndexedDB corren dentro del mismo bundle de Vite, con el mismo tooling y el mismo
   deploy que el COE. No es el caso de `launcher-desktop` de Armory, que necesita hotkey global y
   portapapeles del sistema operativo — ahí la frontera es real. Acá es una diferencia de
   configuración (`vite-plugin-pwa` en `apps/pmm`, no en `apps/coe`), no de plataforma.

4. **Un solo contexto para el agente.** Un `CLAUDE.md` que ve backend y frontend a la vez puede
   razonar sobre el contrato completo. En multirepo harían falta un `CLAUDE.md` padre y tres
   hijos, con el mapa del ecosistema duplicado y desincronizándose (el problema que la sesión 10
   dedica media clase a resolver).

## Alternativas consideradas

- **Tres repos independientes (backend, coe, pmm) + un paquete publicado de tipos.** Es la opción
  correcta si el equipo crece y cada componente pasa a tener dueño propio. Se descarta hoy porque
  obliga a publicar y versionar `@pce/api-client` como paquete real (npm o registry privado) solo
  para que dos apps que despliega la misma persona compartan tipos.
- **Dos repos: backend y frontend.** Cortaría por la frontera de stack, que es la más nítida. Se
  descarta por la razón 1: esa frontera es exactamente donde vive el contrato que más se rompe, y
  separarla es perder la verificación conjunta en CI justo donde más se necesita.

## Consecuencias

- El repo crece con código de dos stacks; quien clona baja todo aunque solo toque uno. Aceptable
  al tamaño actual.
- El historial de git mezcla commits de backend y frontend. Se mitiga con mensajes que nombran el
  componente afectado.
- **Disparador de revisión:** si un componente pasa a tener un dueño distinto del resto, o si un
  cuarto componente necesita una capacidad de plataforma real (una app nativa para las tablets, por
  ejemplo, en vez de la PWA actual), esta decisión debe reevaluarse. El criterio de las tres
  preguntas de la sesión 10 es el que hay que volver a aplicar.
