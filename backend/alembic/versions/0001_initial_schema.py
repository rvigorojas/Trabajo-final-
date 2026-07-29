"""Esquema inicial: todas las entidades del TDD (TECH-DESIGN.md).

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-07-28

Nota de implementación: en vez de transcribir a mano cada `op.create_table`
(alto riesgo de que quede desalineado de `app/models/*.py` sin poder correr
`alembic revision --autogenerate` contra una base real en este entorno sin
Docker), esta migración delega en `Base.metadata`, que es la única fuente de
verdad del esquema. Si el modelo cambia, esta migración deja de reflejar el
estado real y hay que generar una migración nueva (no editar esta).
"""
from typing import Sequence, Union

from alembic import op

import app.models  # noqa: F401 — registra todas las entidades en Base.metadata
from app.db.base import Base

revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    Base.metadata.create_all(op.get_bind())


def downgrade() -> None:
    Base.metadata.drop_all(op.get_bind())
