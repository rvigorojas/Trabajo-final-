"""Genera el hash bcrypt de una contraseña, sin que la contraseña quede escrita en ningún lado.

Contexto: SEC-07 (2026-08-21). La contraseña del admin de producción terminó escrita en claro
en un comentario de `crear_admin_cloud_sql.sql`, en un repositorio público. Este script existe
para que eso no vuelva a pasar: la contraseña se tipea, nunca se pega en un archivo ni en un
argumento de línea de comandos (que quedaría en el historial del shell).

Uso, desde `backend/` con el venv activo:

    python scripts/generar_hash_password.py

Pide la contraseña dos veces (no se ve al tipear) e imprime solo el hash. Ese hash es lo único
que se pega en el UPDATE de `rotar_password_admin_cloud_sql.sql`.

Regla: el valor de la contraseña no se guarda, no se comparte por chat ni por mail, y no se
escribe en ningún archivo del repo — tampoco en un comentario. Ver CLAUDE.md, sección
"Reglas de seguridad del repo".
"""

import getpass
import sys

from app.core.security import hash_password

MINIMO = 12  # más exigente que el min_length=8 de SEC-04: es una cuenta administrativa


def main() -> int:
    password = getpass.getpass("Contraseña nueva: ")
    if len(password) < MINIMO:
        print(f"Muy corta: mínimo {MINIMO} caracteres para una cuenta admin.", file=sys.stderr)
        return 1
    if password != getpass.getpass("Repetir: "):
        print("No coinciden.", file=sys.stderr)
        return 1

    print("\nHash bcrypt (pegar en el UPDATE, sin las comillas externas):\n")
    print(hash_password(password))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
