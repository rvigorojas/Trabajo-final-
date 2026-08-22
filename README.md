# PCE — Puesto de Comando y Administración de Emergencias

**Aeropuerto Internacional Jorge Chávez (LIM) · SSEI / Lima Airport Partners**

Digitaliza el Plan de Emergencia del AIJC (GSEG-L-001): la activación diferenciada de COE y PMM
por nivel de alerta, la evaluación inicial del Comandante de Incidente, los Pre-PAI como plantillas
activables, el relevo de mando y el mapa geoespacial del incidente.

Hoy eso vive en llamadas telefónicas, grupos de WhatsApp y **4 Excel separados** (Aeronáutica,
Epidemiológica, Estructural/Incidentes, MATPEL) que Rescate mantiene a mano. El PCE los unifica bajo
un solo flujo y exporta el mismo `.xlsx` que reemplaza a esos cuatro.

| | |
|---|---|
| **Cliente COE** (Sala de Crisis) | https://pce-jorge-chavez.web.app |
| **Cliente PMM** (tablet GETAC, en pista) | https://pce-jorge-chavez-pmm.web.app |
| **API** | https://pce-backend-276453531381.southamerica-west1.run.app |
| **Salud del backend** | `GET /salud` → `{"estado":"ok"}` |

---

## Las dos instancias de mando

El sistema tiene dos clientes porque el Plan de Emergencia define dos instancias reales, con
necesidades opuestas:

- **COE** — estratégico y fijo, en la Sala de Crisis. Siempre online. Dashboard con polling cada
  3 segundos: resumen, mapa, unidades, cadena de mando, Pre-PAI y reportes.
- **PMM** — táctico y móvil, en el sitio del incidente, sobre tablet GETAC. **Offline-first**: si
  se pierde la señal en pista, sigue registrando y sincroniza al reconectar.

Ese requisito offline es el que moldea toda la arquitectura — no es un extra, es la restricción
que decidió el modelo de datos, la división de componentes y la estrategia de sincronización.

---

## Stack

| Capa | Tecnología |
|---|---|
| Backend | FastAPI (Python 3.12), SQLAlchemy async, Alembic |
| Base de datos | PostgreSQL 16 |
| Frontend | React + Vite + TypeScript, monorepo npm workspaces |
| PWA del PMM | `vite-plugin-pwa`, IndexedDB para la cola offline |
| UI | Tailwind v4 + design tokens propios, Radix UI |
| Infraestructura | Cloud Run · Cloud SQL · Secret Manager · Artifact Registry · Firebase Hosting |
| CI/CD | GitHub Actions con Workload Identity Federation (sin claves JSON) |

---

## Cómo correrlo

### Todo junto (recomendado)

```bash
cp .env.example .env
docker compose up -d --build
curl http://localhost:8000/salud     # → {"estado":"ok"}
```

Las migraciones corren solas al arrancar el contenedor (`backend/docker-entrypoint.sh`).

### Backend suelto

```bash
cd backend
pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload
pytest                                # 32 tests contra PostgreSQL real, no SQLite
```

### Frontend

```bash
cd frontend
npm ci
npm run dev --workspace apps/coe      # Cliente COE
npm run dev --workspace apps/pmm      # Cliente PMM
npm run test --workspaces             # 36 (coe) + 31 (pmm) + 12 (api-client)
```

---

## Mapa de documentos

El pipeline documental, en el orden en que se construyó — cada documento responde al anterior:

| Documento | Qué contiene |
|---|---|
| [`21 08/PRD_PCE_JorgeChavez.4.md`](21%2008/PRD_PCE_JorgeChavez.4.md) | **PRD vigente.** Problema, usuarios, alcance, criterios de éxito medibles |
| [`21 08/Design.md`](21%2008/Design.md) | Los 4 flujos de UX con la variante elegida y sus huecos resueltos |
| [`21 08/Tech design + ADRs/TECH-DESIGN.md`](21%2008/Tech%20design%20+%20ADRs/TECH-DESIGN.md) | Diseño técnico: componentes, modelo de datos, resiliencia offline |
| [`21 08/Tech design + ADRs/adrs/`](21%2008/Tech%20design%20+%20ADRs/adrs/) | 8 ADRs en formato MADR, con alternativas descartadas y por qué |
| [`BACKLOG.md`](BACKLOG.md) | Los 11 ítems del frontend — **todos cerrados** |
| [`tasks/item-NN-*/`](tasks/) | Un ciclo SDD por ítem: `spec.md` + `plan.md` + `todo.md` |
| [`SECURITY-REPORT.md`](SECURITY-REPORT.md) | Security pass: 7 findings con evidencia, triage y estado de remediación |
| [`DEPLOY-PLAN.md`](DEPLOY-PLAN.md) | Protocolo de despliegue y verificación contra producción real |
| [`CLAUDE.md`](CLAUDE.md) | Contexto persistente del proyecto: convenciones, gotchas, decisiones |
| [`21 08/Manual de Usuario/`](21%2008/Manual%20de%20Usuario/) | Manual para el usuario final, con capturas |
| [`21 08/bitacora-de-desarrollo.md`](21%2008/bitacora-de-desarrollo.md) | Bitácora del proceso |

---

## Decisiones propias

Lo que no salió de un patrón genérico, sino de mirar el problema real:

**Georreferenciación por GPS en vez de esperar el levantamiento del mapa en papel.**
El AIJC ubica los incidentes sobre un mapa cuadriculado impreso. Georreferenciarlo formalmente
era un proyecto aparte que nunca iba a arrancar. Decisión: el marcador captura la posición con el
GPS de la propia tablet GETAC al registrarse, con input manual de respaldo. El COE ya ubicaba
cualquier marcador con lat/lon sobre la foto satelital, así que los incidentes quedan
georreferenciados de punta a punta sin depender de un levantamiento que no se iba a hacer.

**Las columnas del reporte salen de los Excel reales, no de una copia parafraseada.**
Se descargaron los 4 "Cuadro Estadístico de Emergencias" reales del Drive de LAP y se extrajeron
sus encabezados exactos con `openpyxl` — orden y tildes incluidos. El exportador itera esa lista
en Python, no las claves del JSONB (Postgres no garantiza el orden de claves de un objeto).
Trampa encontrada en el camino: la columna "Nivel" de esos Excel es el **piso del edificio**
("Piso 3 (P30)"), no el nivel de alerta. Confundirlas habría corrompido el reporte entero.

**La matriz de convocatoria salió del Plan de Emergencia real.**
Se extrajo la lista de miembros del COE/PMM por nivel de alerta del PDF oficial (GSEG-L-001,
§ 4.2.2 + Anexo 1), lo que obligó a agregar 9 roles que el modelo no tenía. El plan no define
matriz para las 3 categorías no aeronáuticas: se aplicó la aeronáutica a las cuatro, documentado
como supuesto explícito y **confirmado después con el Jefe de Rescate**.

**Insert-only con triggers en la base, no solo en el código.**
Un registro de emergencia no se edita: se corrige con un registro nuevo. El trigger permite
únicamente `activa → cerrada` y verifica que ningún otro campo cambie. Se aplica aunque alguien
se conecte directo a la base — de hecho bloqueó un intento legítimo de limpiar datos de prueba,
que es exactamente lo que debía hacer.

**El límite de 3 clics del PRD se midió, no se asumió.**
Conteo real de clics desde la pantalla principal de cada cliente: máximo 2. Auditoría de contraste
WCAG 2.2 AA: todos los pares en uso dan ≥7.71:1. La auditoría de tap targets encontró un problema
sistemático real — los `<button>` tenían el token de 48px, pero los `<input>`/`<select>` de los
formularios operativos no tenían altura mínima. Se corrigieron 6 componentes.

**Guardrails como reglas duras, no como instrucciones.**
Un hook `PreToolUse` intercepta `DISABLE TRIGGER`, `DELETE FROM` y `gcloud sql ... delete|patch`
antes de que se ejecuten. Otro hook avisa al abrir sesión si hay commits sin pushear. El criterio:
si el costo de fallar una vez es alto (borrar datos, tocar producción), va como hook; si es una
preferencia de estilo, alcanza con una línea en las reglas.

---

## Harness propio

[`harnesses/gotchas-testing/`](harnesses/gotchas-testing/) — revisión de gotchas de testing.
Corre la suite completa, confirma si cada gotcha documentado en `CLAUDE.md` sigue vigente, detecta
nuevos y escribe un reporte. **Nunca edita `CLAUDE.md` por su cuenta** — eso lo decide un humano.

Deliberadamente sin hook: el guardrail quedó como instrucción dentro del skill porque es
reversible con `git revert` y no toca producción. Instalación en el `README.md` del harness.

---

## Estado

Los 11 ítems del backlog están cerrados y el sistema está desplegado y operativo. Verificado
contra producción real el 2026-08-21: 9 unidades sembradas, migraciones al día, sin drift entre
el repositorio y lo que corre en Cloud Run.

Fuera de alcance de esta v1, por decisión explícita: posición en vivo de las unidades sobre el
mapa, y el módulo de Comunicaciones (sin entidad de datos definida). Los pendientes técnicos
abiertos están en [`DEPLOY-PLAN.md`](DEPLOY-PLAN.md) sección 11 y en
[`SECURITY-REPORT.md`](SECURITY-REPORT.md) — ninguno se da por resuelto sin evidencia.
