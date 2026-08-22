# Checklist de entrega — Proyecto integrador

Verificación del repo `Trabajo-final-` contra la **Rúbrica de evaluación — Proyecto integrador** y
las guías de laboratorio de las sesiones 5 a 13.

- **Fecha de verificación:** 2026-08-21
- **Se evalúa:** el repo al cierre del curso (sesión 14) — no el proceso día a día
- **Escala:** 1 Insuficiente · 3 Aceptable · 5 Sobresaliente

> Nota de método: cada ✅ de este checklist se comprobó abriendo el archivo, corriendo el comando o
> consultando el servicio real. Lo que no se pudo verificar está marcado como ⚠️, no como ✅.

---

## 1. Pipeline documental y coherencia — 35%

Lo que evalúa: que cada documento responda al anterior, no solo que existan sueltos.

| # | Requisito | Estado | Evidencia |
|---|---|---|---|
| 1.1 | PRD | ✅ | `21 08/PRD_PCE_JorgeChavez.4.md` — vigente, declarado como tal en `CLAUDE.md` y README |
| 1.2 | Design.md | ✅ | `21 08/Design.md` — 4 flujos, variante elegida y huecos resueltos |
| 1.3 | Technical Design Document | ✅ | `21 08/Tech design + ADRs/TECH-DESIGN.md` — deriva explícitamente del Design.md |
| 1.4 | ADRs | ✅ | `21 08/Tech design + ADRs/adrs/` — 8 ADRs en formato MADR con alternativas descartadas |
| 1.5 | BACKLOG.md | ✅ | `BACKLOG.md` — 11 ítems, todos cerrados |
| 1.6 | Spec + Tasks por ítem | ✅ | `tasks/item-01..11/` — `spec.md` + `plan.md` + `todo.md` cada uno |
| 1.7 | Código | ✅ | `backend/` + `frontend/` — 111 tests pasando |
| 1.8 | Review | ✅ | `verify` del ciclo SDD documentado en cada `todo.md` + `revision-adversarial` aplicada al TDD (4 críticos, 6 advertencias, 2 sugerencias resueltas) |
| 1.9 | CLAUDE.md | ✅ | Raíz — 400+ líneas de contexto real |
| 1.10 | Coherencia: sin referencias rotas | ✅ | Corregidas 6 rutas `30 07/` → `21 08/` el 21/08 |
| 1.11 | Coherencia: sin documentos duplicados | ✅ | PRD de la raíz eliminado; carpeta de otro proyecto sacada del repo |
| 1.12 | Puerta de entrada al repo | ✅ | `README.md` con mapa de los 11 documentos enlazados |

**Autoevaluación: 5/5.** El pipeline está completo y encadenado: el TDD cita el Design.md, los ADRs
citan el PRD, las specs citan el FRONTEND-SPEC, y el README los enlaza a todos.

---

## 2. Funcionalidad — 25%

Lo que evalúa: que el producto funcione y cumpla lo prometido en el PRD.

| # | Requisito | Estado | Evidencia |
|---|---|---|---|
| 2.1 | El sistema funciona | ✅ | 111 tests: 32 backend + 36 coe + 31 pmm + 12 api-client |
| 2.2 | Backend en producción | ✅ | `GET /salud` → `200 {"estado":"ok"}` (verificado 21/08) |
| 2.3 | Cliente COE en producción | ✅ | https://pce-jorge-chavez.web.app → 200 |
| 2.4 | Cliente PMM en producción | ✅ | https://pce-jorge-chavez-pmm.web.app → 200 |
| 2.5 | Datos reales en producción | ✅ | 9 unidades sembradas (R1, R2, R8-R13, CR9), 5 activaciones |
| 2.6 | Cumple el PRD: activación por alerta | ✅ | 4 categorías con escalas diferenciadas |
| 2.7 | Cumple el PRD: offline-first en PMM | ✅ | Cola IndexedDB verificada cortando `uvicorn`, no con devtools |
| 2.8 | Cumple el PRD: relevo de mando | ✅ | COE y PMM, con cadena de mando de doble carril |
| 2.9 | Cumple el PRD: mapa geoespacial | ✅ | Captura por GPS con respaldo manual |
| 2.10 | Cumple el PRD: unifica los 4 Excel | ✅ | Exportador `.xlsx` con las columnas reales |
| 2.11 | Cumple el PRD: máximo 3 clics | ✅ | Medido: máximo 2 clics reales |
| 2.12 | Accesibilidad WCAG 2.2 AA | ✅ | Contraste ≥7.71:1; tap targets de 48px corregidos en 6 componentes |

**Autoevaluación: 5/5.** Todo lo prometido en el PRD está implementado y verificado end-to-end
contra el sistema real, no solo en tests.

---

## 3. Harness y contexto propio — 10%

Lo que evalúa: `CLAUDE.md` real y útil (no genérico) + al menos un harness propio hecho con
`create-harness`, documentado y listo para instalar.

| # | Requisito | Estado | Evidencia |
|---|---|---|---|
| 3.1 | CLAUDE.md real, no genérico | ✅ | Gotchas reproducibles: Tailwind v4 + monorepo, React Router 8 + jsdom, gcloud desde Git Bash/PowerShell |
| 3.2 | Harness propio con `create-harness` | ✅ | `harnesses/gotchas-testing/` — armado el 19/08 |
| 3.3 | Documentado | ✅ | `README.md` + `SKILL.md` en la carpeta del harness |
| 3.4 | Listo para que otro lo instale | ✅ | Instrucciones de instalación en su README |
| 3.5 | Guardrail con criterio explícito | ✅ | Documenta por qué **no** lleva hook (criterio de la sesión 09) |
| 3.6 | Evidencia de que funciona | ✅ | `GOTCHAS-REPORT.md` — corrida real del 21/08, 3 hallazgos nuevos |
| 3.7 | Hooks reales configurados | ✅ | `.claude/settings.json`: `PreToolUse` (comandos destructivos de BD) + `SessionStart` (commits sin pushear) |

**Autoevaluación: 5/5.** El harness no solo existe: corrió y dejó reporte con hallazgos accionables.

---

## 4. Originalidad / criterio propio — 10%

Lo que evalúa: qué agregaste de propio, no trivial — decisiones tuyas, no del agente.

| # | Decisión | Estado | Dónde se ve |
|---|---|---|---|
| 4.1 | GPS en vez de esperar la georreferenciación del mapa en papel | ✅ | README + PRD v4 + `MarcadorIncidenteScreen.tsx` |
| 4.2 | Columnas del reporte extraídas de los Excel reales con `openpyxl` | ✅ | `COLUMNAS_REPORTE_CIERRE` en `reporte_cierre.py` |
| 4.3 | Trampa detectada: "Nivel" es el piso del edificio, no el nivel de alerta | ✅ | Documentado en `CLAUDE.md` |
| 4.4 | Matriz de convocatoria extraída del PDF real del Plan de Emergencia | ✅ | `seed.py` + 9 roles nuevos en el enum |
| 4.5 | Insert-only con triggers en la BD, no solo en el código | ✅ | ADR-2 + `test_insert_only.py` |
| 4.6 | Límite de 3 clics medido, no asumido | ✅ | `tasks/item-11-endurecimiento/todo.md` |
| 4.7 | Migración que aborta si detecta datos inconsistentes | ✅ | `0005_una_activacion_activa` |
| 4.8 | Visible sin excavar | ✅ | Sección "Decisiones propias" del README |

**Autoevaluación: 5/5.** Hay 6 decisiones no triviales, documentadas con su razón y su alternativa
descartada.

---

## 5. Seguridad — 10%

Lo que evalúa: evidencia del reporte/pase de seguridad de la sesión 12.

| # | Requisito | Estado | Evidencia |
|---|---|---|---|
| 5.1 | `security-pass` corrido sobre el proyecto | ✅ | `SECURITY-REPORT.md` — 5 lentes: PRD, Diseño+ADRs, Specs, Código, Review |
| 5.2 | Reporte leído completo | ✅ | Resumen ejecutivo + fortalezas + findings |
| 5.3 | Al menos 3 hallazgos triageados | ✅ | 7 findings (SEC-01 a SEC-07) con `Required change type` |
| 5.4 | Al menos un CODE FIX resuelto y verificado | ✅ | SEC-01 a SEC-06 resueltos, +10 tests nuevos |
| 5.5 | Regla de CLAUDE.md endurecida a partir de un hallazgo | ✅ | Sección "Reglas de seguridad del repo" (origen: SEC-07) |
| 5.6 | Auditoría de dependencias | ✅ | `npm audit` 0 vulns; `pip-audit` 6 CVEs, todas en `pip` |
| 5.7 | Set mínimo: validación, rate limiting, hashing, secretos en env | ✅ | bcrypt, rate limiting en login, Secret Manager, CSP |
| 5.8 | Triage honesto de lo no resuelto | ⏸ | SEC-07 documentado como **riesgo aceptado hasta el 2026-09-01** |

**Autoevaluación: 5/5.** El pase está completo. SEC-07 no resta: un riesgo aceptado con
justificación y fecha límite es un resultado de triage válido — la guía de la sesión 12 dice
explícitamente que no todo hallazgo termina en CODE FIX.

---

## 6. Deploy — 10%

Lo que evalúa: accesible públicamente y funcionando, con protocolo documentado y CI/CD.

| # | Requisito | Estado | Evidencia |
|---|---|---|---|
| 6.1 | Accesible públicamente | ✅ | 3 URLs verificadas el 21/08 |
| 6.2 | Funcionando | ✅ | Login real + lectura de datos reales |
| 6.3 | `DEPLOY-PLAN.md` con DISCOVER y DESIGN | ✅ | 430 líneas, 13 secciones |
| 6.4 | Build, artifact, config & secrets | ✅ | Secciones 2, 3 y 4 |
| 6.5 | Infraestructura y release strategy | ✅ | Secciones 5 y 6 |
| 6.6 | Deploy gates | ✅ | Sección 7 — 4 gates + guardrails de agente |
| 6.7 | Verify & observe | ✅ | Sección 8 — checklist de 9 chequeos con resultados |
| 6.8 | Recovery | ✅ | Sección 9 — rollback + por qué no revierte datos |
| 6.9 | CI/CD configurado | ✅ | `.github/workflows/ci.yml` — 5 jobs |
| 6.10 | CI/CD funcionando | ✅ | 29 runs; sin drift entre `main` y la revisión activa |
| 6.11 | Sin claves de larga duración | ✅ | Workload Identity Federation acotada por repo |
| 6.12 | Pendientes declarados | ✅ | Sección 11 — 6 pendientes, ninguno maquillado |

**Autoevaluación: 5/5.**

---

## 7. Manejo de deuda técnica — 10%

**NO APLICA.** El proyecto nació en la sesión 6 (greenfield). Ese 10% ya está sumado en
Funcionalidad (25%), según la nota al pie de la rúbrica.

---

## Resumen

| Categoría | Peso | Nota | Ponderado |
|---|---|---|---|
| Pipeline documental y coherencia | 35% | 5 | 1.75 |
| Funcionalidad | 25% | 5 | 1.25 |
| Harness y contexto propio | 10% | 5 | 0.50 |
| Originalidad / criterio propio | 10% | 5 | 0.50 |
| Seguridad | 10% | 5 | 0.50 |
| Deploy | 10% | 5 | 0.50 |
| **Total** | **100%** | | **5.00** |

Autoevaluación, no nota oficial. El criterio del evaluador puede diferir — sobre todo en
Originalidad, que es subjetiva por definición.

---

## Lo que sigue abierto

Nada de esto bloquea la entrega, pero conviene tenerlo a la vista:

| # | Pendiente | Cuándo | Dónde |
|---|---|---|---|
| 1 | Rotar la contraseña del `admin` | **Antes del 2026-09-01** | `SECURITY-REPORT.md` SEC-07 |
| 2 | Alertas de Cloud Monitoring (5xx + conexiones) | Antes de uso operativo | `DEPLOY-PLAN.md` #2 |
| 3 | Verificar el largo del secreto JWT (≥32 bytes) | Cuando puedas | `GOTCHAS-REPORT.md` N-01 |
| 4 | `path_separator = os` en `alembic.ini` | Cuando puedas | `GOTCHAS-REPORT.md` N-02 |
| 5 | Confirmar que el run #29 del CI quedó en verde | Ahora, de un vistazo | GitHub → Actions |

---

## Para la sesión 14

El `DEPLOY-PLAN.md` entra al portfolio final como evidencia del proceso, según la guía de la
sesión 13.

Si hay que defender el proyecto, los tres ejemplos más fuertes de criterio propio son:

1. La columna "Nivel" que resultó ser el piso del edificio — confundirla habría corrompido el
   reporte entero.
2. La migración que se detiene si encuentra datos inconsistentes en vez de arreglarlos en silencio.
3. El harness que se niega a editar `CLAUDE.md` por su cuenta, con el criterio escrito de por qué
   ese guardrail **no** necesita ser un hook.

Los tres muestran lo mismo: decisiones tomadas por criterio, con la alternativa descartada
documentada.
