-- Crear el primer usuario admin real en Cloud SQL (pce-db, producción).
--
-- Contexto: el security-pass del 2026-08-19 (SEC-01) restringe POST /usuarios
-- a requerir rol admin, salvo que la tabla `usuario` esté vacía (bootstrap del
-- primer admin sin auth). La tabla real de Cloud SQL ya tiene usuarios de
-- sesiones de verificación anteriores, así que ese bootstrap no se dispara ahí
-- — hace falta insertar el primer admin directo en la base, una sola vez.
--
-- Uso manual, uno mismo, nunca automatizado:
--   gcloud sql connect pce-db --user=pce --project=pce-jorge-chavez --database=pce
--   (contraseña: la del secreto pce-database-url en Secret Manager)
--   \i backend/scripts/crear_admin_cloud_sql.sql
--
-- El script para en el SELECT de preview (paso 1) — confirmar que no exista ya
-- un admin antes de insertar. No corre el INSERT ni el COMMIT solo.

BEGIN;

-- 1) PREVIEW — confirmar que no hay ya un usuario admin (evitar duplicados).
SELECT id, username, rol, activo FROM usuario WHERE rol = 'ADMIN';

-- ⏸ PARAR ACÁ. Si ya aparece una fila con rol ADMIN, este script no hace
-- falta — escribir ROLLBACK; y avisar. Si la lista vino vacía, seguir pegando
-- desde acá para abajo en la misma sesión de psql.

-- 2) Insertar el primer admin. UUID y hash de password (bcrypt de "admin1234",
-- confirmado con el usuario) generados localmente con
-- app.core.security.hash_password el 2026-08-19 — nunca en texto plano.
INSERT INTO usuario (id, nombre, username, rol, instancia_principal, contacto, password_hash, activo)
VALUES (
    '1d5fed0f-8907-43bc-9b10-a3fa5cf789be',
    'Administrador PCE',
    'admin',
    'ADMIN',
    'COE',
    NULL,
    '$2b$12$GQDZG9qRZNxUx6GuUhImL.iXruI.Iq4hMuRrS4Z448qT4Af6AsWMO',
    true
);

-- 3) Confirmar que quedó insertado (debe dar 1 fila).
SELECT id, username, rol, activo FROM usuario WHERE username = 'admin';

-- ⏸ Si la fila de arriba se ve bien: COMMIT;
-- Si algo se ve mal: ROLLBACK;
