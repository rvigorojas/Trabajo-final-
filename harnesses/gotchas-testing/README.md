# Harness: Revisión de gotchas de testing

Armado con `create-harness` el 2026-08-19, sobre el proyecto PCE Jorge Chávez.

## Qué hace

Corre la suite completa (backend + frontend), confirma si cada gotcha de testing ya
documentado en `CLAUDE.md` sigue vigente contra el código actual, detecta gotchas
nuevos que hayan aparecido, y escribe `GOTCHAS-REPORT.md` en la raíz del repo. Nunca
edita `CLAUDE.md` por su cuenta — eso lo decide un humano a partir del reporte.

## Piezas

Una sola: `SKILL.md` en esta misma carpeta.

No tiene hook. El único guardrail que se definió ("nunca editar `CLAUDE.md` solo")
quedó como instrucción dentro del propio skill, no como hook de `PreToolUse` — es
reversible con `git diff`/revert y no toca producción, así que no cumple el criterio
de "regla dura" ya usado en este proyecto (sesión 09: hook solo si el costo de que
falle una vez es alto — borrar datos, publicar algo, tocar producción).

## Cómo activarlo en tu propia máquina

1. Copiá `SKILL.md` a `.claude/skills/gotchas-testing-review/SKILL.md` (o el path que
   tu setup de Claude Code use para descubrir skills de proyecto — `.claude/skills/`
   y `.agents/skills/` están gitignoreados en este repo, así que cada quien lo activa
   localmente).
2. Invocalo pidiendo algo como "revisá los gotchas de testing de este proyecto".

**Ya activado en esta sesión**: se copió a
`.claude/skills/gotchas-testing-review/SKILL.md`, invocable ahora mismo.

## Repetir el proceso para otro harness

Este mismo proceso (`create-harness`, una pregunta a la vez: propósito → contexto →
workflow → output → guardrails) sirve para armar otro harness de un solo propósito
distinto — por ejemplo uno de deploy, o de bug-fixing. Correr la skill de nuevo, una
vez por concern.
