# Inventario simplificado del sistema CERNACE

Versión condensada del análisis, organizada en **8 módulos principales**. Todo dato
está respaldado con `archivo:línea`. La versión extensa está en
`CERNACE_inventario.md`.

Aplicación **única** (un `package.json`, un `src/app`) con tres zonas de ruteo:
sitio público, panel administrativo y portal del padrino.

---

## 1. Ficha técnica

| Elemento | Valor | Dónde consta |
|---|---|---|
| Lenguaje | TypeScript 5.9.3, modo `strict` | `package.json:32`, `tsconfig.json:3-16` |
| Framework | Next.js 16.3.0 (App Router, React Server Components) | `package.json:19` |
| Interfaz | React 19.2.8, Tailwind CSS 4.3.3, `lucide-react` | `package.json:18-26` |
| Base de datos | PostgreSQL, 26 tablas y 8 enumeraciones | `prisma/schema.prisma:10-12`, `migration.sql` |
| ORM | Prisma 7.9.1 con driver adapter `@prisma/adapter-pg` | `src/lib/prisma.ts:1-11` |
| Autenticación | NextAuth v5 beta, proveedor `Credentials`, sesión JWT | `src/auth.ts:16`, `src/auth.config.ts:25` |
| Contraseñas | bcryptjs, factor de coste 10 | `src/auth.ts:40`, `src/app/(publico)/acciones.ts:100` |
| Validación | Zod 4.4.3 | `src/lib/formularios.ts` |
| Servidor web | El propio de Next (`next start`); sin nginx ni Apache | `package.json:6-8` |
| Puerto de la aplicación | NO ENCONTRADO (predeterminado de Next); PostgreSQL en `5433` | `.env.example:1` |
| Variables de entorno | `DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST` (no se transcriben valores) | `.env.example` |

**Estructura resumida**

```
prisma/     esquema, migración única y datos de demostración
src/app/    (publico)/ · admin/ · portal/ · login/ · inicio/ · sin-acceso/ · api/auth/
src/lib/    prisma · sesion (guardas y auditoría) · rbac · formularios · pasarela · fechas · utils
src/components/  sistema de interfaz propio (ui.tsx, formularios, tablas, barra lateral)
```

**Servicios externos:** solo PostgreSQL. La pasarela de pago es **simulada** por diseño
(`src/lib/pasarela.ts:41-70`). **No hay** correo SMTP, generación de PDF, almacenamiento
de archivos ni respaldos: ninguna dependencia ni código de eso existe en el proyecto.

---

## 2. Roles y control de acceso

La autorización es **por permiso, no por rol**, y siempre en el servidor.
`requirePermiso()` (`src/lib/sesion.ts:40-46`) corre al inicio de cada página protegida
**y otra vez** dentro de cada acción de escritura. `src/proxy.ts` (sustituto de
`middleware.ts` en Next 16) solo comprueba que exista sesión, no permisos
(`src/proxy.ts:11-22`).

Los 15 permisos se catalogan en `src/lib/rbac.ts:6-125` y los 5 roles en
`src/lib/rbac.ts:146-205`; el seed los inserta en las tablas `permisos`, `roles` y
`roles_permisos` leyendo ese mismo archivo (`prisma/seed.ts:9`, `:50-74`).

| Rol | Definición | Permisos | Puede ejecutar |
|---|---|---|---|
| `ADMIN` | `src/lib/rbac.ts:147-152` | Los 15 | Todo el panel y el portal |
| `DIRECCION` | `src/lib/rbac.ts:153-166` | `expediente.leer`, `expediente.clinico.leer`, `expediente.socioeconomico.leer`, `documentos.leer`, `seguimiento.leer`, `donaciones.leer`, `auditoria.leer` | Lectura del panel completo más la bitácora. Sin edición ni asignaciones |
| `TRABAJO_SOCIAL` | `src/lib/rbac.ts:167-184` | Los anteriores salvo `auditoria.leer` y `donaciones.leer`, más `expediente.escribir`, `expediente.socioeconomico.escribir`, `documentos.subir`, `seguimiento.escribir`, `padrinazgos.gestionar` | Editar expedientes, registrar avances y asignar padrinazgos |
| `TERAPEUTA` | `src/lib/rbac.ts:185-198` | `expediente.leer`, `expediente.clinico.leer`, `expediente.clinico.escribir`, `documentos.leer`, `seguimiento.leer`, `seguimiento.escribir` | Área clínica y avances. Sin ficha socioeconómica ni donaciones |
| `PADRINO` | `src/lib/rbac.ts:199-204` | `portal.padrino` | Solo `/portal` |

---

## 3. Los 8 módulos principales

### M1 · Acceso, permisos y auditoría

| | |
|---|---|
| **Qué hace** | Autentica por correo y contraseña, arma la sesión JWT con roles y permisos, reparte a cada usuario a su zona, bloquea lo no autorizado y deja rastro de accesos y cambios en la bitácora |
| **Rutas** | `GET/POST /login`, `GET /inicio`, `GET /sin-acceso`, `GET /admin/usuarios`, `GET /admin/auditoria`, `GET/POST /api/auth/[...nextauth]` |
| **Archivos** | `src/auth.ts`, `src/auth.config.ts`, `src/proxy.ts`, `src/lib/sesion.ts`, `src/lib/rbac.ts`, `src/app/login/`, `src/app/inicio/page.tsx`, `src/app/sin-acceso/page.tsx`, `src/app/admin/usuarios/page.tsx`, `src/app/admin/auditoria/page.tsx` |
| **Tablas** | `usuarios`, `roles`, `permisos`, `usuarios_roles`, `roles_permisos`, `bitacora` |
| **Roles** | Todos |
| **Reglas clave** | Cuenta inactiva no entra (`src/auth.ts:38`) · correo siempre en minúsculas (`src/auth.ts:27`) · el destino tras el login debe ser ruta interna (`src/app/login/page.tsx:35-38`) · para entrar a `/admin` hace falta uno de cuatro permisos (`src/app/admin/layout.tsx:18-26`) · la IP se toma de `x-forwarded-for` o `x-real-ip` (`src/lib/sesion.ts:66-69`) |
| **Casos de uso** | Iniciar sesión · Ser repartido al panel o al portal · Cerrar sesión · Consultar el tablero del panel · Consultar usuarios y la matriz de permisos · Consultar la bitácora |
| **Estado** | Implementado. **Falta** la gestión de usuarios desde la interfaz: `/admin/usuarios` es de solo lectura |

### M2 · Sitio público y galería de apadrinamiento

| | |
|---|---|
| **Qué hace** | Portada con cifras en vivo, galería de beneficiarios que esperan padrino y perfil público anonimizado |
| **Rutas** | `GET /`, `GET /apadrina`, `GET /apadrina/[id]`, `GET /contacto` |
| **Archivos** | `src/app/(publico)/page.tsx`, `src/app/(publico)/apadrina/`, `src/app/(publico)/contacto/page.tsx`, `src/app/(publico)/layout.tsx`, `src/components/publico.tsx`, `src/components/carrusel.tsx`, `src/components/foto-beneficiario.tsx` |
| **Tablas** | `beneficiarios`, `programas`, `padrinos`, `padrinazgos`, `historias`, `configuracion` (solo lectura) |
| **Roles** | Visitante anónimo |
| **Reglas clave** | Solo se publican beneficiarios `ACTIVO`, con `publicadoEnGaleria = true` y **sin padrinazgo activo** (`src/app/(publico)/apadrina/page.tsx:31-35`) · la proyección `select` excluye apellidos, CUI, diagnóstico y datos familiares (`:38-45`) · solo se muestra el primer nombre (`src/lib/utils.ts:8-10`) · los datos de contacto salen de la tabla `configuracion` (`src/components/publico.tsx:14-25`) |
| **Casos de uso** | Consultar la portada · Consultar la galería · Consultar el perfil público |
| **Estado** | Implementado |

### M3 · Inscripciones y bandejas entrantes

| | |
|---|---|
| **Qué hace** | Recibe del sitio público las solicitudes de ingreso, las inscripciones de padrino y los mensajes de contacto, y permite al personal clasificarlos |
| **Rutas** | `GET/POST /inscripcion/beneficiario`, `GET/POST /inscripcion/padrino`, `POST /contacto`, `GET/POST /admin/solicitudes`, `GET/POST /admin/voluntarios`, `GET/POST /admin/mensajes` |
| **Archivos** | `src/app/(publico)/inscripcion/`, `src/app/(publico)/acciones.ts:19-191`, `src/components/formularios-publicos.tsx`, `src/lib/formularios.ts`, `src/app/admin/solicitudes/page.tsx`, `src/app/admin/voluntarios/page.tsx`, `src/app/admin/mensajes/page.tsx`, `src/app/admin/acciones.ts`, `src/components/admin/selector-estado.tsx` |
| **Tablas** | `solicitudes_inscripcion`, `postulaciones`, `mensajes_contacto`; además `usuarios` y `padrinos` al inscribirse un padrino |
| **Roles** | Visitante para el alta; `expediente.leer` para la clasificación |
| **Reglas clave** | La inscripción de padrino crea en **una transacción** el usuario con rol `PADRINO`, su ficha de padrino y la postulación (`src/app/(publico)/acciones.ts:102-136`) · no se admite un correo ya registrado (`:85-98`) · contraseña de 8 a 72 caracteres con confirmación (`src/lib/formularios.ts:58-67`) · los cambios de estado se hacen con un `<form>` por fila, sin JavaScript (`src/components/admin/selector-estado.tsx:10`) |
| **Casos de uso** | Enviar solicitud de inscripción · Inscribirse como padrino · Enviar mensaje de contacto · Cambiar el estado de solicitud, postulación o mensaje |
| **Estado** | Implementado con dos vacíos: **aprobar una solicitud no crea el beneficiario** y **no se envía ningún correo** |

### M4 · Expedientes de beneficiarios

| | |
|---|---|
| **Qué hace** | Listado con búsqueda y filtros, expediente completo dividido en secciones con bloqueo por permiso, edición de los datos generales, y consulta de documentos y programas |
| **Rutas** | `GET /admin/beneficiarios`, `GET /admin/beneficiarios/[id]`, `GET/POST /admin/beneficiarios/[id]/editar`, `GET /admin/documentos`, `GET /admin/programas` |
| **Archivos** | `src/app/admin/beneficiarios/page.tsx`, `src/app/admin/beneficiarios/[id]/page.tsx`, `src/app/admin/beneficiarios/[id]/editar/`, `src/app/admin/beneficiarios/acciones.ts:12-92`, `src/app/admin/documentos/page.tsx`, `src/app/admin/programas/page.tsx` |
| **Tablas** | `beneficiarios`, `programas`, `expedientes_clinicos`, `evaluaciones_clinicas`, `fichas_socioeconomicas`, `documentos`, `citas` |
| **Roles** | Lectura con `expediente.leer`; edición con `expediente.escribir` |
| **Reglas clave** | **Si el rol no puede leer un bloque, la consulta ni se ejecuta**: el dato no llega al HTML (`src/app/admin/beneficiarios/[id]/page.tsx:110-142`) · cada apertura del expediente se registra en la bitácora (`:164-170`) · la completitud se calcula sobre 7 criterios (`:149-158`) · `codigoExpediente` y `cui` son únicos (`migration.sql:452`, `:455`) · un beneficiario tiene como máximo un expediente clínico y una ficha socioeconómica (`migration.sql:461`, `:467`) |
| **Casos de uso** | Buscar y filtrar beneficiarios · Consultar un expediente · Editar los datos generales · Consultar documentos · Consultar programas |
| **Estado** | **Parcial.** No existe el alta de beneficiarios (no hay ningún `beneficiario.create` en `src/`), ni escritura del expediente clínico, la ficha socioeconómica o las evaluaciones, ni carga de archivos |

### M5 · Seguimiento y avances

| | |
|---|---|
| **Qué hace** | Registra los avances del beneficiario y decide, avance por avance, si el padrino puede verlos |
| **Rutas** | `GET/POST /admin/beneficiarios/[id]/avance` |
| **Archivos** | `src/app/admin/beneficiarios/[id]/avance/page.tsx`, `src/app/admin/beneficiarios/[id]/avance/formulario.tsx`, `src/app/admin/beneficiarios/acciones.ts:94-142` |
| **Tablas** | `seguimientos` |
| **Roles** | `seguimiento.escribir` (`ADMIN`, `TRABAJO_SOCIAL`, `TERAPEUTA`); lectura con `seguimiento.leer` |
| **Reglas clave** | El avance es **privado por omisión**: `visibleParaPadrino` tiene predeterminado `false` (`migration.sql:204`) y solo se activa con la casilla marcada (`src/app/admin/beneficiarios/acciones.ts:118`) · el autor se toma de la sesión, no del formulario (`:128`) · título de al menos 5 caracteres y descripción de al menos 10 (`:94-101`) · la bitácora distingue en el detalle si el avance es visible o interno (`:137`) |
| **Casos de uso** | Registrar un avance de seguimiento |
| **Estado** | Implementado. Es el **único puente** entre el expediente interno y el portal del padrino |

### M6 · Padrinazgos y asignaciones

| | |
|---|---|
| **Qué hace** | Vincula a un beneficiario activo sin padrino con la cuenta de un padrino, y da por terminada la asignación conservando el histórico |
| **Rutas** | `GET/POST /admin/asignaciones` |
| **Archivos** | `src/app/admin/asignaciones/page.tsx`, `src/app/admin/asignaciones/formulario.tsx`, `src/app/admin/asignaciones/acciones.ts` |
| **Tablas** | `padrinazgos`, `padrinos`, `beneficiarios`, `configuracion` |
| **Roles** | `padrinazgos.gestionar` (`ADMIN`, `TRABAJO_SOCIAL`) |
| **Reglas clave** | Un beneficiario **no puede tener dos padrinazgos activos**, y se revalida en el servidor porque otra persona pudo asignarlo entre la carga y el envío (`src/app/admin/asignaciones/acciones.ts:65-73`) · solo padrinos con `activo = true` (`:59-61`) y beneficiarios `ACTIVO` (`:62-64`) · el par padrino-beneficiario es único en la base, así que un padrinazgo anterior se **reactiva** en vez de duplicarse (`migration.sql:488`, `acciones.ts:75-108`) · aporte mínimo de Q50 (`:15-18`) · al finalizar se marca `activo = false` y `fechaFin` (`:144-147`) |
| **Casos de uso** | Asignar un padrinazgo · Finalizar un padrinazgo |
| **Estado** | Implementado. Efecto lateral: el beneficiario sale de la galería pública y aparece en el portal de su padrino |

### M7 · Donaciones y recaudación

| | |
|---|---|
| **Qué hace** | Registra la donación, la lleva por la pasarela simulada, emite el comprobante y ofrece al personal la consulta de transacciones, padrinos y campañas |
| **Rutas** | `GET/POST /donar`, `GET/POST /donar/pagar/[id]`, `GET /donar/gracias/[id]`, `GET /admin/donaciones`, `GET /admin/donantes`, `GET /admin/campanas` |
| **Archivos** | `src/app/(publico)/donar/`, `src/app/(publico)/acciones.ts:194-266`, `src/lib/pasarela.ts`, `src/app/admin/donaciones/page.tsx`, `src/app/admin/donantes/page.tsx`, `src/app/admin/campanas/page.tsx` |
| **Tablas** | `donaciones`, `campanas`, `padrinos` |
| **Roles** | Visitante para donar; `donaciones.leer` (`ADMIN`, `DIRECCION`) para consultar |
| **Reglas clave** | La donación nace en `PENDIENTE` y solo la pasarela la lleva a `COMPLETADA` o `FALLIDA` (`src/app/(publico)/acciones.ts:222`, `:252-255`) · monto mínimo de Q25 (`src/lib/formularios.ts:80-83`) · moneda siempre `GTQ` · referencia única con prefijo `CER-SIM-` (`src/lib/pasarela.ts:32-39`, `migration.sql:491`) · **en ningún paso se piden ni se guardan datos de tarjeta** (`src/lib/pasarela.ts:1-5`) · una donación que ya no está pendiente no vuelve a la pantalla de pago (`donar/pagar/[id]/page.tsx:29`) · solo las `COMPLETADA` suman al total (`src/app/admin/donaciones/page.tsx:52-56`) |
| **Casos de uso** | Iniciar una donación · Confirmar el pago · Consultar el comprobante · Consultar donaciones, donantes y campañas |
| **Estado** | **Parcial.** La pasarela es simulada por diseño y está aislada tras la interfaz `Pasarela` (`src/lib/pasarela.ts:20-30`), de modo que migrar a Stripe o PayPal no obliga a tocar el resto. El comprobante es HTML, sin PDF ni correo, y **`campanas.recaudado` nunca se incrementa** |

### M8 · Portal del padrino

| | |
|---|---|
| **Qué hace** | Muestra al padrino las personas que apadrina y los avances que el personal marcó como visibles |
| **Rutas** | `GET /portal`, `GET /portal/[id]` |
| **Archivos** | `src/app/portal/layout.tsx`, `src/app/portal/page.tsx`, `src/app/portal/[id]/page.tsx` |
| **Tablas** | `padrinazgos`, `beneficiarios`, `programas`, `seguimientos`, `bitacora` |
| **Roles** | `portal.padrino` |
| **Reglas clave** | La consulta parte **siempre del `padrinoId` de la sesión, nunca del id de la URL** (`src/app/portal/page.tsx:22-24`) · un id ajeno en la URL no devuelve nada y termina en `notFound()` (`src/app/portal/[id]/page.tsx:23-29`, `:55`) · solo se listan los seguimientos con `visibleParaPadrino = true` (`:39`) · cada consulta del progreso queda en la bitácora como `VER_PORTAL` (`:60-66`) · el diagnóstico, la ficha socioeconómica y los datos familiares nunca se consultan |
| **Casos de uso** | Consultar mis apadrinados · Consultar el progreso de un apadrinado |
| **Estado** | Implementado |

**Fuera de estos 8 módulos** queda el contenido institucional de solo lectura —historias
(`src/app/admin/historias/page.tsx`), blog (`.../blog/page.tsx`), eventos
(`.../eventos/page.tsx`)— y la pantalla de configuración
(`src/app/admin/configuracion/page.tsx`), sin alta ni edición en ninguno de los cuatro casos.

---

## 4. Modelo de datos resumido

26 tablas. Se agrupan por el módulo que las gobierna.

| Módulo | Tablas |
|---|---|
| M1 Acceso | `usuarios`, `roles`, `permisos`, `usuarios_roles`, `roles_permisos`, `bitacora` |
| M3 Entrantes | `solicitudes_inscripcion`, `postulaciones`, `mensajes_contacto` |
| M4 Expedientes | `programas`, `beneficiarios`, `expedientes_clinicos`, `evaluaciones_clinicas`, `fichas_socioeconomicas`, `documentos`, `citas` |
| M5 Seguimiento | `seguimientos` |
| M6 Padrinazgos | `padrinos`, `padrinazgos` |
| M7 Recaudación | `donaciones`, `campanas` |
| Contenido y ajustes | `historias`, `entradas_blog`, `eventos`, `medios`, `configuracion` |

**Relaciones principales** (tomadas de `migration.sql:514-561`):

```
usuarios          N---M roles              mediante usuarios_roles (userId, roleId)
roles             N---M permisos           mediante roles_permisos (roleId, permissionId)
usuarios          1---1 padrinos           (por userId, ON DELETE SET NULL)
programas         1---N beneficiarios      (por programaId, ON DELETE RESTRICT)
beneficiarios     1---1 expedientes_clinicos     (por beneficiarioId, único)
beneficiarios     1---1 fichas_socioeconomicas   (por beneficiarioId, único)
beneficiarios     1---N evaluaciones_clinicas    (por beneficiarioId)
beneficiarios     1---N documentos               (por beneficiarioId)
beneficiarios     1---N seguimientos             (por beneficiarioId)
beneficiarios     1---N citas                    (por beneficiarioId)
padrinos          N---M beneficiarios      mediante padrinazgos, único por (padrinoId, beneficiarioId)
padrinos          1---N donaciones         (por padrinoId, ON DELETE SET NULL)
campanas          1---N donaciones         (por campaignId, ON DELETE SET NULL)
```

Todo lo que cuelga de `beneficiarios` se borra en cascada. `bitacora` no tiene ninguna
llave foránea a propósito: debe sobrevivir al borrado de la entidad que audita.

Tablas sin relación alguna: `historias`, `entradas_blog`, `eventos`, `medios`,
`solicitudes_inscripcion`, `postulaciones`, `mensajes_contacto`, `configuracion`, `bitacora`.

---

## 5. Estados que gobiernan el sistema

| Campo | Valores | Dónde se cambia | Qué decide |
|---|---|---|---|
| `beneficiarios.estado` | `ACTIVO`, `INACTIVO`, `EGRESADO` | `src/app/admin/beneficiarios/acciones.ts:74` | Aparecer en la galería, poder ser apadrinado y contar en las cifras |
| `beneficiarios.estadoExpediente` | `COMPLETO`, `EN_REVISION`, `INCOMPLETO` | `src/app/admin/beneficiarios/acciones.ts:75` | El indicador de expedientes incompletos |
| `beneficiarios.publicadoEnGaleria` | `true` / `false` (predeterminado `false`) | `src/app/admin/beneficiarios/acciones.ts:76` | El consentimiento de publicación pública |
| `seguimientos.visibleParaPadrino` | `true` / `false` (predeterminado `false`) | `src/app/admin/beneficiarios/acciones.ts:118`, `:127` | Si el padrino ve o no el avance |
| `padrinazgos.activo` | `true` / `false` | `true` en `src/app/admin/asignaciones/acciones.ts:90`; `false` en `:146` | La vigencia del apadrinamiento |
| `donaciones.estado` | `PENDIENTE`, `COMPLETADA`, `FALLIDA`, `REEMBOLSADA` | `PENDIENTE` en `src/app/(publico)/acciones.ts:222`; las dos siguientes en `:254`. **`REEMBOLSADA` nunca se escribe** | El total recaudado y el acceso al comprobante |
| `solicitudes_inscripcion.estado` | `NUEVA`, `EN_REVISION`, `APROBADA`, `RECHAZADA` | `src/app/admin/acciones.ts:21` | El triaje de trabajo social |
| `postulaciones.estado` | Los mismos cuatro | `src/app/admin/acciones.ts:42` | El triaje; **no** condiciona el acceso al portal |
| `mensajes_contacto.estado` | Los mismos cuatro | `src/app/admin/acciones.ts:63` | El seguimiento de la atención |

Sin punto de cambio en la aplicación (solo por seed o directamente en la base):
`usuarios.activo`, `padrinos.activo`, `programas.activo`, `campanas.activa`,
`documentos.vigente`, `historias.estado`, `entradas_blog.estado`, `eventos.estado`,
`fichas_socioeconomicas.nivelVulnerabilidad` y `elegibleBeca`.

---

## 6. Vacíos principales

| Vacío | Evidencia |
|---|---|
| **No existe el alta de beneficiarios** | Ningún `prisma.beneficiario.create` en `src/`; solo `update` en `src/app/admin/beneficiarios/acciones.ts:54` |
| **Aprobar una solicitud no crea el expediente** | `src/app/admin/acciones.ts:14-33`; sin llave foránea entre `solicitudes_inscripcion` y `beneficiarios` |
| Sin escritura del expediente clínico ni de la ficha socioeconómica | Los permisos `expediente.clinico.escribir` y `expediente.socioeconomico.escribir` existen (`src/lib/rbac.ts:52-69`) pero **ninguna función los comprueba** |
| Sin carga de archivos | La propia pantalla lo declara: `src/app/admin/documentos/page.tsx:66` |
| Sin correo, sin PDF, sin respaldos, sin pruebas | Ninguna dependencia de correo, PDF ni pruebas en `package.json` |
| Sin gestión de usuarios, configuración ni contenido desde la interfaz | `src/app/admin/usuarios/page.tsx`, `configuracion/page.tsx`, `historias/`, `blog/`, `eventos/` son de solo lectura |
| `campanas.recaudado` nunca se incrementa | Ninguna escritura de `recaudado` en `src/` |
| El inicio de sesión se audita **sin IP** | `src/auth.ts:48-56` escribe directo con `prisma.auditLog.create` en vez de usar `registrarAuditoria()` (`src/lib/sesion.ts:63-83`) |
| El cierre de sesión no se audita | `src/app/login/acciones.ts:30-32` |
| La tabla `medios` no la consulta ninguna pantalla | Solo se escribe en `prisma/seed.ts:1133-1153` |

**Inconsistencias de nombres**

- **Idioma mixto**: 12 modelos en español y 14 en inglés, pero **todas** las tablas en español vía `@@map` (`prisma/schema.prisma:71-528`). Se filtra al usuario: `bitacora.entidad` muestra `SupportRequest`, `VolunteerApplication`, `User`.
- **`bitacora.entidadId` es inconsistente**: para `Padrinazgo` guarda el `beneficiarioId` en las asignaciones (`src/app/admin/asignaciones/acciones.ts:114`) pero el id del padrinazgo en el portal (`src/app/portal/[id]/page.tsx:64`).
- Las columnas de autoría (`documentos.subidoPor`, `seguimientos.registradoPor`, `fichas_socioeconomicas.realizadoPor`) son texto libre sin llave foránea a `usuarios`; además `registradoPor` guarda el **nombre** y `bitacora.actor` el **correo**.
- El README declara pendiente `/admin/asignaciones`, que sí está implementado (`README.md:241-243`), y dice 16 secciones donde el catálogo tiene 17 (`src/components/admin/navegacion.ts:11-130`).

**Observación de seguridad**: las tres acciones de cambio de estado de las bandejas exigen
`expediente.leer` —un permiso de **lectura**— para ejecutar una **escritura**
(`src/app/admin/acciones.ts:15`, `:36`, `:57`). En la práctica, el rol `DIRECCION`,
descrito en el código como «Solo lectura» (`src/lib/rbac.ts:156`), puede modificar el
estado de solicitudes, postulaciones y mensajes.

---

## 7. Resumen numérico

| Elemento | Cantidad |
|---|---|
| Módulos principales | 8 |
| Tablas | 26 (más 8 enumeraciones de PostgreSQL) |
| Pantallas (`page.tsx`) | 34, más 1 ruta de API |
| Acciones de servidor (mutaciones) | 14 |
| Roles | 5, sobre 15 permisos |
| Casos de uso | 31 en los 8 módulos principales (33 en total; 2 quedan fuera: contenido institucional y configuración) |

*Documento generado por lectura del código; no se modificó ningún archivo del sistema.*
