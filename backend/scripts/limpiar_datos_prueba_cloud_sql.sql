-- Limpieza de filas de prueba en Cloud SQL (pce-db, producción).
--
-- Contexto: al verificar la app en vivo (2026-08-16) quedaron 4 activaciones de
-- prueba en estado 'cerrada'. `activacion` (y evaluacion_inicial/relevo_mando/
-- marcador_incidente) son insert-only por diseño (ADR-2, migración 0002/0003):
-- un trigger de Postgres rechaza cualquier UPDATE/DELETE fuera de la única
-- transición legítima (activa->cerrada). Este script desactiva esos triggers
-- SOLO dentro de esta transacción, borra las filas de prueba (hijos primero,
-- por las FK activacion_id sin ON DELETE CASCADE) y los reactiva antes de
-- hacer COMMIT.
--
-- Uso manual, uno mismo, nunca automatizado:
--   gcloud sql connect pce-db --user=pce --project=pce-jorge-chavez --database=pce
--   (contraseña: la del secreto pce-database-url en Secret Manager)
--   \i backend/scripts/limpiar_datos_prueba_cloud_sql.sql
--
-- El script para solo en el SELECT de preview (paso 1) — revisar el resultado
-- a mano antes de escribir \q o de seguir pegando el resto del archivo. No
-- corre el DELETE ni el COMMIT solo.

BEGIN;

-- 1) PREVIEW — confirmar que son EXACTAMENTE estas 4 filas de prueba y ninguna
-- otra antes de seguir. Si algo no cuadra, ROLLBACK; y avisar en vez de continuar.
SELECT id, tipo_emergencia, tipo_incidente, estado, hora_evento, created_at
FROM activacion
WHERE tipo_incidente IN (
    'Verificación Item 8 - Aeronáutica',
    'Demo: humo en cabina',
    'Walkthrough real: derrame de combustible'
)
ORDER BY created_at;

-- ⏸ PARAR ACÁ. Revisar que el resultado de arriba sean las 4 filas esperadas
-- (2 "Verificación Item 8 - Aeronáutica" + las otras 2), todas 'cerrada'.
-- Si está bien, seguir pegando desde acá para abajo en la misma sesión de psql.
-- Si no, escribir ROLLBACK; y listo, no se tocó nada.

-- 2) Desactivar los triggers insert-only, solo dentro de esta transacción
ALTER TABLE activacion DISABLE TRIGGER trg_bloquear_edicion_activacion;
ALTER TABLE evaluacion_inicial DISABLE TRIGGER trg_bloquear_edicion_evaluacion_inicial;
ALTER TABLE relevo_mando DISABLE TRIGGER trg_bloquear_edicion_relevo_mando;
ALTER TABLE marcador_incidente DISABLE TRIGGER trg_bloquear_edicion_marcador_incidente;

-- 3) Borrar hijos primero (FK activacion_id sin ON DELETE CASCADE), luego la activación
DELETE FROM convocatoria_miembro
WHERE activacion_id IN (
    SELECT id FROM activacion
    WHERE tipo_incidente IN (
        'Verificación Item 8 - Aeronáutica',
        'Demo: humo en cabina',
        'Walkthrough real: derrame de combustible'
    )
);

DELETE FROM reporte_cierre
WHERE activacion_id IN (
    SELECT id FROM activacion
    WHERE tipo_incidente IN (
        'Verificación Item 8 - Aeronáutica',
        'Demo: humo en cabina',
        'Walkthrough real: derrame de combustible'
    )
);

DELETE FROM marcador_incidente
WHERE activacion_id IN (
    SELECT id FROM activacion
    WHERE tipo_incidente IN (
        'Verificación Item 8 - Aeronáutica',
        'Demo: humo en cabina',
        'Walkthrough real: derrame de combustible'
    )
);

DELETE FROM relevo_mando
WHERE activacion_id IN (
    SELECT id FROM activacion
    WHERE tipo_incidente IN (
        'Verificación Item 8 - Aeronáutica',
        'Demo: humo en cabina',
        'Walkthrough real: derrame de combustible'
    )
);

DELETE FROM evaluacion_inicial
WHERE activacion_id IN (
    SELECT id FROM activacion
    WHERE tipo_incidente IN (
        'Verificación Item 8 - Aeronáutica',
        'Demo: humo en cabina',
        'Walkthrough real: derrame de combustible'
    )
);

DELETE FROM activacion
WHERE tipo_incidente IN (
    'Verificación Item 8 - Aeronáutica',
    'Demo: humo en cabina',
    'Walkthrough real: derrame de combustible'
);

-- 4) Reactivar los triggers (el ADR-2 vuelve a aplicar para todo lo demás)
ALTER TABLE activacion ENABLE TRIGGER trg_bloquear_edicion_activacion;
ALTER TABLE evaluacion_inicial ENABLE TRIGGER trg_bloquear_edicion_evaluacion_inicial;
ALTER TABLE relevo_mando ENABLE TRIGGER trg_bloquear_edicion_relevo_mando;
ALTER TABLE marcador_incidente ENABLE TRIGGER trg_bloquear_edicion_marcador_incidente;

-- 5) Confirmar que no queda nada (debe dar 0)
SELECT count(*) FROM activacion
WHERE tipo_incidente IN (
    'Verificación Item 8 - Aeronáutica',
    'Demo: humo en cabina',
    'Walkthrough real: derrame de combustible'
);

-- ⏸ Si el conteo de arriba dio 0 y todo se ve bien: COMMIT;
-- Si algo se ve mal: ROLLBACK; (deshace TODO, incluida la reactivación de
-- los triggers, sin dejar la base a medio camino).
