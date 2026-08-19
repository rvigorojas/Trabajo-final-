---
name: gotchas-testing-review
description: Revisa periódicamente los gotchas de testing documentados en CLAUDE.md del proyecto PCE Jorge Chávez, confirma cuáles siguen vigentes contra el código actual, detecta gotchas nuevos aparecidos en la corrida, y escribe GOTCHAS-REPORT.md. Use when the user asks to review testing gotchas, check if documented test quirks still apply, or run a periodic technical-debt-on-tests pass for this project.
---

# Revisión de gotchas de testing — PCE Jorge Chávez

## Propósito

Harness de un solo propósito: mantener al día la lista de gotchas de testing ya
documentados en `CLAUDE.md`, sin dejar que queden obsoletos ni que aparezcan gotchas
nuevos sin anotar.

## Contexto a leer siempre

- La sección de gotchas de `CLAUDE.md` (raíz del repo) — los ya conocidos: React
  Router 8 + jsdom, Tailwind v4 + monorepo, el teardown de tests que hace `alembic
  downgrade base`, y los que se hayan sumado después.
- `backend/tests/conftest.py`
- `frontend/apps/coe/vitest.config.ts`
- `frontend/apps/pmm/vitest.config.ts`
- `.github/workflows/ci.yml`

## Workflow

1. Correr la suite completa de backend (`cd backend && ./.venv/Scripts/python.exe -m
   pytest -q`, o el intérprete real del venv si cambia) y de frontend (`cd frontend
   && npm run test --workspaces --if-present`).
2. Para cada gotcha ya documentado en `CLAUDE.md`, confirmar contra el código actual
   si la condición que lo dispara sigue existiendo (ejemplo: ¿`vitest.config.ts` de
   `coe` sigue en `happy-dom`? ¿el teardown de `conftest.py` sigue haciendo `alembic
   downgrade base`?). Marcar cada uno como **vigente** o **ya no aplica**, con el
   archivo/línea que lo confirma.
3. Buscar gotchas nuevos: cualquier fricción real encontrada durante la corrida del
   paso 1 que no esté ya documentada (un warning nuevo, un fallo intermitente, un
   workaround que hubo que aplicar para que la suite corriera).
4. Escribir `GOTCHAS-REPORT.md` en la raíz del repo con tres secciones: **Vigentes**,
   **Ya no aplican**, **Nuevos detectados** — cada entrada con archivo:línea de
   evidencia, no una afirmación sin respaldo.

## Guardrail

Este harness **nunca edita `CLAUDE.md` directamente** — solo escribe
`GOTCHAS-REPORT.md`. Actualizar la sección de gotchas de `CLAUDE.md` a partir del
reporte es una decisión humana, punto por punto, no automática. (No es un hook: es
una instrucción de este mismo skill — editar un `.md` en un repo con git es
reversible y no toca producción, no tiene el costo alto que justificaría una regla
dura per el criterio de la sesión 09.)

## Output

`GOTCHAS-REPORT.md` en la raíz del repo. Nada más se modifica.
