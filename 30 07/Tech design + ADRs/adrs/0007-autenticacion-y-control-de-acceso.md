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

**Token "blando" durante offline prolongado (resuelve conflicto detectado en revisión adversarial,
2026-07-21):** la expiración corta por sí sola bloquearía al CI en pleno incidente si el dispositivo
permanece sin señal más tiempo del que dura el token — exactamente el escenario que ADR-1 obliga a
soportar. Para evitarlo: el cliente PMM sigue aceptando y encolando acciones localmente aunque el
token ya haya expirado, siempre que el dispositivo siga sin conexión (no hay forma de renovarlo de
todas formas). Si, además, la desconexión superó una **ventana máxima de sesión offline de 24
horas (confirmado con Renzo, 2026-08-12)**, el cliente exige relogin antes de permitir encolar
*nuevas* acciones posteriores a la reconexión (las ya encoladas dentro de la ventana no se pierden
ni se bloquean).

**Nota de resolución (hueco 6.4, confirmado con Renzo, 2026-08-12):** al reconectar con el JWT ya
vencido, el módulo de sincronización del backend **no** gana un mecanismo especial para aceptar
tokens expirados (la intención original de este ADR, "el backend acepta sin objeción las acciones
ya encoladas...", se resolvió distinto). En cambio, el Cliente PMM detecta el token vencido al
reconectar y exige relogin antes de reenviar la cola. Las acciones ya encoladas no se pierden —
quedan en IndexedDB hasta que hay sesión válida, y se sincronizan solas contra el mismo POST
idempotente en cuanto el usuario vuelve a loguearse. El backend sigue validando JWT sin excepción
en cada request, sin cambios.

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
- El token "blando" (arriba) amplía esa ventana de revocación tardía hasta el largo de la ventana
  máxima de sesión offline (24h) en el peor caso — un usuario revocado que quedó sin señal justo
  antes de la revocación puede seguir encolando acciones válidas hasta reconectar o hasta agotar
  esa ventana. Se acepta explícitamente frente a la alternativa (bloquear al CI en pleno
  incidente), pero es un trade-off de seguridad real, no gratuito.
