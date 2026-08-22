-- Rotar la contraseña del usuario `admin` en Cloud SQL (pce-db, producción).
--
-- Contexto: SEC-07 (2026-08-21, CRITICAL). La contraseña original quedó escrita en claro en un
-- comentario de `crear_admin_cloud_sql.sql`, en un repositorio público, y se confirmó en vivo
-- que permitía loguearse como ADMIN contra el backend real desde internet. Borrar esa línea no
-- remedia nada por sí solo: el valor quedó en el historial de git. La única remediación real es
-- rotar la credencial — esto.
--
-- Uso manual, uno mismo, nunca automatizado:
--   1) Generar el hash de la contraseña nueva SIN escribirla en ningún lado:
--        cd backend && python scripts/generar_hash_password.py
--   2) Conectarse a la base de producción:
--        gcloud sql connect pce-db --user=pce --project=pce-jorge-chavez --database=pce
--        (contraseña de la base: la del secreto pce-database-url en Secret Manager)
--   3) Pegar este script, reemplazando el placeholder por el hash del paso 1.
--
-- La contraseña nueva NO se escribe acá, ni en un comentario, ni en el mensaje de commit.
-- Solo viaja el hash. Ver CLAUDE.md, sección "Reglas de seguridad del repo".

BEGIN;

-- 1) PREVIEW — confirmar que existe exactamente un admin y ver su hash actual.
SELECT id, username, rol, activo, left(password_hash, 12) AS hash_actual_prefijo
FROM usuario
WHERE rol = 'ADMIN';

-- ⏸ PARAR ACÁ. Confirmar que la fila es la esperada antes de seguir.

-- 2) Rotar. Reemplazar <PEGAR_HASH_NUEVO_ACA> por la salida de generar_hash_password.py.
UPDATE usuario
SET password_hash = '<PEGAR_HASH_NUEVO_ACA>'
WHERE username = 'admin' AND rol = 'ADMIN';

-- 3) Confirmar que cambió (el prefijo debe ser distinto al del paso 1, y updated_at reciente).
SELECT id, username, rol, activo, left(password_hash, 12) AS hash_nuevo_prefijo, updated_at
FROM usuario
WHERE username = 'admin';

-- ⏸ Si la fila se ve bien: COMMIT;
-- Si algo se ve mal: ROLLBACK;

-- 4) DESPUÉS del COMMIT, verificar desde afuera que la contraseña vieja ya no sirve.
--    Debe devolver 401:
--      curl -s -o /dev/null -w "%{http_code}\n" -X POST \
--        https://pce-backend-276453531381.southamerica-west1.run.app/auth/login \
--        -H "Content-Type: application/json" \
--        -d '{"username":"admin","password":"<LA_VIEJA>"}'
--    Y que la nueva sí (200 con access_token). Si el backend devuelve 429, es el rate limiting
--    de SEC-02 — esperar 60 segundos y reintentar.
