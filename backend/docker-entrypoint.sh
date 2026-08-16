#!/bin/sh
# Sin esto, el contenedor arranca uvicorn contra una base recién creada sin tablas
# y el lifespan de app/main.py (seed_rol_convocatoria) crashea al primer arranque
# (hallazgo real probando docker-compose.yml, 2026-08-16).
set -e
alembic upgrade head
exec "$@"
