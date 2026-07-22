# ADR 7: Autenticación y control de acceso por rol

## Estado

Aceptado

## Contexto

El PRD (sección 7) exige acceso diferenciado por rol: la edición de la evaluación inicial y del
relevo de mando queda reservada al CI (PMM) y al Coordinador/suplentes (COE); otros roles (M4/M7,
Supervisor de Rescate) solo registran o consultan según su función. Este requisito no estaba en la
lista base de decisiones, pero el PRD lo fuerza explícitamente. Se cruza además con el requisito
offline (ADR 1): el cliente PMM puede necesitar seguir operando y encolando escrituras durante
períodos sin conexión, sin poder validar contra el backend en ese momento.

## Decisión

JWT (JSON Web Tokens) con expiración corta, emitido por el backend en el login y almacenado
localmente en el cliente. El rol y los permisos del usuario viajan como claims dentro del token, lo
que permite al cliente PMM validar localmente qué acciones puede encolar mientras está offline, sin
depender de una consulta al servidor.

## Alternativas consideradas

- **Sesiones server-side (cookies + store)** — daría revocación inmediata de acceso. No se eligió
  porque el cliente PMM no podría validar ni firmar operaciones localmente sin contactar al
  servidor, un mal ajuste directo con el diseño offline-first de ADR 1.
- **SSO corporativo (integración con IdP de LAP)** — reutilizaría el directorio de usuarios
  existente de LAP si lo tienen, evitando mantener una base de usuarios aparte. No se eligió como
  decisión única porque suma una dependencia externa fuera del control del equipo del proyecto y,
  por sí sola, no resuelve el caso offline sin combinarse con JWT o sesiones de todos modos.

## Consecuencias

- El cliente PMM puede autenticar y autorizar operaciones localmente durante toda la ventana de
  desconexión, sin bloquear al CI en el momento crítico.
- Revocar el acceso de un usuario (ej. cambio de rol a mitad de una emergencia) no toma efecto de
  inmediato: el usuario conserva los permisos codificados en su token hasta que este expira. La
  expiración debe elegirse deliberadamente corta para acotar esta ventana, balanceando seguridad
  contra la necesidad de no forzar reautenticaciones frecuentes en pista.
