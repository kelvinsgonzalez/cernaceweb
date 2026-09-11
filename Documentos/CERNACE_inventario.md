# Inventario técnico del sistema CERNACE

Documento de análisis levantado por lectura directa del código del workspace
`/Users/kelvingonzalez/cernace-web-2`. Todo dato afirmado aquí está respaldado con
`archivo:línea`. Donde el código no aporta el dato se escribe **NO ENCONTRADO**.

El proyecto es **una sola aplicación** (un único `package.json`, un único
`src/app`). No hay monorepo ni carpetas de aplicaciones independientes. Sí existen
tres *zonas de ruteo* dentro de la misma aplicación Next.js —sitio público,
panel administrativo y portal del padrino— que se tratan por separado a lo largo
del documento.

---

## 1. Ficha técnica

### 1.1 Lenguajes, framework y motor

| Elemento | Valor exacto | Dónde consta |
|---|---|---|
| Lenguaje principal | TypeScript 5.9.3 (`"typescript": "^5"`) | `package.json:32`, versión instalada en `node_modules/typescript` |
| Objetivo de compilación | `ES2017`, `module: esnext`, `moduleResolution: bundler`, `strict: true` | `tsconfig.json:3-16` |
| Alias de importación | `@/*` → `./src/*` | `tsconfig.json:20-22` |
| Runtime | Node.js v22.23.2 (versión instalada en la máquina) | `node -v` |
| Framework | Next.js 16.3.0, App Router, React Server Components | `package.json:19`, `next.config.ts:3-5` |
| Biblioteca de interfaz | React 19.2.8 / React DOM 19.2.8 | `package.json:21-22` |
| Motor de base de datos | PostgreSQL | `prisma/schema.prisma:10-12`, `prisma/migrations/migration_lock.toml:3` |
| ORM | Prisma 7.9.1, generador `prisma-client` con salida a `src/generated/prisma` | `prisma/schema.prisma:5-8`, `package.json:29` |
| Driver de base de datos | `@prisma/adapter-pg` 7.9.1 (driver adapter obligatorio en Prisma 7) | `src/lib/prisma.ts:1-11` |
| Autenticación | NextAuth v5 beta 32, proveedor `Credentials`, sesión JWT | `src/auth.ts:1-16`, `src/auth.config.ts:25` |
| Hash de contraseñas | bcryptjs 3.0.3, factor de coste 10 | `src/auth.ts:40`, `src/app/(publico)/acciones.ts:100`, `prisma/seed.ts:76` |
| Validación | Zod 4.4.3 | `src/lib/formularios.ts:1`, `src/auth.ts:8-11` |
| Estilos | Tailwind CSS 4.3.3 vía `@tailwindcss/postcss` | `package.json:26`, `postcss.config.mjs` |
| Utilidades de clases | `clsx` 2.1.1 + `tailwind-merge` 3.6.0 (función `cn`) | `src/lib/utils.ts:1-6` |
| Iconografía | `lucide-react` 1.30.0 | `package.json:18` |
| Tipografías | Google Fonts `Poppins` (títulos) e `Inter` (texto), cargadas con `next/font/google` | `src/app/layout.tsx:2-16` |
| Linter | ESLint 9 con `eslint-config-next` 16.3.0 | `package.json:30-31`, `eslint.config.mjs` |
| Servidor web | **NO ENCONTRADO** un servidor externo (nginx/Apache). La aplicación se sirve con el servidor propio de Next: `next dev` en desarrollo y `next start` en producción | `package.json:6-8` |
| Puerto | **NO ENCONTRADO** en la configuración; se usa el predeterminado de Next. El único puerto explícito del repositorio es el `5433` de PostgreSQL en la cadena de ejemplo | `.env.example:1` |

### 1.2 Scripts de npm

| Script | Comando | Archivo |
|---|---|---|
| `dev` | `next dev` | `package.json:6` |
| `build` | `next build` | `package.json:7` |
| `start` | `next start` | `package.json:8` |
| `lint` | `eslint` | `package.json:9` |
| `db:migrate` | `prisma migrate dev` | `package.json:10` |
| `db:seed` | `prisma db seed` | `package.json:11` |
| `db:studio` | `prisma studio` | `package.json:12` |
| `db:reset` | `prisma migrate reset --force` | `package.json:13` |
| `verificar` | `tsc --noEmit && eslint . && next build` | `package.json:14` |

### 1.3 Variables de entorno

No se transcribe ningún valor. Las variables declaradas en `.env.example` son:

| Variable | Para qué sirve | Dónde se consume |
|---|---|---|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL, usada por el cliente en ejecución y por las migraciones | `src/lib/prisma.ts:8`, `prisma.config.ts:11`, `prisma/seed.ts:11` |
| `AUTH_SECRET` | Secreto de firma de los JWT de NextAuth | Consumido internamente por NextAuth (`src/auth.ts:13`); no aparece leído explícitamente en el código |
| `AUTH_TRUST_HOST` | Autoriza a NextAuth a confiar en la cabecera de host | Consumido internamente por NextAuth |

`.env` y `.env.example` existen en la raíz; `.gitignore:34` excluye `.env*` del control de versiones.

### 1.4 Árbol de carpetas (tres niveles)

```
cernace-web-2/
├── prisma/                            Esquema, migración SQL y datos de demostración
│   └── migrations/
│       └── 20260808195214_inicial/    Única migración: crea las 26 tablas y 8 enums
├── docs/                              Material de la tesis (no lo usa la aplicación)
│   └── generated/                     Capítulo 5 en .docx, 16 diagramas PNG y vistas previas
├── public/                            Activos estáticos servidos en la raíz del sitio
│   ├── beneficiarios/                 Fotografías de beneficiarios de la galería pública
│   ├── carrusel/                      Imágenes del carrusel de la portada
│   └── historias/                     Imágenes de las historias de avance
└── src/
    ├── app/                           Rutas del App Router de Next 16
    │   ├── (publico)/                 Grupo de rutas del sitio público (sin sesión)
    │   ├── admin/                     Panel interno, 17 secciones protegidas por permiso
    │   ├── portal/                    Portal del padrino
    │   ├── login/                     Pantalla y acciones de inicio y cierre de sesión
    │   ├── inicio/                    Repartidor que envía al panel o al portal según el rol
    │   ├── sin-acceso/                Pantalla de permiso denegado
    │   └── api/                       Única ruta de API: el handler de NextAuth
    ├── components/                    Componentes de interfaz escritos a mano
    │   └── admin/                     Componentes exclusivos del panel (tablas, barra lateral)
    ├── lib/                           Utilidades transversales: prisma, sesión, RBAC, fechas, pasarela
    └── generated/
        └── prisma/                    Cliente Prisma generado (excluido de git por .gitignore:47)
```

Descripción por carpeta:

| Carpeta | Qué contiene |
|---|---|
| `prisma/` | `schema.prisma` (26 modelos, 8 enums), `seed.ts` (1 424 líneas de datos ficticios) y la migración inicial |
| `prisma/migrations/20260808195214_inicial/` | `migration.sql` (560 líneas): enums, tablas, índices únicos y llaves foráneas |
| `docs/generated/` | Documento y diagramas del capítulo 5 ya producidos; ningún archivo de esta carpeta se importa desde el código |
| `public/beneficiarios/` | Fotos referenciadas por `beneficiarios.fotoUrl` |
| `public/carrusel/` | Cuatro imágenes fijas listadas en `src/app/(publico)/page.tsx:61-82` |
| `public/historias/` | Imágenes referenciadas por `historias.imagenUrl` |
| `src/app/(publico)/` | Portada, galería de apadrinamiento, perfil público, inscripciones, contacto y flujo de donación; `acciones.ts` con las cinco acciones de servidor públicas |
| `src/app/admin/` | Panel: beneficiarios, expedientes, documentos, campañas, donaciones, donantes, asignaciones, voluntarios, solicitudes, mensajes, eventos, historias, blog, usuarios, configuración y auditoría |
| `src/app/portal/` | Listado de apadrinados y detalle de progreso del beneficiario asignado |
| `src/app/api/auth/[...nextauth]/` | Reexporta los handlers `GET` y `POST` de NextAuth |
| `src/components/` | Sistema de interfaz propio: `ui.tsx` (566 líneas, botones, chips, campos), formularios públicos, carrusel, cabecera y pie públicos |
| `src/components/admin/` | `barra-lateral.tsx`, `navegacion.ts` (catálogo de secciones y su permiso), `estructura.tsx` (tabla accesible), `selector-estado.tsx` |
| `src/lib/` | `prisma.ts`, `sesion.ts` (guardas y auditoría), `rbac.ts` (catálogo de roles y permisos), `fechas.ts`, `formularios.ts` (esquemas Zod), `pasarela.ts`, `utils.ts` |
| `src/generated/prisma/` | Cliente y tipos generados por `prisma generate`; artefacto, no código fuente |

### 1.5 Archivos sueltos en la raíz

| Archivo | Qué es |
|---|---|
| `AGENTS.md` / `CLAUDE.md` | Instrucciones para agentes de código; `CLAUDE.md` solo incluye a `AGENTS.md` |
| `README.md` | Documentación del proyecto (12 132 bytes) |
| `tools_generar_capitulo5.py` | Script Python de 29 460 bytes que genera el `.docx` y los diagramas de `docs/generated/`. No forma parte de la aplicación web ni se ejecuta desde ella |
| `tsconfig.tsbuildinfo` | Caché incremental de TypeScript |

---

## 2. Roles y control de acceso

### 2.1 Cómo se implementa la autenticación

| Paso | Archivo:línea | Qué hace |
|---|---|---|
| Configuración compartida | `src/auth.config.ts:20-59` | Define `pages.signIn = "/login"`, `pages.error = "/login"` y `session.strategy = "jwt"` |
| Proveedor de credenciales | `src/auth.ts:16-79` | `Credentials` con campos `email` y `password` |
| Validación de entrada | `src/auth.ts:8-11`, `src/auth.ts:22-23` | Esquema Zod `esquemaCredenciales`: `z.email()` y `z.string().min(1)` |
| Búsqueda del usuario | `src/auth.ts:26-36` | `prisma.user.findUnique` por `email` en minúsculas, incluyendo `padrino`, `roles → role → permisos → permission` |
| Cuenta inactiva | `src/auth.ts:38` | `if (!usuario \|\| !usuario.activo) return null` |
| Verificación de contraseña | `src/auth.ts:40-41` | `bcrypt.compare(password, usuario.passwordHash)` |
| Registro de último acceso | `src/auth.ts:43-46` | `prisma.user.update` de `ultimoAcceso` |
| Bitácora de ingreso | `src/auth.ts:48-56` | Inserta en `bitacora` la acción `INICIO_SESION` |
| Armado de la sesión | `src/auth.ts:58-74` | Aplana roles y permisos (deduplicados con `Set`) y adjunta `padrinoId` |
| Propagación al token | `src/auth.config.ts:27-38` | Callback `jwt`: copia `id`, `nombre`, `roles`, `permisos`, `padrinoId` |
| Propagación a la sesión | `src/auth.config.ts:39-56` | Callback `session`: vuelca el token en `session.user` |
| Handler HTTP | `src/app/api/auth/[...nextauth]/route.ts:1-3` | Reexporta `GET` y `POST` |
| Acción de inicio de sesión | `src/app/login/acciones.ts:7-28` | `iniciarSesion()`: baja el correo a minúsculas y llama `signIn("credentials", …)` |
| Acción de cierre de sesión | `src/app/login/acciones.ts:30-32` | `cerrarSesion()`: `signOut({ redirectTo: "/" })` |

**Tipo de la sesión** (`src/auth.config.ts:11-18`): `{ id, nombre, email, roles: string[], permisos: string[], padrinoId: string | null }`.

### 2.2 Cómo se implementa la autorización

La autorización es **por permiso, no por rol**, y se evalúa en el servidor:

| Función | Archivo:línea | Comportamiento |
|---|---|---|
| `usuarioActual()` | `src/lib/sesion.ts:14-18` | Devuelve el usuario de sesión o `null` |
| `requireSesion()` | `src/lib/sesion.ts:20-24` | Redirige a `/login` si no hay sesión |
| `tienePermiso()` | `src/lib/sesion.ts:26-31` | Comprobación booleana sin redirección |
| `tieneAlguno()` | `src/lib/sesion.ts:33-38` | Booleano sobre una lista de permisos |
| `requirePermiso()` | `src/lib/sesion.ts:40-46` | Redirige a `/sin-acceso` si falta el permiso. **Es la guarda principal**: se invoca al inicio de cada página protegida y de cada acción de servidor |
| `requireAlgunPermiso()` | `src/lib/sesion.ts:48-54` | Igual, con lista de permisos. **Declarada pero nunca invocada** en el código |
| `registrarAuditoria()` | `src/lib/sesion.ts:56-84` | Inserta en `bitacora`; toma la IP de `x-forwarded-for` o `x-real-ip` |

El `proxy.ts` (sustituto de `middleware.ts`, deprecado en Next 16) **solo comprueba que exista sesión**, no permisos:

- `src/proxy.ts:11-22`: si no hay sesión, redirige a `/login?redirigir=<ruta>`.
- `src/proxy.ts:24-26`: `matcher: ["/admin/:path*", "/portal/:path*", "/inicio"]`.
- El comentario de `src/proxy.ts:5-8` y el de `src/lib/sesion.ts:9-12` declaran explícitamente que el control de acceso real vive en `requirePermiso()`.

Guarda adicional de zona: `src/app/admin/layout.tsx:18-26` exige tener al menos uno de `expediente.leer`, `donaciones.leer`, `usuarios.gestionar` o `auditoria.leer` para entrar a cualquier ruta `/admin/*`; en caso contrario redirige a `/sin-acceso`. `src/app/portal/layout.tsx:13` exige `portal.padrino`.

Protección de redirección abierta: `src/app/login/page.tsx:33-38` solo acepta como destino una ruta que empiece con `/` y no con `//`.

### 2.3 Catálogo de permisos

Los 15 permisos se definen en `src/lib/rbac.ts:6-22` (constantes) y `src/lib/rbac.ts:33-125` (catálogo con nombre, descripción y módulo). El seed los inserta en la tabla `permisos` leyendo ese mismo catálogo (`prisma/seed.ts:50-59`).

| Clave | Módulo | Definición |
|---|---|---|
| `expediente.leer` | Expedientes | `src/lib/rbac.ts:34-39` |
| `expediente.escribir` | Expedientes | `src/lib/rbac.ts:40-45` |
| `expediente.clinico.leer` | Expedientes | `src/lib/rbac.ts:46-51` |
| `expediente.clinico.escribir` | Expedientes | `src/lib/rbac.ts:52-57` |
| `expediente.socioeconomico.leer` | Expedientes | `src/lib/rbac.ts:58-63` |
| `expediente.socioeconomico.escribir` | Expedientes | `src/lib/rbac.ts:64-69` |
| `documentos.leer` | Documentos | `src/lib/rbac.ts:70-75` |
| `documentos.subir` | Documentos | `src/lib/rbac.ts:76-81` |
| `seguimiento.leer` | Seguimiento | `src/lib/rbac.ts:82-87` |
| `seguimiento.escribir` | Seguimiento | `src/lib/rbac.ts:88-93` |
| `donaciones.leer` | Donaciones | `src/lib/rbac.ts:94-99` |
| `padrinazgos.gestionar` | Padrinos | `src/lib/rbac.ts:100-106` |
| `usuarios.gestionar` | Administración | `src/lib/rbac.ts:107-112` |
| `auditoria.leer` | Administración | `src/lib/rbac.ts:113-118` |
| `portal.padrino` | Padrinos | `src/lib/rbac.ts:119-124` |

### 2.4 Tabla de roles

Los cinco roles se declaran en `src/lib/rbac.ts:127-133` (claves) y `src/lib/rbac.ts:146-205` (catálogo con sus permisos). El seed los inserta en la tabla `roles` y sus filas en `roles_permisos` (`prisma/seed.ts:61-74`).

| Rol (clave exacta) | Dónde se define | Permisos concretos | Rutas y funciones que puede ejecutar |
|---|---|---|---|
| `ADMIN` | `src/lib/rbac.ts:147-152`; nombre «Administrador»; `permisos: TODOS_LOS_PERMISOS` (`src/lib/rbac.ts:144`) | Los 15 permisos | Todo el panel `/admin/*` (17 secciones), `/admin/beneficiarios/[id]/editar`, `/admin/beneficiarios/[id]/avance`, `/admin/asignaciones`, `/admin/usuarios`, `/admin/configuracion`, `/admin/auditoria` y el portal `/portal`. Todas las acciones de servidor del panel |
| `DIRECCION` | `src/lib/rbac.ts:153-166`; nombre «Dirección» | `expediente.leer`, `expediente.clinico.leer`, `expediente.socioeconomico.leer`, `documentos.leer`, `seguimiento.leer`, `donaciones.leer`, `auditoria.leer` | Lectura de `/admin`, `/admin/beneficiarios`, `/admin/beneficiarios/[id]` (con las secciones clínica y socioeconómica visibles), `/admin/programas`, `/admin/documentos`, `/admin/campanas`, `/admin/donaciones`, `/admin/donantes`, `/admin/voluntarios`, `/admin/solicitudes`, `/admin/mensajes`, `/admin/eventos`, `/admin/historias`, `/admin/blog`, `/admin/auditoria`. Puede ejecutar `cambiarEstadoSolicitud`, `cambiarEstadoPostulacion` y `cambiarEstadoMensaje` porque esas acciones solo exigen `expediente.leer` (`src/app/admin/acciones.ts:15`, `:36`, `:57`). **No** puede editar expedientes, registrar avances, asignar padrinazgos ni entrar a `/admin/usuarios` ni `/admin/configuracion` |
| `TRABAJO_SOCIAL` | `src/lib/rbac.ts:167-184`; nombre «Trabajo social» | `expediente.leer`, `expediente.escribir`, `expediente.clinico.leer`, `expediente.socioeconomico.leer`, `expediente.socioeconomico.escribir`, `documentos.leer`, `documentos.subir`, `seguimiento.leer`, `seguimiento.escribir`, `padrinazgos.gestionar` | Todo lo de `DIRECCION` salvo `/admin/auditoria`, más `/admin/beneficiarios/[id]/editar` (`guardarDatosGenerales`), `/admin/beneficiarios/[id]/avance` (`registrarAvance`) y `/admin/asignaciones` (`asignarPadrinazgo`, `finalizarPadrinazgo`). **No** ve donaciones, campañas ni donantes; **no** entra a `/admin/usuarios` ni `/admin/configuracion` |
| `TERAPEUTA` | `src/lib/rbac.ts:185-198`; nombre «Terapeuta» | `expediente.leer`, `expediente.clinico.leer`, `expediente.clinico.escribir`, `documentos.leer`, `seguimiento.leer`, `seguimiento.escribir` | `/admin`, `/admin/beneficiarios`, `/admin/beneficiarios/[id]` (sección clínica visible, socioeconómica bloqueada por `src/app/admin/beneficiarios/[id]/page.tsx:76-79`), `/admin/beneficiarios/[id]/avance` (`registrarAvance`), `/admin/programas`, `/admin/documentos`, `/admin/solicitudes`, `/admin/mensajes`, `/admin/voluntarios`, `/admin/eventos`, `/admin/historias`, `/admin/blog`. **No** puede editar datos generales (le falta `expediente.escribir`), ni ver donaciones, ni asignar padrinazgos, ni ver auditoría. Nota: `expediente.clinico.escribir` está concedido pero **ninguna función del código lo comprueba** |
| `PADRINO` | `src/lib/rbac.ts:199-204`; nombre «Padrino» | `portal.padrino` únicamente | `/portal` y `/portal/[id]`. Si escribe `/admin/...` es expulsado a `/sin-acceso` por `src/app/admin/layout.tsx:24-26` |

Funciones auxiliares: `permisosDeRol()` (`src/lib/rbac.ts:207-209`) y `nombreDeRol()` (`src/lib/rbac.ts:211-213`, usada en `src/app/admin/layout.tsx:62` y `src/app/sin-acceso/page.tsx:16`).

La pantalla `/admin/usuarios` construye la matriz rol × permiso **leyendo la base**, no el archivo: `prisma.role.findMany` con sus `permisos` y `prisma.permission.findMany` (`src/app/admin/usuarios/page.tsx:31-36`), cruzados en un `Set` (`src/app/admin/usuarios/page.tsx:38-40`).

### 2.5 Cuentas de demostración sembradas

Definidas en `prisma/seed.ts:78-114`; todas comparten el hash de una contraseña única generada en `prisma/seed.ts:76`. La contraseña en claro aparece impresa en la propia pantalla de login (`src/app/login/page.tsx:82`) y en el listado del seed (`prisma/seed.ts:1408-1413`).

| Correo | Rol asignado | Cargo | Línea |
|---|---|---|---|
| `admin@cernace.org` | `ADMIN` | Administradora del sistema | `prisma/seed.ts:79-85` |
| `direccion@cernace.org` | `DIRECCION` | Director general | `prisma/seed.ts:86-92` |
| `trabajosocial@cernace.org` | `TRABAJO_SOCIAL` | Trabajadora social | `prisma/seed.ts:93-99` |
| `terapeuta@cernace.org` | `TERAPEUTA` | Terapeuta físico | `prisma/seed.ts:100-106` |
| `padrino@cernace.org` | `PADRINO` | (sin cargo) | `prisma/seed.ts:107-113` |

---

## 3. Módulos del sistema

| Módulo | Archivos que lo componen | Qué hace | Rol o roles que lo usan |
|---|---|---|---|
| Acceso y sesión | `src/auth.ts`, `src/auth.config.ts`, `src/proxy.ts`, `src/lib/sesion.ts`, `src/app/login/page.tsx`, `src/app/login/formulario.tsx`, `src/app/login/acciones.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/components/cerrar-sesion.tsx`, `src/app/inicio/page.tsx`, `src/app/sin-acceso/page.tsx` | Autentica por correo y contraseña, arma la sesión JWT con roles y permisos, reparte al panel o al portal, y expulsa a `/sin-acceso` cuando falta un permiso | Todos los roles (público no autenticado incluido, para el formulario de login) |
| Control de acceso (RBAC) | `src/lib/rbac.ts`, `src/lib/sesion.ts`, `src/components/admin/navegacion.ts`, `src/components/admin/barra-lateral.tsx`, `src/app/admin/usuarios/page.tsx` | Cataloga 15 permisos y 5 roles, filtra las secciones visibles de la barra lateral y muestra la matriz vigente leída de la base | `ADMIN` (matriz completa); todos los roles la consumen de forma indirecta |
| Sitio público | `src/app/(publico)/layout.tsx`, `src/app/(publico)/page.tsx`, `src/components/publico.tsx`, `src/components/carrusel.tsx`, `src/components/ui.tsx`, `src/components/icono-programa.tsx` | Portada con cifras en vivo, carrusel, programas, galería resumida e historias publicadas | Visitante anónimo |
| Galería de apadrinamiento | `src/app/(publico)/apadrina/page.tsx`, `src/app/(publico)/apadrina/[id]/page.tsx`, `src/components/foto-beneficiario.tsx` | Publica únicamente primer nombre, edad, programa, resumen y foto de beneficiarios activos, marcados `publicadoEnGaleria` y sin padrinazgo activo | Visitante anónimo |
| Inscripción de beneficiarios | `src/app/(publico)/inscripcion/beneficiario/page.tsx`, `src/components/formularios-publicos.tsx:30-182`, `src/app/(publico)/acciones.ts:19-62`, `src/lib/formularios.ts:23-42` | Recibe la solicitud de ingreso de un niño y la guarda en `solicitudes_inscripcion` con estado `NUEVA` | Visitante anónimo; la revisa `TRABAJO_SOCIAL`, `TERAPEUTA`, `DIRECCION`, `ADMIN` |
| Inscripción de padrinos | `src/app/(publico)/inscripcion/padrino/page.tsx`, `src/components/formularios-publicos.tsx:183-296`, `src/app/(publico)/acciones.ts:69-157`, `src/lib/formularios.ts:44-67` | Crea en una transacción el `User` con rol `PADRINO`, su `Padrino` y la `VolunteerApplication` de tipo `PADRINO` | Visitante anónimo; genera cuentas de rol `PADRINO` |
| Contacto | `src/app/(publico)/contacto/page.tsx`, `src/components/formularios-publicos.tsx:297-361`, `src/app/(publico)/acciones.ts:159-191`, `src/lib/formularios.ts:69-75` | Guarda mensajes en `mensajes_contacto` y muestra los datos de contacto leídos de `configuracion` | Visitante anónimo; los atiende cualquier rol con `expediente.leer` |
| Donaciones y pasarela | `src/app/(publico)/donar/page.tsx`, `src/app/(publico)/donar/pagar/[id]/page.tsx`, `src/app/(publico)/donar/gracias/[id]/page.tsx`, `src/app/(publico)/acciones.ts:194-266`, `src/lib/pasarela.ts`, `src/lib/formularios.ts:77-90` | Crea la donación en `PENDIENTE` con la referencia de la pasarela simulada, permite confirmar o rechazar y emite el comprobante | Visitante anónimo; las consulta `DIRECCION` y `ADMIN` |
| Panel y tablero | `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`, `src/components/admin/estructura.tsx`, `src/components/admin/barra-lateral.tsx`, `src/components/admin/navegacion.ts` | Estructura del panel, indicadores del centro y últimos avances; oculta las tarjetas cuyo permiso falta | `ADMIN`, `DIRECCION`, `TRABAJO_SOCIAL`, `TERAPEUTA` |
| Expedientes de beneficiarios | `src/app/admin/beneficiarios/page.tsx`, `src/app/admin/beneficiarios/[id]/page.tsx`, `src/app/admin/beneficiarios/[id]/editar/page.tsx`, `src/app/admin/beneficiarios/[id]/editar/formulario.tsx`, `src/app/admin/beneficiarios/acciones.ts:12-92` | Listado con filtros, expediente completo por secciones con bloqueo por permiso, y edición de los datos generales | Lectura: `ADMIN`, `DIRECCION`, `TRABAJO_SOCIAL`, `TERAPEUTA`. Escritura: `ADMIN`, `TRABAJO_SOCIAL` |
| Seguimiento y avances | `src/app/admin/beneficiarios/[id]/avance/page.tsx`, `src/app/admin/beneficiarios/[id]/avance/formulario.tsx`, `src/app/admin/beneficiarios/acciones.ts:94-142` | Registra avances con el interruptor `visibleParaPadrino`, que decide si el padrino los verá | `ADMIN`, `TRABAJO_SOCIAL`, `TERAPEUTA` |
| Documentos | `src/app/admin/documentos/page.tsx`, sección de `src/app/admin/beneficiarios/[id]/page.tsx:456-505` | Lista los documentos adjuntos, su vigencia y quién los subió. **No hay carga de archivos** | `ADMIN`, `DIRECCION`, `TRABAJO_SOCIAL`, `TERAPEUTA` |
| Padrinazgos y asignaciones | `src/app/admin/asignaciones/page.tsx`, `src/app/admin/asignaciones/formulario.tsx`, `src/app/admin/asignaciones/acciones.ts` | Asigna un beneficiario activo sin padrino a un padrino activo y da por terminada una asignación | `ADMIN`, `TRABAJO_SOCIAL` |
| Donantes y recaudación | `src/app/admin/donaciones/page.tsx`, `src/app/admin/donantes/page.tsx`, `src/app/admin/campanas/page.tsx` | Consulta de transacciones con filtro por estado, padrinos con su aporte y campañas con su avance | `ADMIN`, `DIRECCION` |
| Formularios entrantes | `src/app/admin/solicitudes/page.tsx`, `src/app/admin/voluntarios/page.tsx`, `src/app/admin/mensajes/page.tsx`, `src/components/admin/selector-estado.tsx`, `src/app/admin/acciones.ts` | Bandejas de solicitudes, postulaciones y mensajes, con cambio de estado por fila | `ADMIN`, `DIRECCION`, `TRABAJO_SOCIAL`, `TERAPEUTA` |
| Contenido institucional | `src/app/admin/historias/page.tsx`, `src/app/admin/blog/page.tsx`, `src/app/admin/eventos/page.tsx`, `src/app/admin/programas/page.tsx` | Consulta de solo lectura de historias, entradas de blog, eventos y programas | `ADMIN`, `DIRECCION`, `TRABAJO_SOCIAL`, `TERAPEUTA` |
| Portal del padrino | `src/app/portal/layout.tsx`, `src/app/portal/page.tsx`, `src/app/portal/[id]/page.tsx` | Muestra los apadrinados del padrino de la sesión y los avances marcados como visibles | `PADRINO` (y `ADMIN`, que también posee `portal.padrino`) |
| Administración del sistema | `src/app/admin/usuarios/page.tsx`, `src/app/admin/configuracion/page.tsx` | Cuentas con su rol y último acceso, matriz de permisos y tabla de configuración por grupo | `ADMIN` |
| Auditoría | `src/app/admin/auditoria/page.tsx`, `src/lib/sesion.ts:56-84`, sección de `src/app/admin/beneficiarios/[id]/page.tsx:559-600` | Bitácora paginada con filtros por acción y entidad; historial por expediente | `ADMIN`, `DIRECCION` |
| Utilidades transversales | `src/lib/fechas.ts`, `src/lib/utils.ts`, `src/lib/formularios.ts`, `src/lib/prisma.ts` | Formato de fechas en UTC frente a hora local de Guatemala, quetzales, tamaños, `slugify`, conversión de `Decimal`, esquemas Zod y el cliente Prisma con adaptador | Todos los módulos |

Nota sobre nombres: no existe capa de *controladores* ni de *modelos* al estilo MVC. La arquitectura es la de Next 16: los componentes de servidor consultan Prisma directamente y las mutaciones se hacen mediante **acciones de servidor** (`"use server"`). Los «modelos» son los modelos de Prisma declarados en `prisma/schema.prisma`.

---

## 4. Rutas y pantallas

Aclaración sobre el método HTTP: en el App Router de Next 16 cada archivo `page.tsx`
responde a `GET` sobre su ruta. Las mutaciones **no tienen ruta propia**: son
*acciones de servidor* (`"use server"`) que el navegador envía por `POST` a la
misma URL donde se rindió el formulario. Por eso las filas `POST` indican la ruta
de la pantalla que contiene el formulario y, en la columna de función, el nombre
exacto de la acción invocada.

### 4.1 Sitio público (sin sesión)

| Método | Ruta | Archivo:línea | Controlador o función | Rol requerido | Qué hace | Vista que devuelve |
|---|---|---|---|---|---|---|
| GET | `/` | `src/app/(publico)/page.tsx:90` | `LandingPage` | Ninguno | Portada con cifras en vivo, carrusel, programas, tres beneficiarios que esperan padrino, historias publicadas y formulario de inscripción | `src/app/(publico)/page.tsx` dentro de `src/app/(publico)/layout.tsx` |
| POST | `/` | `src/app/(publico)/acciones.ts:19` | `enviarInscripcionBeneficiario` | Ninguno | Valida y crea la solicitud de ingreso desde el formulario embebido en la portada | Rerenderiza la portada con `EstadoFormulario` |
| GET | `/apadrina` | `src/app/(publico)/apadrina/page.tsx:17` | `GaleriaPage` | Ninguno | Galería filtrable por programa de beneficiarios activos, publicados y sin padrinazgo activo | `src/app/(publico)/apadrina/page.tsx` |
| GET | `/apadrina/[id]` | `src/app/(publico)/apadrina/[id]/page.tsx:25` | `PerfilPublicoPage` | Ninguno | Perfil público reducido: primer nombre, edad, programa, resumen y foto. `notFound()` si no está publicado o no está `ACTIVO` | `src/app/(publico)/apadrina/[id]/page.tsx` |
| GET | `/inscripcion/beneficiario` | `src/app/(publico)/inscripcion/beneficiario/page.tsx:16` | `InscripcionBeneficiarioPage` | Ninguno | Formulario de solicitud de ingreso, con la lista de programas activos | `src/components/formularios-publicos.tsx:30` (`FormularioBeneficiario`) |
| POST | `/inscripcion/beneficiario` | `src/app/(publico)/acciones.ts:19` | `enviarInscripcionBeneficiario` | Ninguno | Inserta en `solicitudes_inscripcion` con estado `NUEVA` y registra auditoría `CREAR` | Mismo formulario con mensaje de éxito o errores por campo |
| GET | `/inscripcion/padrino` | `src/app/(publico)/inscripcion/padrino/page.tsx:28` | `InscripcionPadrinoPage` | Ninguno | Formulario de alta de padrino; muestra cuántos beneficiarios activos no tienen padrino | `src/components/formularios-publicos.tsx:183` (`FormularioPadrino`) |
| POST | `/inscripcion/padrino` | `src/app/(publico)/acciones.ts:69` | `enviarInscripcionPadrino` | Ninguno | Transacción que crea `usuarios` con rol `PADRINO`, `padrinos` y `postulaciones` de tipo `PADRINO` | Mismo formulario con el mensaje de cuenta creada |
| GET | `/contacto` | `src/app/(publico)/contacto/page.tsx:15` | `ContactoPage` | Ninguno | Formulario de contacto más teléfono, correo y dirección leídos de `configuracion` | `src/components/formularios-publicos.tsx:297` (`FormularioContacto`) |
| POST | `/contacto` | `src/app/(publico)/acciones.ts:159` | `enviarContacto` | Ninguno | Inserta en `mensajes_contacto` con estado `NUEVA` y registra auditoría | Mismo formulario con acuse de recibo |
| GET | `/donar` | `src/app/(publico)/donar/page.tsx:17` | `DonarPage` | Ninguno | Formulario de donación y panel lateral con las campañas activas y su porcentaje de avance | `src/components/formularios-publicos.tsx:362` (`FormularioDonacion`) |
| POST | `/donar` | `src/app/(publico)/acciones.ts:194` | `iniciarDonacion` | Ninguno | Pide la intención de pago a la pasarela, crea la donación en `PENDIENTE` y redirige | `redirect("/donar/pagar/<id>")` (`src/app/(publico)/acciones.ts:237`) |
| GET | `/donar/pagar/[id]` | `src/app/(publico)/donar/pagar/[id]/page.tsx:17` | `PagarPage` | Ninguno | Resumen del pago con dos botones de simulación. Si la donación ya no está `PENDIENTE` redirige al comprobante | `src/app/(publico)/donar/pagar/[id]/page.tsx` |
| POST | `/donar/pagar/[id]` | `src/app/(publico)/acciones.ts:240` | `confirmarDonacion` | Ninguno | Llama a `pasarela.confirmar()`, pone la donación en `COMPLETADA` o `FALLIDA` y audita `PAGO_APROBADO`/`PAGO_RECHAZADO` | `redirect("/donar/gracias/<id>")` (`src/app/(publico)/acciones.ts:265`) |
| GET | `/donar/gracias/[id]` | `src/app/(publico)/donar/gracias/[id]/page.tsx:16` | `GraciasPage` | Ninguno | Comprobante con referencia, monto, método, destino y fecha; advierte que no tiene validez fiscal | `src/app/(publico)/donar/gracias/[id]/page.tsx` |

### 4.2 Acceso y repartición

| Método | Ruta | Archivo:línea | Controlador o función | Rol requerido | Qué hace | Vista que devuelve |
|---|---|---|---|---|---|---|
| GET | `/login` | `src/app/login/page.tsx:25` | `LoginPage` | Ninguno; si ya hay sesión redirige a `/inicio` (`src/app/login/page.tsx:31`) | Formulario de acceso y tabla de cuentas de demostración | `src/app/login/formulario.tsx:8` (`FormularioLogin`) |
| POST | `/login` | `src/app/login/acciones.ts:7` | `iniciarSesion` | Ninguno | Llama `signIn("credentials")`; ante `AuthError` devuelve un mensaje genérico | Redirección a `redirectTo` o mismo formulario con error |
| GET/POST | `/api/auth/[...nextauth]` | `src/app/api/auth/[...nextauth]/route.ts:3` | `handlers.GET` / `handlers.POST` de NextAuth | Ninguno | Endpoints internos de NextAuth (`signin`, `callback`, `signout`, `session`, `csrf`) | Respuestas JSON o redirecciones de NextAuth |
| POST | (cualquiera) | `src/app/login/acciones.ts:30` | `cerrarSesion` | Sesión iniciada | Cierra la sesión; invocada desde `src/components/cerrar-sesion.tsx` | `redirect("/")` |
| GET | `/inicio` | `src/app/inicio/page.tsx:8` | `InicioPage` | Sesión iniciada (`requireSesion`) | Reparte: a `/admin` si tiene `expediente.leer`, `usuarios.gestionar` o `donaciones.leer`; a `/portal` si tiene `portal.padrino`; si no, a `/sin-acceso` | Solo redirecciones; no rinde HTML |
| GET | `/sin-acceso` | `src/app/sin-acceso/page.tsx:14` | `SinAccesoPage` | Ninguno | Explica que el rol de la cuenta no incluye el permiso necesario y ofrece volver | `src/app/sin-acceso/page.tsx` |

### 4.3 Portal del padrino

Guarda de zona: `src/app/portal/layout.tsx:13` exige `portal.padrino`.

| Método | Ruta | Archivo:línea | Controlador o función | Rol requerido | Qué hace | Vista que devuelve |
|---|---|---|---|---|---|---|
| GET | `/portal` | `src/app/portal/page.tsx:18` | `PortalPage` | `portal.padrino` (`src/app/portal/page.tsx:19`) | Lista los padrinazgos activos **del padrino de la sesión** (`padrinoId`, nunca un id de la URL) con aporte, fecha de inicio y número de avances visibles | `src/app/portal/page.tsx` dentro de `src/app/portal/layout.tsx` |
| GET | `/portal/[id]` | `src/app/portal/[id]/page.tsx:14` | `ProgresoPage` | `portal.padrino` (`src/app/portal/[id]/page.tsx:20`) | Progreso del beneficiario: solo si existe un padrinazgo activo entre ese beneficiario y el padrino de la sesión (`src/app/portal/[id]/page.tsx:24-29`); lista únicamente los seguimientos con `visibleParaPadrino = true`. Registra auditoría `VER_PORTAL` | `src/app/portal/[id]/page.tsx`; `notFound()` si el padrinazgo no es suyo |

### 4.4 Panel administrativo

Guarda de zona: `src/app/admin/layout.tsx:15` exige sesión y `src/app/admin/layout.tsx:18-26` exige al menos uno de `expediente.leer`, `donaciones.leer`, `usuarios.gestionar`, `auditoria.leer`.

| Método | Ruta | Archivo:línea | Controlador o función | Rol requerido | Qué hace | Vista que devuelve |
|---|---|---|---|---|---|---|
| GET | `/admin` | `src/app/admin/page.tsx:23` | `PanelPage` | Solo sesión (`requireSesion`, `src/app/admin/page.tsx:24`) más la guarda del layout | Indicadores de beneficiarios activos, con padrino, expedientes incompletos y solicitudes nuevas; últimos 5 avances; recaudado solo si tiene `donaciones.leer`; bitácora solo si tiene `auditoria.leer` | `src/app/admin/page.tsx` |
| GET | `/admin/beneficiarios` | `src/app/admin/beneficiarios/page.tsx:39` | `BeneficiariosPage` | `expediente.leer` (`:44`) | Listado con búsqueda por nombre, apellido o código y filtros por programa y estado; cuatro indicadores | `src/app/admin/beneficiarios/page.tsx` |
| GET | `/admin/beneficiarios/[id]` | `src/app/admin/beneficiarios/[id]/page.tsx:67` | `ExpedientePage` | `expediente.leer` (`:73`) | Expediente por secciones: generales, clínico, socioeconómico, documentos, avances y auditoría. Cada sección se **consulta solo si el permiso existe** (`:110-142`); calcula la completitud con 7 criterios (`:149-158`) y registra auditoría `VER_EXPEDIENTE` (`:164-170`) | `src/app/admin/beneficiarios/[id]/page.tsx` con `AccesoRestringido` en las secciones bloqueadas |
| GET | `/admin/beneficiarios/[id]/editar` | `src/app/admin/beneficiarios/[id]/editar/page.tsx:18` | `EditarPage` | `expediente.escribir` (`:24`) | Formulario con los datos generales precargados y la lista de programas | `src/app/admin/beneficiarios/[id]/editar/formulario.tsx:38` (`FormularioEditar`) |
| POST | `/admin/beneficiarios/[id]/editar` | `src/app/admin/beneficiarios/acciones.ts:39` | `guardarDatosGenerales` | `expediente.escribir` (`:43`) | Valida con `esquemaDatosGenerales` (`:12-37`), actualiza `beneficiarios`, audita `ACTUALIZAR` y revalida las rutas | Mismo formulario con «Cambios guardados» |
| GET | `/admin/beneficiarios/[id]/avance` | `src/app/admin/beneficiarios/[id]/avance/page.tsx:18` | `AvancePage` | `seguimiento.escribir` (`:24`) | Formulario de registro de avance con la fecha de hoy precargada | `src/app/admin/beneficiarios/[id]/avance/formulario.tsx:12` (`FormularioAvance`) |
| POST | `/admin/beneficiarios/[id]/avance` | `src/app/admin/beneficiarios/acciones.ts:103` | `registrarAvance` | `seguimiento.escribir` (`:107`) | Valida con `esquemaAvance` (`:94-101`), inserta en `seguimientos` con `registradoPor = usuario.nombre` y audita `CREAR` | `redirect("/admin/beneficiarios/<id>#avances")` (`:141`) |
| GET | `/admin/programas` | `src/app/admin/programas/page.tsx:21` | `ProgramasPage` | `expediente.leer` (`:22`) | Tabla de programas con su icono, descripción, número de beneficiarios y si está activo | `src/app/admin/programas/page.tsx` |
| GET | `/admin/documentos` | `src/app/admin/documentos/page.tsx:32` | `DocumentosPage` | `documentos.leer` (`:33`) | Todos los documentos con su expediente, categoría, tamaño, vencimiento y vigencia; avisa a quien tiene `documentos.subir` que la carga no está conectada (`:66`) | `src/app/admin/documentos/page.tsx` |
| GET | `/admin/campanas` | `src/app/admin/campanas/page.tsx:14` | `CampanasPage` | `donaciones.leer` (`:15`) | Tarjetas de campañas con meta, recaudado, barra de avance y número de donaciones | `src/app/admin/campanas/page.tsx` |
| GET | `/admin/donaciones` | `src/app/admin/donaciones/page.tsx:34` | `DonacionesPage` | `donaciones.leer` (`:39`) | Transacciones con filtro por estado (`COMPLETADA`, `PENDIENTE`, `FALLIDA`, `REEMBOLSADA`), total recaudado, pendientes y recurrentes | `src/app/admin/donaciones/page.tsx` |
| GET | `/admin/donantes` | `src/app/admin/donantes/page.tsx:30` | `DonantesPage` | `donaciones.leer` (`:31`) | Padrinos con sus beneficiarios asignados, aporte mensual sumado y si tienen acceso al portal | `src/app/admin/donantes/page.tsx` |
| GET | `/admin/asignaciones` | `src/app/admin/asignaciones/page.tsx:33` | `AsignacionesPage` | `padrinazgos.gestionar` (`:34`) | Formulario de nueva asignación (solo beneficiarios activos sin padrino y padrinos activos) y tabla de apadrinamientos vigentes con botón de finalizar | `src/app/admin/asignaciones/formulario.tsx:15` (`FormularioAsignacion`) |
| POST | `/admin/asignaciones` | `src/app/admin/asignaciones/acciones.ts:27` | `asignarPadrinazgo` | `padrinazgos.gestionar` (`:31`) | Valida, comprueba padrino activo, beneficiario `ACTIVO` y sin padrinazgo activo; reactiva el padrinazgo previo o crea uno nuevo; audita y revalida tres rutas | Mismo formulario con el mensaje de asignación |
| POST | `/admin/asignaciones` | `src/app/admin/asignaciones/acciones.ts:127` | `finalizarPadrinazgo` | `padrinazgos.gestionar` (`:128`) | Pone `activo = false` y `fechaFin = new Date()`, audita `ACTUALIZAR` y revalida | Recarga de `/admin/asignaciones` |
| GET | `/admin/voluntarios` | `src/app/admin/voluntarios/page.tsx:32` | `VoluntariosPage` | `expediente.leer` (`:33`) | Postulaciones de padrinos y voluntarios con su tipo, contacto, aporte o disponibilidad y estado | `src/app/admin/voluntarios/page.tsx` |
| POST | `/admin/voluntarios` | `src/app/admin/acciones.ts:35` | `cambiarEstadoPostulacion` | `expediente.leer` (`:36`) | Cambia `postulaciones.estado`, audita `ACTUALIZAR` y revalida `/admin/voluntarios` | Recarga de la tabla |
| GET | `/admin/solicitudes` | `src/app/admin/solicitudes/page.tsx:32` | `SolicitudesPage` | `expediente.leer` (`:33`) | Solicitudes de inscripción con edad calculada, procedencia, encargado, programa solicitado y estado | `src/app/admin/solicitudes/page.tsx` |
| POST | `/admin/solicitudes` | `src/app/admin/acciones.ts:14` | `cambiarEstadoSolicitud` | `expediente.leer` (`:15`) | Cambia `solicitudes_inscripcion.estado`, audita y revalida `/admin/solicitudes` | Recarga de la tabla |
| GET | `/admin/mensajes` | `src/app/admin/mensajes/page.tsx:15` | `MensajesPage` | `expediente.leer` (`:16`) | Mensajes de contacto en tarjetas, con enlace `mailto:` para responder | `src/app/admin/mensajes/page.tsx` |
| POST | `/admin/mensajes` | `src/app/admin/acciones.ts:56` | `cambiarEstadoMensaje` | `expediente.leer` (`:57`) | Cambia `mensajes_contacto.estado`, audita y revalida `/admin/mensajes` | Recarga del listado |
| GET | `/admin/eventos` | `src/app/admin/eventos/page.tsx:21` | `EventosPage` | `expediente.leer` (`:22`) | Tabla de eventos con lugar, inicio, fin, cupo y estado de publicación. Solo lectura, declarado en `:30` | `src/app/admin/eventos/page.tsx` |
| GET | `/admin/historias` | `src/app/admin/historias/page.tsx:13` | `HistoriasPage` | `expediente.leer` (`:14`) | Tarjetas de historias de avance con su estado de publicación | `src/app/admin/historias/page.tsx` |
| GET | `/admin/blog` | `src/app/admin/blog/page.tsx:21` | `BlogPage` | `expediente.leer` (`:22`) | Entradas de blog con categoría, autor, fecha, ruta (`slug`) y estado | `src/app/admin/blog/page.tsx` |
| GET | `/admin/usuarios` | `src/app/admin/usuarios/page.tsx:22` | `UsuariosPage` | `usuarios.gestionar` (`:23`) | Cuentas con su cargo, roles, último acceso y estado, más la matriz rol × permiso leída de la base | `src/app/admin/usuarios/page.tsx` |
| GET | `/admin/configuracion` | `src/app/admin/configuracion/page.tsx:21` | `ConfiguracionPage` | `usuarios.gestionar` (`:22`) | Tabla de `configuracion` agrupada por `grupo`, con aviso del modo de la pasarela | `src/app/admin/configuracion/page.tsx` |
| GET | `/admin/auditoria` | `src/app/admin/auditoria/page.tsx:22` | `AuditoriaPage` | `auditoria.leer` (`:27`) | Bitácora paginada de 25 en 25 (`:20`) con filtros por acción y entidad obtenidos con `distinct` | `src/app/admin/auditoria/page.tsx` |

**Totales de ruteo:** 34 pantallas (`page.tsx`), 1 ruta de API con 2 métodos, 14 acciones de servidor.
Rutas declaradas en el proxy: `/admin/:path*`, `/portal/:path*`, `/inicio` (`src/proxy.ts:25`).
Secciones registradas en la barra lateral: 17 (`src/components/admin/navegacion.ts:11-130`), agrupadas en 6 grupos (`src/components/admin/navegacion.ts:132-139`).

---

## 5. Modelo de datos

Fuente: `prisma/migrations/20260808195214_inicial/migration.sql` (DDL real) contrastado
con `prisma/schema.prisma` (nombres de modelo y mapeo `@@map`). Los nombres de tabla y
de columna son los de PostgreSQL; el nombre del modelo Prisma se indica entre paréntesis.
Todas las llaves primarias son de tipo `TEXT` generadas con `cuid()` en la capa Prisma.

### 5.0 Enumeraciones de PostgreSQL

| Tipo | Valores | Definición |
|---|---|---|
| `Sexo` | `MASCULINO`, `FEMENINO` | `migration.sql:2`; `schema.prisma:18-21` |
| `EstadoBeneficiario` | `ACTIVO`, `INACTIVO`, `EGRESADO` | `migration.sql:5`; `schema.prisma:23-27` |
| `EstadoExpediente` | `COMPLETO`, `EN_REVISION`, `INCOMPLETO` | `migration.sql:8`; `schema.prisma:29-33` |
| `NivelVulnerabilidad` | `BAJO`, `MEDIO`, `ALTO` | `migration.sql:11`; `schema.prisma:35-39` |
| `EstadoDonacion` | `PENDIENTE`, `COMPLETADA`, `FALLIDA`, `REEMBOLSADA` | `migration.sql:14`; `schema.prisma:41-46` |
| `EstadoSolicitud` | `NUEVA`, `EN_REVISION`, `APROBADA`, `RECHAZADA` | `migration.sql:17`; `schema.prisma:48-53` |
| `ModalidadPadrinazgo` | `MENSUAL`, `TRIMESTRAL`, `ANUAL`, `UNICO` | `migration.sql:20`; `schema.prisma:55-60` |
| `EstadoPublicacion` | `BORRADOR`, `PUBLICADO` | `migration.sql:23`; `schema.prisma:62-65` |

### 5.1 `usuarios` (modelo `User`) — `migration.sql:26-38`, `schema.prisma:71-85`

| Columna | Tipo | Nulo | Predeterminado |
|---|---|---|---|
| `id` | `TEXT` | No | — |
| `nombre` | `TEXT` | No | — |
| `email` | `TEXT` | No | — |
| `passwordHash` | `TEXT` | No | — |
| `cargo` | `TEXT` | Sí | — |
| `activo` | `BOOLEAN` | No | `true` |
| `ultimoAcceso` | `TIMESTAMP(3)` | Sí | — |
| `createdAt` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |
| `updatedAt` | `TIMESTAMP(3)` | No | (`@updatedAt`) |

- Llave primaria: `usuarios_pkey (id)` — `migration.sql:37`
- Llaves foráneas: ninguna
- Índices únicos: `usuarios_email_key (email)` — `migration.sql:443`
- Auditoría: `createdAt`, `updatedAt`, `ultimoAcceso` (escrito en `src/auth.ts:43-46`)

### 5.2 `roles` (modelo `Role`) — `migration.sql:41-49`, `schema.prisma:87-97`

| Columna | Tipo | Nulo | Predeterminado |
|---|---|---|---|
| `id` | `TEXT` | No | — |
| `clave` | `TEXT` | No | — |
| `nombre` | `TEXT` | No | — |
| `descripcion` | `TEXT` | Sí | — |
| `createdAt` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |

- Llave primaria: `roles_pkey (id)` — `migration.sql:48`
- Llaves foráneas: ninguna
- Índices únicos: `roles_clave_key (clave)` — `migration.sql:446`
- Auditoría: `createdAt` (sin `updatedAt`)

### 5.3 `permisos` (modelo `Permission`) — `migration.sql:52-60`, `schema.prisma:99-108`

| Columna | Tipo | Nulo | Predeterminado |
|---|---|---|---|
| `id` | `TEXT` | No | — |
| `clave` | `TEXT` | No | — |
| `nombre` | `TEXT` | No | — |
| `descripcion` | `TEXT` | Sí | — |
| `modulo` | `TEXT` | No | — |

- Llave primaria: `permisos_pkey (id)` — `migration.sql:59`
- Llaves foráneas: ninguna
- Índices únicos: `permisos_clave_key (clave)` — `migration.sql:449`
- Auditoría: **ninguna** (no tiene `createdAt` ni `updatedAt`)

### 5.4 `usuarios_roles` (modelo `UserRole`) — `migration.sql:63-68`, `schema.prisma:110-118`

| Columna | Tipo | Nulo |
|---|---|---|
| `userId` | `TEXT` | No |
| `roleId` | `TEXT` | No |

- Llave primaria compuesta: `usuarios_roles_pkey (userId, roleId)` — `migration.sql:67`
- Llaves foráneas: `userId` → `usuarios(id)` `ON DELETE CASCADE` (`migration.sql:515`); `roleId` → `roles(id)` `ON DELETE CASCADE` (`migration.sql:518`)
- Índices únicos: la propia llave primaria compuesta
- Auditoría: ninguna

### 5.5 `roles_permisos` (modelo `RolePermission`) — `migration.sql:71-76`, `schema.prisma:120-128`

| Columna | Tipo | Nulo |
|---|---|---|
| `roleId` | `TEXT` | No |
| `permissionId` | `TEXT` | No |

- Llave primaria compuesta: `roles_permisos_pkey (roleId, permissionId)` — `migration.sql:75`
- Llaves foráneas: `roleId` → `roles(id)` `ON DELETE CASCADE` (`migration.sql:521`); `permissionId` → `permisos(id)` `ON DELETE CASCADE` (`migration.sql:524`)
- Índices únicos: la propia llave primaria compuesta
- Auditoría: ninguna

### 5.6 `programas` (modelo `Programa`) — `migration.sql:79-88`, `schema.prisma:134-144`

| Columna | Tipo | Nulo | Predeterminado |
|---|---|---|---|
| `id` | `TEXT` | No | — |
| `nombre` | `TEXT` | No | — |
| `descripcion` | `TEXT` | No | — |
| `icono` | `TEXT` | No | `'HeartHandshake'` |
| `activo` | `BOOLEAN` | No | `true` |
| `createdAt` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |

- Llave primaria: `programas_pkey (id)` — `migration.sql:87`
- Llaves foráneas: ninguna
- Índices únicos: ninguno
- Auditoría: `createdAt`

### 5.7 `beneficiarios` (modelo `Beneficiario`) — `migration.sql:91-121`, `schema.prisma:146-186`

| Columna | Tipo | Nulo | Predeterminado |
|---|---|---|---|
| `id` | `TEXT` | No | — |
| `codigoExpediente` | `TEXT` | No | — |
| `nombres` | `TEXT` | No | — |
| `apellidos` | `TEXT` | No | — |
| `fechaNacimiento` | `DATE` | No | — |
| `sexo` | `Sexo` | No | — |
| `cui` | `TEXT` | Sí | — |
| `lugarNacimiento` | `TEXT` | Sí | — |
| `idiomaHogar` | `TEXT` | Sí | — |
| `tipoSangre` | `TEXT` | Sí | — |
| `direccion` | `TEXT` | Sí | — |
| `municipio` | `TEXT` | No | — |
| `departamento` | `TEXT` | No | — |
| `zonaResidencia` | `TEXT` | Sí | — |
| `encargadoNombre` | `TEXT` | No | — |
| `encargadoParentesco` | `TEXT` | No | — |
| `encargadoTelefono` | `TEXT` | No | — |
| `encargadoEmail` | `TEXT` | Sí | — |
| `fechaIngreso` | `DATE` | No | — |
| `programaId` | `TEXT` | No | — |
| `estado` | `EstadoBeneficiario` | No | `'ACTIVO'` |
| `estadoExpediente` | `EstadoExpediente` | No | `'EN_REVISION'` |
| `publicadoEnGaleria` | `BOOLEAN` | No | `false` |
| `resumenPublico` | `TEXT` | Sí | — |
| `fotoUrl` | `TEXT` | Sí | — |
| `createdAt` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |
| `updatedAt` | `TIMESTAMP(3)` | No | (`@updatedAt`) |

- Llave primaria: `beneficiarios_pkey (id)` — `migration.sql:120`
- Llaves foráneas: `programaId` → `programas(id)` `ON DELETE RESTRICT ON UPDATE CASCADE` — `migration.sql:527`
- Índices únicos: `beneficiarios_codigoExpediente_key (codigoExpediente)` (`migration.sql:452`); `beneficiarios_cui_key (cui)` (`migration.sql:455`)
- Índice no único: `beneficiarios_programaId_idx (programaId)` — `migration.sql:458`
- Auditoría: `createdAt`, `updatedAt`

### 5.8 `expedientes_clinicos` (modelo `ExpedienteClinico`) — `migration.sql:124-141`, `schema.prisma:188-206`

| Columna | Tipo | Nulo |
|---|---|---|
| `id` | `TEXT` | No |
| `beneficiarioId` | `TEXT` | No |
| `diagnosticoPrincipal` | `TEXT` | No |
| `codigoCie10` | `TEXT` | Sí |
| `fechaDiagnostico` | `DATE` | Sí |
| `tipoDiscapacidad` | `TEXT` | No |
| `gradoDependencia` | `TEXT` | No |
| `medicoTratante` | `TEXT` | Sí |
| `alergias` | `TEXT` | Sí |
| `medicamentos` | `TEXT` | Sí |
| `antecedentes` | `TEXT` | Sí |
| `terapias` | `TEXT[]` | No |
| `createdAt` | `TIMESTAMP(3)` | No (`CURRENT_TIMESTAMP`) |
| `updatedAt` | `TIMESTAMP(3)` | No |

- Llave primaria: `expedientes_clinicos_pkey (id)` — `migration.sql:140`
- Llaves foráneas: `beneficiarioId` → `beneficiarios(id)` `ON DELETE CASCADE` — `migration.sql:530`
- Índices únicos: `expedientes_clinicos_beneficiarioId_key (beneficiarioId)` — `migration.sql:461` (fuerza la relación 1—1)
- Auditoría: `createdAt`, `updatedAt`

### 5.9 `evaluaciones_clinicas` (modelo `EvaluacionClinica`) — `migration.sql:144-155`, `schema.prisma:208-221`

| Columna | Tipo | Nulo |
|---|---|---|
| `id` | `TEXT` | No |
| `beneficiarioId` | `TEXT` | No |
| `fecha` | `DATE` | No |
| `tipo` | `TEXT` | No |
| `profesional` | `TEXT` | No |
| `resultado` | `TEXT` | No |
| `documento` | `TEXT` | Sí |
| `createdAt` | `TIMESTAMP(3)` | No (`CURRENT_TIMESTAMP`) |

- Llave primaria: `evaluaciones_clinicas_pkey (id)` — `migration.sql:154`
- Llaves foráneas: `beneficiarioId` → `beneficiarios(id)` `ON DELETE CASCADE` — `migration.sql:533`
- Índices únicos: ninguno. Índice no único: `evaluaciones_clinicas_beneficiarioId_idx` — `migration.sql:464`
- Auditoría: `createdAt` (sin `updatedAt`)

### 5.10 `fichas_socioeconomicas` (modelo `FichaSocioeconomica`) — `migration.sql:158-177`, `schema.prisma:223-243`

| Columna | Tipo | Nulo | Predeterminado |
|---|---|---|---|
| `id` | `TEXT` | No | — |
| `beneficiarioId` | `TEXT` | No | — |
| `integrantesHogar` | `INTEGER` | No | — |
| `ingresoMensual` | `DECIMAL(10,2)` | No | — |
| `fuenteIngreso` | `TEXT` | No | — |
| `tipoVivienda` | `TEXT` | No | — |
| `materialConstruccion` | `TEXT` | No | — |
| `escolaridadEncargado` | `TEXT` | No | — |
| `serviciosBasicos` | `TEXT[]` | No | — |
| `observaciones` | `TEXT` | Sí | — |
| `nivelVulnerabilidad` | `NivelVulnerabilidad` | No | — |
| `elegibleBeca` | `BOOLEAN` | No | `false` |
| `fechaEstudio` | `DATE` | No | — |
| `realizadoPor` | `TEXT` | No | — |
| `createdAt` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |
| `updatedAt` | `TIMESTAMP(3)` | No | — |

- Llave primaria: `fichas_socioeconomicas_pkey (id)` — `migration.sql:176`
- Llaves foráneas: `beneficiarioId` → `beneficiarios(id)` `ON DELETE CASCADE` — `migration.sql:536`
- Índices únicos: `fichas_socioeconomicas_beneficiarioId_key (beneficiarioId)` — `migration.sql:467` (relación 1—1)
- Auditoría: `createdAt`, `updatedAt`, más `realizadoPor` como autoría funcional

### 5.11 `documentos` (modelo `Documento`) — `migration.sql:180-194`, `schema.prisma:245-261`

| Columna | Tipo | Nulo | Predeterminado |
|---|---|---|---|
| `id` | `TEXT` | No | — |
| `beneficiarioId` | `TEXT` | No | — |
| `nombre` | `TEXT` | No | — |
| `categoria` | `TEXT` | No | — |
| `tipoMime` | `TEXT` | No | — |
| `tamanoBytes` | `INTEGER` | No | — |
| `url` | `TEXT` | No | — |
| `vigente` | `BOOLEAN` | No | `true` |
| `fechaVencimiento` | `DATE` | Sí | — |
| `subidoPor` | `TEXT` | No | — |
| `createdAt` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |

- Llave primaria: `documentos_pkey (id)` — `migration.sql:193`
- Llaves foráneas: `beneficiarioId` → `beneficiarios(id)` `ON DELETE CASCADE` — `migration.sql:539`
- Índices únicos: ninguno. Índice no único: `documentos_beneficiarioId_idx` — `migration.sql:470`
- Auditoría: `createdAt` y `subidoPor` (texto libre, **no** una llave foránea a `usuarios`)

### 5.12 `seguimientos` (modelo `Seguimiento`) — `migration.sql:197-209`, `schema.prisma:265-279`

| Columna | Tipo | Nulo | Predeterminado |
|---|---|---|---|
| `id` | `TEXT` | No | — |
| `beneficiarioId` | `TEXT` | No | — |
| `fecha` | `DATE` | No | — |
| `area` | `TEXT` | No | — |
| `titulo` | `TEXT` | No | — |
| `descripcion` | `TEXT` | No | — |
| `visibleParaPadrino` | `BOOLEAN` | No | `false` |
| `registradoPor` | `TEXT` | No | — |
| `createdAt` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |

- Llave primaria: `seguimientos_pkey (id)` — `migration.sql:208`
- Llaves foráneas: `beneficiarioId` → `beneficiarios(id)` `ON DELETE CASCADE` — `migration.sql:542`
- Índices únicos: ninguno. Índice no único: `seguimientos_beneficiarioId_idx` — `migration.sql:473`
- Auditoría: `createdAt` y `registradoPor`, que se rellena con `usuario.nombre` en `src/app/admin/beneficiarios/acciones.ts:128`
- Comentario del esquema (`schema.prisma:263-264`): `visibleParaPadrino` decide qué avances puede consultar el padrino en su portal

### 5.13 `citas` (modelo `Cita`) — `migration.sql:212-221`, `schema.prisma:281-292`

| Columna | Tipo | Nulo | Predeterminado |
|---|---|---|---|
| `id` | `TEXT` | No | — |
| `beneficiarioId` | `TEXT` | No | — |
| `fecha` | `TIMESTAMP(3)` | No | — |
| `tipo` | `TEXT` | No | — |
| `profesional` | `TEXT` | No | — |
| `createdAt` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |

- Llave primaria: `citas_pkey (id)` — `migration.sql:220`
- Llaves foráneas: `beneficiarioId` → `beneficiarios(id)` `ON DELETE CASCADE` — `migration.sql:545`
- Índices únicos: ninguno. Índice no único: `citas_beneficiarioId_idx` — `migration.sql:476`
- Auditoría: `createdAt`

### 5.14 `padrinos` (modelo `Padrino`) — `migration.sql:224-238`, `schema.prisma:298-315`

| Columna | Tipo | Nulo | Predeterminado |
|---|---|---|---|
| `id` | `TEXT` | No | — |
| `userId` | `TEXT` | Sí | — |
| `nombre` | `TEXT` | No | — |
| `email` | `TEXT` | No | — |
| `telefono` | `TEXT` | Sí | — |
| `direccion` | `TEXT` | Sí | — |
| `ocupacion` | `TEXT` | Sí | — |
| `nit` | `TEXT` | Sí | — |
| `activo` | `BOOLEAN` | No | `true` |
| `createdAt` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |
| `updatedAt` | `TIMESTAMP(3)` | No | — |

- Llave primaria: `padrinos_pkey (id)` — `migration.sql:237`
- Llaves foráneas: `userId` → `usuarios(id)` `ON DELETE SET NULL ON UPDATE CASCADE` — `migration.sql:548`
- Índices únicos: `padrinos_userId_key (userId)` (`migration.sql:479`, fuerza 1—1 con `usuarios`); `padrinos_email_key (email)` (`migration.sql:482`)
- Auditoría: `createdAt`, `updatedAt`

### 5.15 `padrinazgos` (modelo `Padrinazgo`) — `migration.sql:241-253`, `schema.prisma:317-333`

| Columna | Tipo | Nulo | Predeterminado |
|---|---|---|---|
| `id` | `TEXT` | No | — |
| `padrinoId` | `TEXT` | No | — |
| `beneficiarioId` | `TEXT` | No | — |
| `aporteMensual` | `DECIMAL(10,2)` | No | — |
| `modalidad` | `ModalidadPadrinazgo` | No | `'MENSUAL'` |
| `activo` | `BOOLEAN` | No | `true` |
| `fechaInicio` | `DATE` | No | — |
| `fechaFin` | `DATE` | Sí | — |
| `createdAt` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |

- Llave primaria: `padrinazgos_pkey (id)` — `migration.sql:252`
- Llaves foráneas: `padrinoId` → `padrinos(id)` `ON DELETE CASCADE` (`migration.sql:551`); `beneficiarioId` → `beneficiarios(id)` `ON DELETE CASCADE` (`migration.sql:554`)
- Índices únicos: `padrinazgos_padrinoId_beneficiarioId_key (padrinoId, beneficiarioId)` — `migration.sql:488`. Es la restricción que obliga a *reactivar* en lugar de crear (`src/app/admin/asignaciones/acciones.ts:75-108`)
- Índice no único: `padrinazgos_beneficiarioId_idx` — `migration.sql:485`
- Auditoría: `createdAt` (sin `updatedAt`); `fechaFin` marca el cierre

### 5.16 `donaciones` (modelo `Donacion`) — `migration.sql:256-273`, `schema.prisma:335-354`

| Columna | Tipo | Nulo | Predeterminado |
|---|---|---|---|
| `id` | `TEXT` | No | — |
| `donanteNombre` | `TEXT` | No | — |
| `donanteEmail` | `TEXT` | No | — |
| `padrinoId` | `TEXT` | Sí | — |
| `campaignId` | `TEXT` | Sí | — |
| `monto` | `DECIMAL(10,2)` | No | — |
| `moneda` | `TEXT` | No | `'GTQ'` |
| `metodo` | `TEXT` | No | — |
| `estado` | `EstadoDonacion` | No | `'PENDIENTE'` |
| `referenciaPasarela` | `TEXT` | No | — |
| `recurrente` | `BOOLEAN` | No | `false` |
| `mensaje` | `TEXT` | Sí | — |
| `createdAt` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |
| `updatedAt` | `TIMESTAMP(3)` | No | — |

- Llave primaria: `donaciones_pkey (id)` — `migration.sql:272`
- Llaves foráneas: `padrinoId` → `padrinos(id)` `ON DELETE SET NULL` (`migration.sql:557`); `campaignId` → `campanas(id)` `ON DELETE SET NULL` (`migration.sql:560`)
- Índices únicos: `donaciones_referenciaPasarela_key (referenciaPasarela)` — `migration.sql:491`
- Auditoría: `createdAt`, `updatedAt`

### 5.17 `campanas` (modelo `Campaign`) — `migration.sql:276-291`, `schema.prisma:356-372`

| Columna | Tipo | Nulo | Predeterminado |
|---|---|---|---|
| `id` | `TEXT` | No | — |
| `titulo` | `TEXT` | No | — |
| `slug` | `TEXT` | No | — |
| `descripcion` | `TEXT` | No | — |
| `meta` | `DECIMAL(10,2)` | No | — |
| `recaudado` | `DECIMAL(10,2)` | No | `0` |
| `fechaInicio` | `DATE` | No | — |
| `fechaFin` | `DATE` | Sí | — |
| `activa` | `BOOLEAN` | No | `true` |
| `imagenUrl` | `TEXT` | Sí | — |
| `createdAt` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |
| `updatedAt` | `TIMESTAMP(3)` | No | — |

- Llave primaria: `campanas_pkey (id)` — `migration.sql:290`
- Llaves foráneas: ninguna
- Índices únicos: `campanas_slug_key (slug)` — `migration.sql:494`
- Auditoría: `createdAt`, `updatedAt`

### 5.18 `historias` (modelo `Story`) — `migration.sql:294-309`, `schema.prisma:378-393`

| Columna | Tipo | Nulo | Predeterminado |
|---|---|---|---|
| `id` | `TEXT` | No | — |
| `titulo` | `TEXT` | No | — |
| `slug` | `TEXT` | No | — |
| `resumen` | `TEXT` | No | — |
| `contenido` | `TEXT` | No | — |
| `protagonista` | `TEXT` | No | — |
| `programa` | `TEXT` | Sí | — |
| `imagenUrl` | `TEXT` | Sí | — |
| `estado` | `EstadoPublicacion` | No | `'PUBLICADO'` |
| `publicadaEn` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |
| `createdAt` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |
| `updatedAt` | `TIMESTAMP(3)` | No | — |

- Llave primaria: `historias_pkey (id)` — `migration.sql:308`
- Llaves foráneas: ninguna. `programa` es **texto libre**, no una llave foránea a `programas`
- Índices únicos: `historias_slug_key (slug)` — `migration.sql:497`
- Auditoría: `createdAt`, `updatedAt`, `publicadaEn`

### 5.19 `entradas_blog` (modelo `Post`) — `migration.sql:312-326`, `schema.prisma:395-409`

| Columna | Tipo | Nulo | Predeterminado |
|---|---|---|---|
| `id` | `TEXT` | No | — |
| `titulo` | `TEXT` | No | — |
| `slug` | `TEXT` | No | — |
| `resumen` | `TEXT` | No | — |
| `contenido` | `TEXT` | No | — |
| `autor` | `TEXT` | No | — |
| `categoria` | `TEXT` | No | — |
| `estado` | `EstadoPublicacion` | No | `'PUBLICADO'` |
| `publicadoEn` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |
| `createdAt` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |
| `updatedAt` | `TIMESTAMP(3)` | No | — |

- Llave primaria: `entradas_blog_pkey (id)` — `migration.sql:325`
- Llaves foráneas: ninguna. `autor` es texto libre
- Índices únicos: `entradas_blog_slug_key (slug)` — `migration.sql:500`
- Auditoría: `createdAt`, `updatedAt`, `publicadoEn`

### 5.20 `eventos` (modelo `Event`) — `migration.sql:329-343`, `schema.prisma:411-425`

| Columna | Tipo | Nulo | Predeterminado |
|---|---|---|---|
| `id` | `TEXT` | No | — |
| `titulo` | `TEXT` | No | — |
| `slug` | `TEXT` | No | — |
| `descripcion` | `TEXT` | No | — |
| `lugar` | `TEXT` | No | — |
| `inicia` | `TIMESTAMP(3)` | No | — |
| `termina` | `TIMESTAMP(3)` | Sí | — |
| `cupo` | `INTEGER` | Sí | — |
| `estado` | `EstadoPublicacion` | No | `'PUBLICADO'` |
| `createdAt` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |
| `updatedAt` | `TIMESTAMP(3)` | No | — |

- Llave primaria: `eventos_pkey (id)` — `migration.sql:342`
- Llaves foráneas: ninguna
- Índices únicos: `eventos_slug_key (slug)` — `migration.sql:503`
- Auditoría: `createdAt`, `updatedAt`

### 5.21 `medios` (modelo `Media`) — `migration.sql:346-357`, `schema.prisma:427-438`

| Columna | Tipo | Nulo | Predeterminado |
|---|---|---|---|
| `id` | `TEXT` | No | — |
| `nombre` | `TEXT` | No | — |
| `url` | `TEXT` | No | — |
| `tipoMime` | `TEXT` | No | — |
| `tamanoBytes` | `INTEGER` | No | — |
| `alt` | `TEXT` | Sí | — |
| `subidoPor` | `TEXT` | No | — |
| `createdAt` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |

- Llave primaria: `medios_pkey (id)` — `migration.sql:356`
- Llaves foráneas: ninguna
- Índices únicos: ninguno
- Auditoría: `createdAt`, `subidoPor` (texto libre)
- Observación: **ninguna pantalla consulta esta tabla**; solo la escribe `prisma/seed.ts:1133-1153`

### 5.22 `solicitudes_inscripcion` (modelo `SupportRequest`) — `migration.sql:360-380`, `schema.prisma:445-465`

| Columna | Tipo | Nulo | Predeterminado |
|---|---|---|---|
| `id` | `TEXT` | No | — |
| `nombreNino` | `TEXT` | No | — |
| `fechaNacimiento` | `DATE` | No | — |
| `sexo` | `Sexo` | No | — |
| `municipio` | `TEXT` | No | — |
| `departamento` | `TEXT` | No | — |
| `encargadoNombre` | `TEXT` | No | — |
| `encargadoParentesco` | `TEXT` | No | — |
| `encargadoTelefono` | `TEXT` | No | — |
| `encargadoEmail` | `TEXT` | Sí | — |
| `diagnostico` | `TEXT` | Sí | — |
| `programaSolicitado` | `TEXT` | Sí | — |
| `comentarios` | `TEXT` | Sí | — |
| `estado` | `EstadoSolicitud` | No | `'NUEVA'` |
| `notaInterna` | `TEXT` | Sí | — |
| `createdAt` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |
| `updatedAt` | `TIMESTAMP(3)` | No | — |

- Llave primaria: `solicitudes_inscripcion_pkey (id)` — `migration.sql:379`
- Llaves foráneas: ninguna. `programaSolicitado` es texto libre; **no** hay llave foránea hacia `beneficiarios` cuando la solicitud se aprueba
- Índices únicos: ninguno
- Auditoría: `createdAt`, `updatedAt`
- Comentario del esquema (`schema.prisma:444`): inscripción de beneficiarios enviada desde el sitio público

### 5.23 `postulaciones` (modelo `VolunteerApplication`) — `migration.sql:383-399`, `schema.prisma:468-484`

| Columna | Tipo | Nulo | Predeterminado |
|---|---|---|---|
| `id` | `TEXT` | No | — |
| `nombre` | `TEXT` | No | — |
| `email` | `TEXT` | No | — |
| `telefono` | `TEXT` | No | — |
| `tipo` | `TEXT` | No | — |
| `ocupacion` | `TEXT` | Sí | — |
| `disponibilidad` | `TEXT` | Sí | — |
| `aporteMensual` | `DECIMAL(10,2)` | Sí | — |
| `motivacion` | `TEXT` | Sí | — |
| `estado` | `EstadoSolicitud` | No | `'NUEVA'` |
| `notaInterna` | `TEXT` | Sí | — |
| `createdAt` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |
| `updatedAt` | `TIMESTAMP(3)` | No | — |

- Llave primaria: `postulaciones_pkey (id)` — `migration.sql:398`
- Llaves foráneas: ninguna; tampoco hay vínculo con la fila de `padrinos` que se crea en la misma transacción (`src/app/(publico)/acciones.ts:102-136`)
- Índices únicos: ninguno; `email` **no** es único en esta tabla
- Auditoría: `createdAt`, `updatedAt`
- `tipo`: texto libre. El único valor escrito por la aplicación es `"PADRINO"` (`src/app/(publico)/acciones.ts:128`); la interfaz distingue `PADRINO` de cualquier otro valor en `src/app/admin/voluntarios/page.tsx:64-68`

### 5.24 `mensajes_contacto` (modelo `ContactMessage`) — `migration.sql:402-414`, `schema.prisma:486-498`

| Columna | Tipo | Nulo | Predeterminado |
|---|---|---|---|
| `id` | `TEXT` | No | — |
| `nombre` | `TEXT` | No | — |
| `email` | `TEXT` | No | — |
| `telefono` | `TEXT` | Sí | — |
| `asunto` | `TEXT` | No | — |
| `mensaje` | `TEXT` | No | — |
| `estado` | `EstadoSolicitud` | No | `'NUEVA'` |
| `createdAt` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |
| `updatedAt` | `TIMESTAMP(3)` | No | — |

- Llave primaria: `mensajes_contacto_pkey (id)` — `migration.sql:413`
- Llaves foráneas: ninguna
- Índices únicos: ninguno
- Auditoría: `createdAt`, `updatedAt`
- Observación: esta tabla **no** tiene la columna `notaInterna` que sí tienen las otras dos bandejas

### 5.25 `configuracion` (modelo `Setting`) — `migration.sql:417-426`, `schema.prisma:504-513`

| Columna | Tipo | Nulo | Predeterminado |
|---|---|---|---|
| `id` | `TEXT` | No | — |
| `clave` | `TEXT` | No | — |
| `valor` | `TEXT` | No | — |
| `descripcion` | `TEXT` | Sí | — |
| `grupo` | `TEXT` | No | `'general'` |
| `updatedAt` | `TIMESTAMP(3)` | No | — |

- Llave primaria: `configuracion_pkey (id)` — `migration.sql:425`
- Llaves foráneas: ninguna
- Índices únicos: `configuracion_clave_key (clave)` — `migration.sql:506`
- Auditoría: solo `updatedAt` (**no** tiene `createdAt`)
- Claves sembradas (`prisma/seed.ts:1243-1290`): `organizacion.nombre`, `organizacion.nombreCompleto`, `contacto.telefono`, `contacto.email`, `contacto.direccion`, `donaciones.aporteSugerido`, `pasarela.modo`

### 5.26 `bitacora` (modelo `AuditLog`) — `migration.sql:429-440`, `schema.prisma:515-528`

| Columna | Tipo | Nulo | Predeterminado |
|---|---|---|---|
| `id` | `TEXT` | No | — |
| `actor` | `TEXT` | No | — |
| `accion` | `TEXT` | No | — |
| `entidad` | `TEXT` | No | — |
| `entidadId` | `TEXT` | Sí | — |
| `detalle` | `TEXT` | Sí | — |
| `ip` | `TEXT` | Sí | — |
| `createdAt` | `TIMESTAMP(3)` | No | `CURRENT_TIMESTAMP` |

- Llave primaria: `bitacora_pkey (id)` — `migration.sql:439`
- Llaves foráneas: **ninguna**. `actor` guarda el correo como texto y `entidadId` el id de la entidad afectada sin integridad referencial (es deliberado: la bitácora debe sobrevivir al borrado de la entidad)
- Índices únicos: ninguno. Índices no únicos: `bitacora_entidad_idx` (`migration.sql:509`) y `bitacora_accion_idx` (`migration.sql:512`)
- Auditoría: `createdAt`
- Valores de `accion` que escribe la aplicación: `INICIO_SESION` (`src/auth.ts:51`), `CREAR`, `ACTUALIZAR`, `PAGO_APROBADO` / `PAGO_RECHAZADO` (`src/app/(publico)/acciones.ts:259`), `VER_EXPEDIENTE` (`src/app/admin/beneficiarios/[id]/page.tsx:166`), `VER_PORTAL` (`src/app/portal/[id]/page.tsx:62`)

### 5.27 Lista de relaciones

```
usuarios              1---N usuarios_roles        (por userId)         — un usuario puede tener varios roles; borrado en cascada
roles                 1---N usuarios_roles        (por roleId)         — un rol se asigna a varios usuarios; borrado en cascada
roles                 1---N roles_permisos        (por roleId)         — un rol concede varios permisos; borrado en cascada
permisos              1---N roles_permisos        (por permissionId)   — un permiso pertenece a varios roles; borrado en cascada
usuarios              1---1 padrinos              (por userId)         — opcional y único; al borrar el usuario el padrino queda con userId nulo
programas             1---N beneficiarios         (por programaId)     — cada beneficiario cursa un programa; RESTRICT impide borrar un programa con beneficiarios
beneficiarios         1---1 expedientes_clinicos  (por beneficiarioId) — único; borrado en cascada
beneficiarios         1---1 fichas_socioeconomicas(por beneficiarioId) — único; borrado en cascada
beneficiarios         1---N evaluaciones_clinicas (por beneficiarioId) — varias evaluaciones por expediente; cascada
beneficiarios         1---N documentos            (por beneficiarioId) — varios documentos adjuntos; cascada
beneficiarios         1---N seguimientos          (por beneficiarioId) — varios avances de seguimiento; cascada
beneficiarios         1---N citas                 (por beneficiarioId) — varias citas agendadas; cascada
beneficiarios         1---N padrinazgos           (por beneficiarioId) — histórico de apadrinamientos; en la práctica solo uno activo a la vez
padrinos              1---N padrinazgos           (por padrinoId)      — un padrino puede apadrinar a varios beneficiarios; cascada
padrinos              1---N donaciones            (por padrinoId)      — opcional; al borrar el padrino la donación conserva el registro con padrinoId nulo
campanas              1---N donaciones            (por campaignId)     — opcional; al borrar la campaña la donación queda sin destino
```

Relación N—M resuelta con tabla intermedia:

```
usuarios  N---M roles     mediante usuarios_roles (userId, roleId)
roles     N---M permisos  mediante roles_permisos (roleId, permissionId)
padrinos  N---M beneficiarios mediante padrinazgos (padrinoId, beneficiarioId), con único compuesto
```

Tablas sin ninguna relación declarada: `historias`, `entradas_blog`, `eventos`, `medios`, `solicitudes_inscripcion`, `postulaciones`, `mensajes_contacto`, `configuracion`, `bitacora`.

---

## 6. Campos de estado

Se incluye todo campo que representa un estado, una situación o una condición
booleana de negocio. La columna «dónde se cambia» distingue entre el código de la
aplicación y `prisma/seed.ts`, que solo siembra datos de demostración.

### 6.1 Estados con enumeración

| Tabla.columna | Valores posibles reales | Dónde se cambia cada valor (archivo:línea) | Qué transición representa |
|---|---|---|---|
| `beneficiarios.estado` | `ACTIVO`, `INACTIVO`, `EGRESADO` (`migration.sql:5`) | Valor inicial `ACTIVO` por predeterminado de columna (`migration.sql:112`). Único punto de cambio en la aplicación: `src/app/admin/beneficiarios/acciones.ts:74`, validado por el `z.enum` de `src/app/admin/beneficiarios/acciones.ts:33` y elegido en el formulario `src/app/admin/beneficiarios/[id]/editar/formulario.tsx`. Siembra inicial en `prisma/seed.ts:206-441` | Ciclo de vida del beneficiario en el centro: alta activa → suspensión temporal (`INACTIVO`) → egreso definitivo (`EGRESADO`). `ACTIVO` es condición para aparecer en la galería pública (`src/app/(publico)/apadrina/page.tsx:32`), para poder ser asignado a un padrino (`src/app/admin/asignaciones/acciones.ts:62`) y para contar en las cifras de la portada (`src/app/(publico)/page.tsx:100`) |
| `beneficiarios.estadoExpediente` | `COMPLETO`, `EN_REVISION`, `INCOMPLETO` (`migration.sql:8`) | Valor inicial `EN_REVISION` (`migration.sql:113`). Cambio en `src/app/admin/beneficiarios/acciones.ts:75`, validado en `src/app/admin/beneficiarios/acciones.ts:34` | Madurez documental del expediente. `distinto de COMPLETO` alimenta el indicador «Expedientes incompletos» (`src/app/admin/beneficiarios/page.tsx:75`, `src/app/admin/page.tsx:39-41`). Se muestra con `ChipEstadoExpediente` (`src/components/ui.tsx:174`) |
| `solicitudes_inscripcion.estado` | `NUEVA`, `EN_REVISION`, `APROBADA`, `RECHAZADA` (`migration.sql:17`) | Alta en `NUEVA` por predeterminado al crearse desde el sitio público (`src/app/(publico)/acciones.ts:34-49`, `migration.sql:374`). Cambio a cualquiera de los cuatro valores en `src/app/admin/acciones.ts:19-22` (`cambiarEstadoSolicitud`), con las opciones del desplegable en `src/components/admin/selector-estado.tsx:3-8` y el `z.enum` en `src/app/admin/acciones.ts:11` | Triaje de la solicitud de ingreso: recibida → en estudio por trabajo social → aceptada o rechazada. `NUEVA` alimenta el indicador «Sin revisar» (`src/app/admin/solicitudes/page.tsx:37`) y la tarjeta del panel (`src/app/admin/page.tsx:42`) |
| `postulaciones.estado` | `NUEVA`, `EN_REVISION`, `APROBADA`, `RECHAZADA` | Alta en `NUEVA` al inscribirse un padrino (`src/app/(publico)/acciones.ts:123-133`). Cambio en `src/app/admin/acciones.ts:40-43` (`cambiarEstadoPostulacion`) | Triaje de la postulación de padrino o voluntario. **No** condiciona el acceso: la cuenta del portal ya quedó creada y activa en la misma transacción (`src/app/(publico)/acciones.ts:103-111`) |
| `mensajes_contacto.estado` | `NUEVA`, `EN_REVISION`, `APROBADA`, `RECHAZADA` | Alta en `NUEVA` (`src/app/(publico)/acciones.ts:172-180`). Cambio en `src/app/admin/acciones.ts:61-64` (`cambiarEstadoMensaje`) | Seguimiento de la atención del mensaje. Los rótulos `APROBADA` y `RECHAZADA` se reutilizan del mismo enum aunque semánticamente encajan mal con un mensaje de contacto |
| `donaciones.estado` | `PENDIENTE`, `COMPLETADA`, `FALLIDA`, `REEMBOLSADA` (`migration.sql:14`) | `PENDIENTE`: al crear la donación (`src/app/(publico)/acciones.ts:222`, más el predeterminado de `migration.sql:265`). `COMPLETADA` o `FALLIDA`: en `src/app/(publico)/acciones.ts:252-255`, según lo que devuelva `pasarela.confirmar()` (`src/lib/pasarela.ts:59-67`). `REEMBOLSADA`: **ningún punto del código lo escribe**; solo se puede filtrar por él en `src/app/admin/donaciones/page.tsx:32` y sembrarse en `prisma/seed.ts:978-1030` | Ciclo de la transacción: intención creada → aprobada o rechazada por la pasarela. `PENDIENTE` bloquea la vista del comprobante y fuerza la pantalla de pago (`src/app/(publico)/donar/pagar/[id]/page.tsx:29`); solo `COMPLETADA` suma al total recaudado (`src/app/admin/page.tsx:56-59`, `src/app/admin/donaciones/page.tsx:52-56`) |
| `padrinazgos.modalidad` | `MENSUAL`, `TRIMESTRAL`, `ANUAL`, `UNICO` (`migration.sql:20`) | Se fija al asignar en `src/app/admin/asignaciones/acciones.ts:89`, validada por el `z.enum` de `src/app/admin/asignaciones/acciones.ts:19-21`. Predeterminado de columna: `MENSUAL` (`migration.sql:246`) | Periodicidad del compromiso económico del padrino. No es un ciclo de vida: se define una vez y solo cambia al reasignar |
| `fichas_socioeconomicas.nivelVulnerabilidad` | `BAJO`, `MEDIO`, `ALTO` (`migration.sql:11`) | **Ningún punto de la aplicación lo escribe.** Solo se siembra en `prisma/seed.ts:701-770` y se muestra con `ChipVulnerabilidad` (`src/components/ui.tsx:207`) en `src/app/admin/beneficiarios/[id]/page.tsx` | Clasificación del hogar resultante del estudio socioeconómico. Sin formulario de edición, la transición ocurre fuera del sistema |
| `historias.estado` | `BORRADOR`, `PUBLICADO` (`migration.sql:23`) | Predeterminado `PUBLICADO` (`migration.sql:303`). **Ningún punto de la aplicación lo cambia**; solo `prisma/seed.ts:1033-1076` | Visibilidad pública de la historia: la portada solo trae las que están en `PUBLICADO` (`src/app/(publico)/page.tsx:129-133`) |
| `entradas_blog.estado` | `BORRADOR`, `PUBLICADO` | Predeterminado `PUBLICADO` (`migration.sql:320`). **Sin cambio desde la aplicación**; siembra en `prisma/seed.ts:1077-1105`; se muestra en `src/app/admin/blog/page.tsx` | Visibilidad de la entrada de blog. No existe todavía una pantalla pública de blog que la consuma |
| `eventos.estado` | `BORRADOR`, `PUBLICADO` | Predeterminado `PUBLICADO` (`migration.sql:338`). **Sin cambio desde la aplicación**; siembra en `prisma/seed.ts:1106-1132`; se muestra en `src/app/admin/eventos/page.tsx` | Visibilidad del evento. La propia pantalla declara que el alta y la edición no están implementadas (`src/app/admin/eventos/page.tsx:30`) |

### 6.2 Estados booleanos

| Tabla.columna | Valores posibles reales | Dónde se cambia cada valor (archivo:línea) | Qué transición representa |
|---|---|---|---|
| `beneficiarios.publicadoEnGaleria` | `true`, `false`; predeterminado `false` (`migration.sql:114`) | `src/app/admin/beneficiarios/acciones.ts:76`: `v.publicadoEnGaleria === "on"`, casilla del formulario de edición | Consentimiento de publicación en la galería pública. Es filtro obligatorio en `src/app/(publico)/apadrina/page.tsx:33`, `src/app/(publico)/apadrina/[id]/page.tsx:34` y `src/app/(publico)/page.tsx:114` |
| `seguimientos.visibleParaPadrino` | `true`, `false`; predeterminado `false` (`migration.sql:204`) | `src/app/admin/beneficiarios/acciones.ts:118` (lectura de la casilla) y `:127` (escritura). El detalle auditado distingue ambos casos en `:137` | Decide si el avance se comparte con el padrino. Es el único filtro entre el expediente interno y el portal: `src/app/portal/[id]/page.tsx:39` y el conteo de `src/app/portal/page.tsx:33` |
| `padrinazgos.activo` | `true`, `false`; predeterminado `true` (`migration.sql:247`) | `true`: al asignar o reactivar, en `src/app/admin/asignaciones/acciones.ts:90` (aplicado tanto en el `update` de `:96-99` como en el `create` de `:101-108`). `false`: en `src/app/admin/asignaciones/acciones.ts:146`, junto con `fechaFin = new Date()` | Vigencia del apadrinamiento. Un beneficiario con padrinazgo activo desaparece de la galería pública (`src/app/(publico)/apadrina/page.tsx:34`) y deja de ser asignable (`src/app/admin/asignaciones/acciones.ts:54` y `:67-73`) |
| `usuarios.activo` | `true`, `false`; predeterminado `true` (`migration.sql:32`) | **Ningún punto de la aplicación lo cambia**; se crea siempre en `true` (`src/app/(publico)/acciones.ts:103-111`, `prisma/seed.ts:118-127`) | Habilitación de la cuenta. Se **comprueba** en `src/auth.ts:38`: una cuenta inactiva no puede iniciar sesión. Se muestra en `src/app/admin/usuarios/page.tsx:73-77`. La desactivación solo puede hacerse directamente en la base |
| `padrinos.activo` | `true`, `false`; predeterminado `true` (`migration.sql:233`) | **Ningún punto de la aplicación lo cambia.** Se **comprueba** al asignar (`src/app/admin/asignaciones/acciones.ts:59-61`) y filtra el desplegable de padrinos (`src/app/admin/asignaciones/page.tsx:66`) y las cifras públicas (`src/app/(publico)/page.tsx:102`) | Disponibilidad del padrino para recibir asignaciones |
| `programas.activo` | `true`, `false`; predeterminado `true` (`migration.sql:84`) | **Ningún punto de la aplicación lo cambia**; siembra en `prisma/seed.ts:133-205` | Programa vigente. Filtra la portada (`src/app/(publico)/page.tsx:101`, `:107`), la galería (`src/app/(publico)/apadrina/page.tsx:26`) y el formulario de inscripción (`src/app/(publico)/inscripcion/beneficiario/page.tsx:18`). El panel muestra todos, activos o no (`src/app/admin/programas/page.tsx:24-27`) |
| `campanas.activa` | `true`, `false`; predeterminado `true` (`migration.sql:285`) | **Ningún punto de la aplicación lo cambia**; siembra en `prisma/seed.ts:949-977` | Campaña abierta a donaciones. Solo las activas se ofrecen como destino en `/donar` (`src/app/(publico)/donar/page.tsx:20`) |
| `documentos.vigente` | `true`, `false`; predeterminado `true` (`migration.sql:188`) | **Ningún punto de la aplicación lo cambia**; siembra en `prisma/seed.ts:525-595` y `:827-853` | Vigencia del documento adjunto. Alimenta los indicadores «Vigentes» y «Vencidos» (`src/app/admin/documentos/page.tsx:45-46`) y el distintivo del expediente (`src/app/admin/beneficiarios/[id]/page.tsx:489-492`) |
| `donaciones.recurrente` | `true`, `false`; predeterminado `false` (`migration.sql:267`) | `src/app/(publico)/acciones.ts:224`: `v.recurrente === "on"` desde la casilla del formulario de donación | Marca el aporte como mensual frente a puntual. Se cuenta en `src/app/admin/donaciones/page.tsx:58` y se muestra como «Frecuencia» en el resumen de pago (`src/app/(publico)/donar/pagar/[id]/page.tsx:66-68`) |
| `fichas_socioeconomicas.elegibleBeca` | `true`, `false`; predeterminado `false` (`migration.sql:170`) | **Ningún punto de la aplicación lo cambia**; siembra en `prisma/seed.ts:701-770` | Resultado del estudio socioeconómico sobre el derecho a beca. Solo se consulta en el expediente |

### 6.3 Resumen de máquinas de estado utilizables

| Entidad | Estado inicial | Transiciones implementadas en código | Transiciones sin implementar |
|---|---|---|---|
| `beneficiarios` (`estado`) | `ACTIVO` | Cualquier valor → cualquier valor, desde el formulario de edición (`src/app/admin/beneficiarios/acciones.ts:74`) | No hay alta de beneficiarios: **no existe ningún `prisma.beneficiario.create` en `src/`**; el ingreso solo ocurre por seed o directamente en la base |
| `beneficiarios` (`estadoExpediente`) | `EN_REVISION` | Cualquier valor → cualquier valor (`src/app/admin/beneficiarios/acciones.ts:75`) | No hay cálculo automático a partir de la completitud, que sí se computa en `src/app/admin/beneficiarios/[id]/page.tsx:149-158` pero no se persiste |
| `solicitudes_inscripcion` | `NUEVA` | `NUEVA ↔ EN_REVISION ↔ APROBADA ↔ RECHAZADA`, sin restricción de orden (`src/app/admin/acciones.ts:14-33`) | Aprobar una solicitud **no** crea el beneficiario ni el expediente |
| `postulaciones` | `NUEVA` | Iguales a las anteriores (`src/app/admin/acciones.ts:35-54`) | Aprobar no dispara la asignación del padrinazgo, que es manual |
| `mensajes_contacto` | `NUEVA` | Iguales a las anteriores (`src/app/admin/acciones.ts:56-75`) | No hay envío de respuesta desde el sistema; solo un enlace `mailto:` (`src/app/admin/mensajes/page.tsx:66`) |
| `donaciones` | `PENDIENTE` | `PENDIENTE → COMPLETADA` y `PENDIENTE → FALLIDA` (`src/app/(publico)/acciones.ts:252-255`) | `→ REEMBOLSADA` y el reintento de una donación `FALLIDA` (la pantalla de pago redirige al comprobante si ya no está pendiente) |
| `padrinazgos` | `activo = true` | `inactivo → activo` (reactivación, `src/app/admin/asignaciones/acciones.ts:95-99`), `nuevo → activo` (`:101-108`), `activo → inactivo` (`:144-147`) | No hay edición del aporte o la modalidad de un padrinazgo vigente sin pasar por una reasignación |

---

## 7. Casos de uso reales

Los actores que existen en el código son cinco: **Visitante** (sin sesión),
**Padrino**, **Trabajo social**, **Terapeuta**, **Dirección** y **Administrador**.
Cuando un caso lo puede ejecutar cualquier rol que tenga cierto permiso, se indica
el permiso y no la lista de roles.

Se declaran primero dos casos de soporte porque son los que el resto **incluye**
(«include») literalmente, por llamada de función:

### CU-00A — Verificar permiso  *(caso incluido)*

- **Actor:** el sistema
- **Precondición:** existe una sesión JWT válida
- **Flujo principal:**
  1. `requirePermiso(permiso)` llama a `requireSesion()` (`src/lib/sesion.ts:43`).
  2. `requireSesion()` obtiene el usuario con `auth()` (`src/lib/sesion.ts:15-17`); si no hay sesión ejecuta `redirect("/login")` (`src/lib/sesion.ts:22`).
  3. Comprueba `usuario.permisos.includes(permiso)` (`src/lib/sesion.ts:44`).
  4. Devuelve el usuario de sesión.
- **Flujo alterno:** si el permiso no está en la lista, `redirect("/sin-acceso")` (`src/lib/sesion.ts:44`).
- **Resultado:** la ejecución continúa con el usuario autorizado, o el navegador se lleva a `/login` o `/sin-acceso`.
- **Archivos:** `src/lib/sesion.ts:40-46`, `src/auth.config.ts:39-56`, `src/proxy.ts:11-22`

### CU-00B — Registrar en la bitácora  *(caso incluido)*

- **Actor:** el sistema
- **Precondición:** se conoce el actor (correo o cadena `"sitio-publico"`)
- **Flujo principal:**
  1. `registrarAuditoria()` lee las cabeceras con `headers()` (`src/lib/sesion.ts:65`).
  2. Extrae la IP de `x-forwarded-for` (primer valor) o de `x-real-ip` (`src/lib/sesion.ts:66-69`).
  3. Inserta la fila en `bitacora` con actor, acción, entidad, `entidadId`, detalle e IP (`src/lib/sesion.ts:74-83`).
- **Flujo alterno:** si `headers()` lanza excepción, la IP queda en `null` y la inserción continúa (`src/lib/sesion.ts:70-72`).
- **Resultado:** una fila nueva en `bitacora`.
- **Archivos:** `src/lib/sesion.ts:56-84`

---

### CU-01 — Consultar la portada

- **Actor:** Visitante
- **Precondición:** ninguna
- **Flujo principal:**
  1. El visitante solicita `/`.
  2. `LandingPage` lanza siete consultas en paralelo con `Promise.all` (`src/app/(publico)/page.tsx:91-134`): beneficiarios activos, programas activos, padrinos activos, beneficiarios activos sin padrinazgo, programas con su conteo, hasta tres beneficiarios publicados sin padrino y hasta tres historias en `PUBLICADO`.
  3. Arma el arreglo de cifras (`src/app/(publico)/page.tsx:136-141`).
  4. Rinde hero, carrusel, sellos, programas, galería resumida, historias y el formulario de inscripción.
- **Flujos alternos:** si no hay beneficiarios publicados, la sección correspondiente queda vacía. `export const dynamic = "force-dynamic"` (`src/app/(publico)/page.tsx:23`) evita que las cifras queden congeladas en el *build*.
- **Resultado:** portada con datos en vivo.
- **Archivos:** `src/app/(publico)/page.tsx`, `src/app/(publico)/layout.tsx`, `src/components/publico.tsx`, `src/components/carrusel.tsx`, `src/components/foto-beneficiario.tsx`
- **Extend:** CU-04 (el formulario de inscripción embebido es opcional)

### CU-02 — Consultar la galería de beneficiarios que esperan padrino

- **Actor:** Visitante
- **Precondición:** ninguna
- **Flujo principal:**
  1. El visitante solicita `/apadrina`, opcionalmente con `?programa=<id>`.
  2. `GaleriaPage` lee `searchParams` (`src/app/(publico)/apadrina/page.tsx:22`).
  3. Consulta los programas activos y los beneficiarios con `estado = ACTIVO`, `publicadoEnGaleria = true` y `padrinazgos: { none: { activo: true } }` (`src/app/(publico)/apadrina/page.tsx:30-47`).
  4. La proyección `select` trae **solo** id, nombres, fecha de nacimiento, resumen público, foto y programa; ni apellidos, ni diagnóstico, ni datos familiares (`src/app/(publico)/apadrina/page.tsx:38-45`).
  5. Rinde una tarjeta por beneficiario con `primerNombre()` y `calcularEdad()`.
- **Flujos alternos:** si el filtro no devuelve nada, se muestra el componente `Vacio` (`src/app/(publico)/apadrina/page.tsx:107-110`).
- **Resultado:** listado público anonimizado.
- **Archivos:** `src/app/(publico)/apadrina/page.tsx`, `src/lib/utils.ts:8-10`, `src/lib/fechas.ts:44-55`
- **Extend:** CU-03

### CU-03 — Consultar el perfil público de un beneficiario

- **Actor:** Visitante
- **Precondición:** el beneficiario debe estar `ACTIVO` y `publicadoEnGaleria = true`
- **Flujo principal:**
  1. Solicita `/apadrina/[id]`.
  2. `generateMetadata` consulta el primer nombre para el título (`src/app/(publico)/apadrina/[id]/page.tsx:17-22`).
  3. `PerfilPublicoPage` hace `findFirst` con las tres condiciones y una proyección reducida más `padrinazgos` activos (`src/app/(publico)/apadrina/[id]/page.tsx:33-44`).
  4. Calcula `tienePadrino` (`:49`) y rinde el perfil con el aviso de protección de datos (`:92-102`).
- **Flujos alternos:** si no cumple las condiciones, `notFound()` (`:46`). Si ya tiene padrino, se ocultan los botones de acción y se informa (`:105-108`).
- **Resultado:** perfil público con botón hacia `/inscripcion/padrino` o hacia `/donar`.
- **Archivos:** `src/app/(publico)/apadrina/[id]/page.tsx`, `src/components/foto-beneficiario.tsx`

### CU-04 — Enviar una solicitud de inscripción de beneficiario

- **Actor:** Visitante (encargado del niño)
- **Precondición:** ninguna
- **Flujo principal:**
  1. Abre `/inscripcion/beneficiario`; la página carga los programas activos para el desplegable (`src/app/(publico)/inscripcion/beneficiario/page.tsx:17-21`).
  2. Llena `FormularioBeneficiario` (`src/components/formularios-publicos.tsx:30`) y lo envía; `useActionState` invoca la acción.
  3. `enviarInscripcionBeneficiario` valida con `esquemaInscripcionBeneficiario` (`src/app/(publico)/acciones.ts:23-25`, esquema en `src/lib/formularios.ts:23-42`).
  4. Convierte la fecha con `fechaDesdeInput()` para evitar el corrimiento de zona (`src/app/(publico)/acciones.ts:37`, `src/lib/fechas.ts:63-65`).
  5. Inserta en `solicitudes_inscripcion`; el estado queda en `NUEVA` por el predeterminado de la columna (`src/app/(publico)/acciones.ts:34-49`).
  6. **include CU-00B**: registra `CREAR` sobre `SupportRequest`, con actor igual al correo del encargado o `"sitio-publico"` si no lo dejó (`src/app/(publico)/acciones.ts:51-57`).
  7. Devuelve el mensaje de acuse.
- **Flujos alternos:** si la validación falla, devuelve `error` general y `errores` por campo construidos con `erroresDeZod()` (`src/lib/formularios.ts:11-18`) y no toca la base.
- **Resultado:** una fila nueva en `solicitudes_inscripcion` y una en `bitacora`.
- **Archivos:** `src/app/(publico)/inscripcion/beneficiario/page.tsx`, `src/components/formularios-publicos.tsx:30-182`, `src/app/(publico)/acciones.ts:19-62`, `src/lib/formularios.ts:23-42`, `src/lib/fechas.ts:63-65`
- **Include:** CU-00B

### CU-05 — Inscribirse como padrino

- **Actor:** Visitante
- **Precondición:** el correo no debe existir ni en `usuarios` ni en `padrinos`
- **Flujo principal:**
  1. Abre `/inscripcion/padrino`; la página lee el aporte sugerido de `configuracion` y cuenta los beneficiarios sin padrino (`src/app/(publico)/inscripcion/padrino/page.tsx:29-34`).
  2. Envía `FormularioPadrino` (`src/components/formularios-publicos.tsx:183`).
  3. `enviarInscripcionPadrino` valida con `esquemaInscripcionPadrino` (`src/lib/formularios.ts:44-67`): nombre, correo, teléfono, aporte mínimo de Q50, contraseña de 8 a 72 caracteres y confirmación coincidente.
  4. Normaliza el correo a minúsculas para que coincida con la búsqueda de `authorize()` (`src/app/(publico)/acciones.ts:83`).
  5. Comprueba en paralelo que no exista el usuario ni el padrino (`src/app/(publico)/acciones.ts:85-98`).
  6. Genera el hash con `bcrypt.hash(v.password, 10)` (`src/app/(publico)/acciones.ts:100`).
  7. **Transacción** `prisma.$transaction` (`src/app/(publico)/acciones.ts:102-136`): crea el `User` con `cargo: "Padrino"` y el rol `PADRINO` conectado por su clave; crea el `Padrino` ligado a ese `userId`; crea la `VolunteerApplication` con `tipo: "PADRINO"`.
  8. **include CU-00B** dos veces: `CREAR` sobre `User` y `CREAR` sobre `VolunteerApplication` (`src/app/(publico)/acciones.ts:138-152`).
- **Flujos alternos:** correo ya registrado → devuelve el error en el campo `email` sin tocar la base (`:90-98`). Contraseñas distintas → error de Zod en `passwordConfirmacion` (`src/lib/formularios.ts:64-67`). Si algo falla dentro de la transacción, las tres inserciones se revierten.
- **Resultado:** cuenta operativa del portal con rol `PADRINO`; el portal aparece vacío hasta que se ejecute CU-21.
- **Archivos:** `src/app/(publico)/inscripcion/padrino/page.tsx`, `src/components/formularios-publicos.tsx:183-296`, `src/app/(publico)/acciones.ts:69-157`, `src/lib/formularios.ts:44-67`, `src/lib/rbac.ts:127-133`
- **Include:** CU-00B

### CU-06 — Enviar un mensaje de contacto

- **Actor:** Visitante
- **Precondición:** ninguna
- **Flujo principal:**
  1. Abre `/contacto`; `leerContacto()` trae teléfono, correo y dirección de `configuracion` (`src/components/publico.tsx:14-25`).
  2. Envía `FormularioContacto` (`src/components/formularios-publicos.tsx:297`).
  3. `enviarContacto` valida con `esquemaContacto` (`src/lib/formularios.ts:69-75`): mensaje de al menos 10 caracteres.
  4. Inserta en `mensajes_contacto` con estado `NUEVA` (`src/app/(publico)/acciones.ts:172-180`).
  5. **include CU-00B**: `CREAR` sobre `ContactMessage` (`src/app/(publico)/acciones.ts:182-188`).
- **Flujos alternos:** errores de validación por campo, sin escritura.
- **Resultado:** mensaje en la bandeja de `/admin/mensajes`. **No se envía ningún correo**: no hay cliente SMTP en el proyecto.
- **Archivos:** `src/app/(publico)/contacto/page.tsx`, `src/components/formularios-publicos.tsx:297-361`, `src/app/(publico)/acciones.ts:159-191`
- **Include:** CU-00B

### CU-07 — Iniciar una donación

- **Actor:** Visitante (donante)
- **Precondición:** ninguna
- **Flujo principal:**
  1. Abre `/donar`; se cargan las campañas activas y el aporte sugerido (`src/app/(publico)/donar/page.tsx:18-24`).
  2. Envía `FormularioDonacion` (`src/components/formularios-publicos.tsx:362`).
  3. `iniciarDonacion` valida con `esquemaDonacion` (`src/lib/formularios.ts:77-90`): monto mínimo de Q25 y método dentro de `TARJETA`, `TRANSFERENCIA` o `DEPOSITO`.
  4. Llama `pasarela.crearIntencion()` (`src/app/(publico)/acciones.ts:207-212`), que genera la referencia con el prefijo `CER-SIM-` y seis caracteres de un alfabeto sin ambigüedades (`src/lib/pasarela.ts:32-39`).
  5. Inserta la donación con `estado: "PENDIENTE"`, moneda `GTQ` y la referencia como valor único (`src/app/(publico)/acciones.ts:214-227`).
  6. **include CU-00B**: `CREAR` sobre `Donacion` (`:229-235`).
  7. `redirect("/donar/pagar/<id>")` (`:237`).
- **Flujos alternos:** validación fallida → se devuelven los errores y no se crea nada. En ningún paso se piden ni se guardan datos de tarjeta (`src/lib/pasarela.ts:1-5`).
- **Resultado:** donación en `PENDIENTE` y navegación a la pantalla de pago.
- **Archivos:** `src/app/(publico)/donar/page.tsx`, `src/components/formularios-publicos.tsx:362-466`, `src/app/(publico)/acciones.ts:194-238`, `src/lib/pasarela.ts`
- **Include:** CU-00B, CU-08

### CU-08 — Confirmar el pago de la donación

- **Actor:** Visitante (donante)
- **Precondición:** existe la donación y su estado es `PENDIENTE`
- **Flujo principal:**
  1. `PagarPage` carga la donación con su campaña (`src/app/(publico)/donar/pagar/[id]/page.tsx:23-26`).
  2. Muestra el resumen: referencia, monto, método traducido por `etiquetaMetodo()` (`src/lib/pasarela.ts:78-80`), donante, destino y frecuencia.
  3. El donante pulsa «Simular pago aprobado» o «Simular pago rechazado»; cada botón es un `<form>` con `aprobar = si | no` (`src/app/(publico)/donar/pagar/[id]/page.tsx:72-87`).
  4. `confirmarDonacion` lee el id y el indicador (`src/app/(publico)/acciones.ts:241-242`), busca la donación (`:244`) y llama `pasarela.confirmar()` (`:247-250`).
  5. Actualiza el estado a `COMPLETADA` o `FALLIDA` (`:252-255`).
  6. **include CU-00B**: `PAGO_APROBADO` o `PAGO_RECHAZADO` sobre `Donacion` (`:257-263`).
  7. `redirect("/donar/gracias/<id>")` (`:265`).
- **Flujos alternos:** donación inexistente → `notFound()` en la página (`donar/pagar/[id]/page.tsx:28`) o `redirect("/donar")` en la acción (`src/app/(publico)/acciones.ts:245`). Donación que ya no está pendiente → la página redirige al comprobante (`donar/pagar/[id]/page.tsx:29`).
- **Resultado:** donación resuelta y comprobante disponible.
- **Archivos:** `src/app/(publico)/donar/pagar/[id]/page.tsx`, `src/app/(publico)/acciones.ts:240-266`, `src/lib/pasarela.ts:59-67`
- **Include:** CU-00B, CU-09

### CU-09 — Consultar el comprobante de la donación

- **Actor:** Visitante (donante)
- **Precondición:** la donación existe
- **Flujo principal:**
  1. `GraciasPage` carga la donación con su campaña (`src/app/(publico)/donar/gracias/[id]/page.tsx:22-25`).
  2. Calcula `aprobada = estado === "COMPLETADA"` (`:29`).
  3. Rinde el comprobante con referencia, estado, monto, método, donante, correo, destino y fecha y hora local (`:62-77`), más el aviso de que no tiene validez fiscal (`:79-81`).
- **Flujos alternos:** donación inexistente → `notFound()` (`:27`). Si el pago fue rechazado, se ofrece «Intentar de nuevo» hacia `/donar` (`:93`).
- **Resultado:** comprobante en pantalla. **No se genera PDF ni se envía por correo.**
- **Archivos:** `src/app/(publico)/donar/gracias/[id]/page.tsx`, `src/lib/fechas.ts:31-42`

### CU-10 — Iniciar sesión

- **Actor:** cualquier usuario con cuenta (personal o padrino)
- **Precondición:** la cuenta existe y tiene `activo = true`
- **Flujo principal:**
  1. Abre `/login`; si ya hay sesión, `redirect("/inicio")` (`src/app/login/page.tsx:31`).
  2. Se calcula el destino seguro a partir de `?redirigir=` (`src/app/login/page.tsx:35-38`).
  3. Envía `FormularioLogin` (`src/app/login/formulario.tsx:8`).
  4. `iniciarSesion` baja el correo a minúsculas y llama `signIn("credentials", { redirectTo })` (`src/app/login/acciones.ts:14-18`).
  5. `authorize()` valida el formato con Zod (`src/auth.ts:22-23`), busca el usuario con sus roles y permisos (`src/auth.ts:26-36`), comprueba `activo` (`:38`) y verifica la contraseña con `bcrypt.compare` (`:40`).
  6. Actualiza `ultimoAcceso` (`src/auth.ts:43-46`).
  7. Escribe en `bitacora` la acción `INICIO_SESION` (`src/auth.ts:48-56`).
  8. Aplana roles y permisos y adjunta `padrinoId` (`src/auth.ts:58-74`).
  9. Los callbacks `jwt` y `session` trasladan esos datos al token y a la sesión (`src/auth.config.ts:27-56`).
  10. NextAuth redirige al destino; si es `/inicio`, CU-11 reparte.
- **Flujos alternos:** credenciales inválidas, formato incorrecto o cuenta inactiva → `authorize()` devuelve `null`, `signIn` lanza `AuthError` y la acción devuelve un mensaje único, sin distinguir la causa (`src/app/login/acciones.ts:20-22`). Cualquier otro error se relanza para que Next propague el redirect (`:24`).
- **Resultado:** cookie de sesión JWT con roles y permisos, y una fila en `bitacora`.
- **Archivos:** `src/app/login/page.tsx`, `src/app/login/formulario.tsx`, `src/app/login/acciones.ts`, `src/auth.ts`, `src/auth.config.ts`, `src/app/api/auth/[...nextauth]/route.ts`

### CU-11 — Ser repartido al panel o al portal

- **Actor:** usuario autenticado
- **Precondición:** sesión iniciada
- **Flujo principal:**
  1. `InicioPage` llama `requireSesion()` (`src/app/inicio/page.tsx:9`).
  2. Si tiene `expediente.leer`, `usuarios.gestionar` o `donaciones.leer` → `redirect("/admin")` (`src/app/inicio/page.tsx:11-17`).
  3. Si tiene `portal.padrino` → `redirect("/portal")` (`:19-21`).
- **Flujos alternos:** sin ninguno de esos permisos → `redirect("/sin-acceso")` (`:23`).
- **Resultado:** el usuario llega a la zona que le corresponde sin elegirla.
- **Archivos:** `src/app/inicio/page.tsx`, `src/lib/sesion.ts:20-24`, `src/lib/rbac.ts`

### CU-12 — Cerrar sesión

- **Actor:** usuario autenticado
- **Precondición:** sesión iniciada
- **Flujo principal:**
  1. Pulsa el botón de `CerrarSesion` (`src/components/cerrar-sesion.tsx:5`), presente en el layout del panel (`src/app/admin/layout.tsx:65`), en el del portal (`src/app/portal/layout.tsx:36`) y en `/sin-acceso` (`src/app/sin-acceso/page.tsx:48`).
  2. `cerrarSesion()` ejecuta `signOut({ redirectTo: "/" })` (`src/app/login/acciones.ts:30-32`).
- **Flujos alternos:** ninguno implementado.
- **Resultado:** cookie invalidada y regreso al sitio público. **El cierre de sesión no se registra en la bitácora**, a diferencia del inicio.
- **Archivos:** `src/components/cerrar-sesion.tsx`, `src/app/login/acciones.ts:30-32`

### CU-13 — Consultar mis apadrinados

- **Actor:** Padrino (permiso `portal.padrino`)
- **Precondición:** sesión con `portal.padrino`; el usuario debe tener un `padrinoId` en la sesión
- **Flujo principal:**
  1. `LayoutPortal` ejecuta **CU-00A** con `portal.padrino` (`src/app/portal/layout.tsx:13`).
  2. `PortalPage` vuelve a ejecutar **CU-00A** (`src/app/portal/page.tsx:19`).
  3. Consulta los padrinazgos activos **partiendo de `usuario.padrinoId`, nunca de un id de la URL** (`src/app/portal/page.tsx:22-40`), incluyendo del beneficiario solo nombres, fecha de nacimiento, programa y el conteo de seguimientos con `visibleParaPadrino = true`.
  4. Suma el aporte mensual con `aNumero()` (`src/app/portal/page.tsx:42-45`, `src/lib/utils.ts:25-28`).
  5. Rinde una tarjeta por apadrinado.
- **Flujos alternos:** si `padrinoId` es nulo o no hay padrinazgos, se muestra el aviso de que todavía no hay asignación (`src/app/portal/page.tsx:73-76`).
- **Resultado:** listado propio del padrino con enlace a CU-14.
- **Archivos:** `src/app/portal/layout.tsx`, `src/app/portal/page.tsx`, `src/lib/utils.ts`, `src/lib/fechas.ts`
- **Include:** CU-00A

### CU-14 — Consultar el progreso de un apadrinado

- **Actor:** Padrino
- **Precondición:** existe un padrinazgo **activo** entre el padrino de la sesión y ese beneficiario
- **Flujo principal:**
  1. **CU-00A** con `portal.padrino` (`src/app/portal/[id]/page.tsx:20`).
  2. `findFirst` sobre `padrinazgos` filtrando por `beneficiarioId` de la URL **y** `padrinoId` de la sesión **y** `activo: true` (`src/app/portal/[id]/page.tsx:24-29`).
  3. La inclusión del beneficiario trae solo nombres, fechas, programa y los seguimientos con `visibleParaPadrino: true`, ordenados por fecha descendente (`:38-48`).
  4. **include CU-00B**: registra `VER_PORTAL` sobre `Padrinazgo` (`:60-66`).
  5. Rinde la ficha y la lista de avances, más la nota de confidencialidad (`:163-172`).
- **Flujos alternos:** si el id de la URL no corresponde a un padrinazgo activo suyo, la consulta devuelve `null` y se ejecuta `notFound()` (`:55`). Sin avances visibles, se muestra el componente `Vacio` (`:132-135`).
- **Resultado:** el padrino ve nombre, edad, programa, aporte, fechas y los avances publicados; nunca diagnóstico ni ficha socioeconómica.
- **Archivos:** `src/app/portal/[id]/page.tsx`, `src/lib/sesion.ts:56-84`
- **Include:** CU-00A, CU-00B

### CU-15 — Consultar el panel del centro

- **Actor:** cualquier rol con acceso al panel (`ADMIN`, `DIRECCION`, `TRABAJO_SOCIAL`, `TERAPEUTA`)
- **Precondición:** sesión con al menos uno de `expediente.leer`, `donaciones.leer`, `usuarios.gestionar`, `auditoria.leer`
- **Flujo principal:**
  1. `LayoutAdmin` ejecuta `requireSesion()` (`src/app/admin/layout.tsx:15`) y comprueba la lista de permisos de panel (`:18-26`).
  2. `BarraLateral` filtra las 17 secciones dejando solo aquellas cuyo permiso posee el usuario (`src/components/admin/barra-lateral.tsx:59`).
  3. `PanelPage` lanza cinco consultas en paralelo: activos, con padrino, expedientes incompletos, solicitudes `NUEVA` y los cinco últimos avances (`src/app/admin/page.tsx:28-52`).
  4. Solo si `tienePermiso(usuario, DONACIONES_LEER)` ejecuta la agregación del recaudado (`src/app/admin/page.tsx:55-60`).
  5. Solo si `tienePermiso(usuario, AUDITORIA_LEER)` consulta las seis últimas entradas de bitácora (`:62-64`).
- **Flujos alternos:** un padrino que escriba `/admin` es enviado a `/sin-acceso` (`src/app/admin/layout.tsx:24-26`). Las consultas cuyo permiso falta **no se ejecutan**, de modo que el dato nunca llega al HTML.
- **Resultado:** tablero adaptado al rol.
- **Archivos:** `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`, `src/components/admin/barra-lateral.tsx`, `src/components/admin/navegacion.ts`
- **Include:** CU-00A

### CU-16 — Buscar y filtrar beneficiarios

- **Actor:** rol con `expediente.leer`
- **Precondición:** sesión válida
- **Flujo principal:**
  1. **CU-00A** con `expediente.leer` (`src/app/admin/beneficiarios/page.tsx:44`).
  2. Lee `q`, `programa` y `estado` de `searchParams` (`:45`).
  3. Construye el filtro: `OR` de `contains` insensible a mayúsculas sobre `nombres`, `apellidos` y `codigoExpediente`, más igualdad de `programaId` y de `estado` (`:49-68`).
  4. Ejecuta seis consultas en paralelo: cuatro conteos, los programas y el listado con su programa y padrinazgo activo (`:70-91`).
  5. Rinde los indicadores, el formulario `method="get"` (funciona sin JavaScript, `:121`) y la tabla.
- **Flujos alternos:** sin coincidencias, `FilaVacia` con el mensaje correspondiente (`:201-204`).
- **Resultado:** listado filtrado con enlace a CU-17.
- **Archivos:** `src/app/admin/beneficiarios/page.tsx`, `src/components/admin/estructura.tsx`, `src/components/ui.tsx`
- **Include:** CU-00A
- **Extend:** CU-17

### CU-17 — Consultar un expediente de beneficiario

- **Actor:** rol con `expediente.leer`
- **Precondición:** el beneficiario existe
- **Flujo principal:**
  1. **CU-00A** con `expediente.leer` (`src/app/admin/beneficiarios/[id]/page.tsx:73`).
  2. Calcula siete banderas de permiso con `tienePermiso()` (`:75-87`).
  3. Consulta el beneficiario con programa, padrinazgo activo, próxima cita y los conteos de documentos, seguimientos y evaluaciones (`:89-105`).
  4. **Cada bloque sensible se consulta solo si su bandera es verdadera** (`:110-142`): expediente clínico y evaluaciones con `expediente.clinico.leer`; ficha socioeconómica con `expediente.socioeconomico.leer`; documentos con `documentos.leer`; avances con `seguimiento.leer`; las últimas 15 entradas de bitácora de ese id con `auditoria.leer`.
  5. Calcula la completitud sobre siete criterios: CUI, dirección, expediente clínico, ficha socioeconómica, al menos tres documentos, al menos una evaluación y al menos un avance (`:149-158`).
  6. **include CU-00B**: registra `VER_EXPEDIENTE` sobre `Beneficiario` (`:164-170`).
  7. Rinde la cabecera con chips de estado y las seis secciones (`:58-65`).
- **Flujos alternos:** beneficiario inexistente → `notFound()` (`:107`). Sección sin permiso → se rinde `AccesoRestringido` explicando qué permiso falta: `:311` para lo clínico, `:395` para lo socioeconómico, `:465` para documentos, `:525` para seguimiento y `:569` para auditoría.
- **Resultado:** expediente segmentado por permiso; cada apertura deja huella en la bitácora.
- **Archivos:** `src/app/admin/beneficiarios/[id]/page.tsx`, `src/components/ui.tsx:306`, `src/components/admin/estructura.tsx`, `src/lib/sesion.ts`
- **Include:** CU-00A, CU-00B
- **Extend:** CU-18, CU-19

### CU-18 — Editar los datos generales del expediente

- **Actor:** rol con `expediente.escribir` (`ADMIN`, `TRABAJO_SOCIAL`)
- **Precondición:** el beneficiario existe
- **Flujo principal:**
  1. **CU-00A** con `expediente.escribir` en la página (`src/app/admin/beneficiarios/[id]/editar/page.tsx:24`).
  2. Carga el beneficiario y la lista de programas (`:26-32`) y precarga el formulario convirtiendo las fechas con `fechaParaInput()` (`:59`, `src/lib/fechas.ts:57-61`).
  3. El usuario modifica y envía `FormularioEditar`.
  4. **CU-00A otra vez, ahora en la acción** (`src/app/admin/beneficiarios/acciones.ts:43`): la guarda no depende de que la pantalla se haya rendido.
  5. Valida con `esquemaDatosGenerales`, que cubre 21 campos incluidos los tres enums (`src/app/admin/beneficiarios/acciones.ts:12-37`).
  6. Actualiza `beneficiarios` normalizando a `null` los opcionales vacíos y convirtiendo las casillas `"on"` a booleano (`:54-79`).
  7. **include CU-00B**: `ACTUALIZAR` sobre `Beneficiario` citando el código de expediente (`:81-87`).
  8. `revalidatePath` del expediente y del listado (`:89-90`).
- **Flujos alternos:** validación fallida → errores por campo sin escritura (`:46-51`). Beneficiario inexistente → `notFound()` en la página (`editar/page.tsx:34`).
- **Resultado:** expediente actualizado, incluidos `estado`, `estadoExpediente` y `publicadoEnGaleria`, con rastro en la bitácora.
- **Archivos:** `src/app/admin/beneficiarios/[id]/editar/page.tsx`, `src/app/admin/beneficiarios/[id]/editar/formulario.tsx`, `src/app/admin/beneficiarios/acciones.ts:12-92`
- **Include:** CU-00A, CU-00B

### CU-19 — Registrar un avance de seguimiento

- **Actor:** rol con `seguimiento.escribir` (`ADMIN`, `TRABAJO_SOCIAL`, `TERAPEUTA`)
- **Precondición:** el beneficiario existe
- **Flujo principal:**
  1. **CU-00A** con `seguimiento.escribir` en la página (`src/app/admin/beneficiarios/[id]/avance/page.tsx:24`).
  2. Carga nombres, código y padrinazgo activo para el encabezado (`:26-38`) e informa si hay padrino asignado (`:56-58`).
  3. El usuario llena fecha, área, título, descripción y decide la casilla «visible para el padrino».
  4. **CU-00A en la acción** (`src/app/admin/beneficiarios/acciones.ts:107`).
  5. Valida con `esquemaAvance`: título de al menos 5 caracteres y descripción de al menos 10 (`:94-101`).
  6. Inserta en `seguimientos` con `visibleParaPadrino` y `registradoPor = usuario.nombre` (`:120-130`).
  7. **include CU-00B**: `CREAR` sobre `Seguimiento`, indicando en el detalle si el avance es visible o de uso interno (`:132-138`).
  8. `revalidatePath` y `redirect` al ancla `#avances` del expediente (`:140-141`).
- **Flujos alternos:** validación fallida → errores por campo. Beneficiario inexistente → `notFound()` (`avance/page.tsx:40`).
- **Resultado:** avance registrado; si se marcó visible, el padrino lo verá en CU-14.
- **Archivos:** `src/app/admin/beneficiarios/[id]/avance/page.tsx`, `src/app/admin/beneficiarios/[id]/avance/formulario.tsx`, `src/app/admin/beneficiarios/acciones.ts:94-142`
- **Include:** CU-00A, CU-00B

### CU-20 — Consultar los documentos del centro

- **Actor:** rol con `documentos.leer`
- **Precondición:** sesión válida
- **Flujo principal:**
  1. **CU-00A** con `documentos.leer` (`src/app/admin/documentos/page.tsx:33`) y bandera `puedeSubir` con `documentos.subir` (`:34`).
  2. Consulta todos los documentos con su beneficiario y dos conteos de vigencia (`:36-47`).
  3. Rinde los indicadores y la tabla.
- **Flujos alternos:** a quien tiene `documentos.subir` se le muestra el aviso de que la carga a un almacenamiento externo no está conectada (`:66`).
- **Resultado:** inventario documental de solo lectura.
- **Archivos:** `src/app/admin/documentos/page.tsx`
- **Include:** CU-00A

### CU-21 — Consultar los programas del centro

- **Actor:** rol con `expediente.leer`
- **Precondición:** sesión válida
- **Flujo principal:**
  1. **CU-00A** con `expediente.leer` (`src/app/admin/programas/page.tsx:22`).
  2. Consulta los programas con el conteo de beneficiarios (`:24-27`).
  3. Rinde la tabla con el icono resuelto por `IconoPrograma` (`src/components/icono-programa.tsx:24`).
- **Flujos alternos:** sin programas, `FilaVacia` (`:41`).
- **Resultado:** listado de áreas de atención. Solo lectura.
- **Archivos:** `src/app/admin/programas/page.tsx`, `src/components/icono-programa.tsx`
- **Include:** CU-00A

### CU-22 — Asignar un padrinazgo

- **Actor:** rol con `padrinazgos.gestionar` (`ADMIN`, `TRABAJO_SOCIAL`)
- **Precondición:** existe un padrino con `activo = true` y un beneficiario con `estado = ACTIVO` y sin padrinazgo activo
- **Flujo principal:**
  1. **CU-00A** con `padrinazgos.gestionar` en la página (`src/app/admin/asignaciones/page.tsx:34`).
  2. Se cargan en paralelo los padrinazgos activos, los beneficiarios asignables, los padrinos activos con su conteo y el aporte sugerido (`:36-77`).
  3. El desplegable de padrinos marca con «(sin acceso al portal)» a quien no tiene `userId` (`:110`).
  4. El usuario elige padrino, beneficiario, aporte, modalidad y fecha de inicio, y envía.
  5. **CU-00A en la acción** (`src/app/admin/asignaciones/acciones.ts:31`).
  6. Valida con `esquemaAsignacion`: aporte mínimo de Q50 y modalidad dentro del enum (`:12-25`).
  7. Recarga padrino y beneficiario desde la base (`:43-57`) y aplica tres reglas: padrino activo (`:59-61`), beneficiario `ACTIVO` (`:62-64`) y beneficiario sin padrinazgo activo (`:67-73`). El comentario de `:65-66` explica que la comprobación se repite aquí porque entre la carga de la página y el envío otra persona pudo asignarlo.
  8. Busca un padrinazgo previo con la llave única compuesta (`:77-85`).
  9. Si existe, lo **reactiva** con `update` poniendo `activo = true` y `fechaFin = null`; si no, lo **crea** (`:95-108`).
  10. **include CU-00B**: `ACTUALIZAR` o `CREAR` según el caso, sobre `Padrinazgo`, usando el `beneficiarioId` como `entidadId` (`:110-116`).
  11. `revalidatePath` de asignaciones, donantes y el expediente (`:118-120`).
- **Flujos alternos:** cada una de las tres reglas devuelve un error dirigido al campo correspondiente sin escribir nada. Validación fallida → errores por campo (`:34-39`).
- **Resultado:** el beneficiario sale de la galería pública y aparece en el portal de su padrino.
- **Archivos:** `src/app/admin/asignaciones/page.tsx`, `src/app/admin/asignaciones/formulario.tsx`, `src/app/admin/asignaciones/acciones.ts:12-125`
- **Include:** CU-00A, CU-00B

### CU-23 — Finalizar un padrinazgo

- **Actor:** rol con `padrinazgos.gestionar`
- **Precondición:** existe un padrinazgo activo
- **Flujo principal:**
  1. El usuario pulsa «Finalizar» en la fila de la tabla; el formulario envía el id (`src/app/admin/asignaciones/page.tsx:164-174`).
  2. **CU-00A** con `padrinazgos.gestionar` (`src/app/admin/asignaciones/acciones.ts:128`).
  3. Carga el padrinazgo con los nombres del padrino y del beneficiario (`:133-141`).
  4. Actualiza `activo = false` y `fechaFin = new Date()` (`:144-147`).
  5. **include CU-00B**: `ACTUALIZAR` sobre `Padrinazgo` (`:149-155`).
  6. `revalidatePath` de las tres rutas afectadas (`:157-159`).
- **Flujos alternos:** id vacío o padrinazgo inexistente → la acción retorna sin hacer nada y sin mensaje (`:131`, `:142`).
- **Resultado:** el beneficiario vuelve a la galería pública y desaparece del portal del padrino; la fila del padrinazgo se conserva como histórico.
- **Archivos:** `src/app/admin/asignaciones/acciones.ts:127-160`, `src/app/admin/asignaciones/page.tsx`
- **Include:** CU-00A, CU-00B

### CU-24 — Consultar las donaciones

- **Actor:** rol con `donaciones.leer` (`ADMIN`, `DIRECCION`)
- **Precondición:** sesión válida
- **Flujo principal:**
  1. **CU-00A** con `donaciones.leer` (`src/app/admin/donaciones/page.tsx:39`).
  2. Valida el parámetro `estado` contra la lista blanca `ESTADOS` (`:32`, `:42-44`).
  3. Consulta el listado filtrado, el total y el número de completadas, las pendientes y las recurrentes (`:46-59`).
- **Flujos alternos:** un `estado` no reconocido se ignora y se muestran todas.
- **Resultado:** listado de transacciones con sus indicadores.
- **Archivos:** `src/app/admin/donaciones/page.tsx`, `src/lib/pasarela.ts:78-80`
- **Include:** CU-00A

### CU-25 — Consultar los donantes y padrinos

- **Actor:** rol con `donaciones.leer`
- **Precondición:** sesión válida
- **Flujo principal:**
  1. **CU-00A** con `donaciones.leer` (`src/app/admin/donantes/page.tsx:31`).
  2. Consulta los padrinos con sus padrinazgos activos y el beneficiario de cada uno (`:33-43`).
  3. Suma el aporte mensual por padrino y rinde la tabla, indicando quién tiene acceso al portal.
- **Flujos alternos:** sin padrinos, `FilaVacia` (`:57`).
- **Resultado:** panorama de la base de padrinos.
- **Archivos:** `src/app/admin/donantes/page.tsx`
- **Include:** CU-00A

### CU-26 — Consultar las campañas

- **Actor:** rol con `donaciones.leer`
- **Precondición:** sesión válida
- **Flujo principal:**
  1. **CU-00A** con `donaciones.leer` (`src/app/admin/campanas/page.tsx:15`).
  2. Consulta las campañas con el conteo de donaciones (`:17-20`).
  3. Calcula meta y recaudado con `aNumero()` y rinde la barra de avance (`:36-37`).
- **Flujos alternos:** sin campañas, componente `Vacio` (`:31`).
- **Resultado:** estado de las recaudaciones. Solo lectura.
- **Archivos:** `src/app/admin/campanas/page.tsx`, `src/lib/utils.ts:25-28`
- **Include:** CU-00A

### CU-27 — Cambiar el estado de una solicitud de inscripción

- **Actor:** rol con `expediente.leer`
- **Precondición:** la solicitud existe
- **Flujo principal:**
  1. **CU-00A** con `expediente.leer` en la página (`src/app/admin/solicitudes/page.tsx:33`).
  2. Se cargan las solicitudes y dos conteos (`:35-39`).
  3. Cada fila lleva su propio `<form>` con un `select` y un botón, sin JavaScript (`src/components/admin/selector-estado.tsx:24-45`).
  4. **CU-00A en la acción** (`src/app/admin/acciones.ts:15`).
  5. Valida id y estado con `esquemaEstado` (`src/app/admin/acciones.ts:9-12`).
  6. Actualiza `solicitudes_inscripcion.estado` (`:19-22`).
  7. **include CU-00B**: `ACTUALIZAR` sobre `SupportRequest` (`:24-30`).
  8. `revalidatePath("/admin/solicitudes")` (`:32`).
- **Flujos alternos:** validación fallida → la acción retorna en silencio sin mensaje al usuario (`:17`).
- **Resultado:** solicitud reclasificada. **Aprobarla no crea el beneficiario**: ese paso no está implementado.
- **Archivos:** `src/app/admin/solicitudes/page.tsx`, `src/components/admin/selector-estado.tsx`, `src/app/admin/acciones.ts:9-33`
- **Include:** CU-00A, CU-00B

### CU-28 — Cambiar el estado de una postulación

- **Actor:** rol con `expediente.leer`
- **Precondición:** la postulación existe
- **Flujo principal:** idéntico a CU-27 sobre `/admin/voluntarios` (`src/app/admin/voluntarios/page.tsx:33`, `:88-93`) y `cambiarEstadoPostulacion` (`src/app/admin/acciones.ts:35-54`), que actualiza `postulaciones.estado` (`:40-43`), audita `ACTUALIZAR` sobre `VolunteerApplication` (`:45-51`) y revalida `/admin/voluntarios` (`:53`).
- **Flujos alternos:** validación fallida → retorno silencioso (`:38`).
- **Resultado:** postulación reclasificada. La cuenta del portal ya existía desde CU-05, de modo que aprobar o rechazar **no altera el acceso**.
- **Archivos:** `src/app/admin/voluntarios/page.tsx`, `src/app/admin/acciones.ts:35-54`
- **Include:** CU-00A, CU-00B

### CU-29 — Cambiar el estado de un mensaje de contacto

- **Actor:** rol con `expediente.leer`
- **Precondición:** el mensaje existe
- **Flujo principal:** idéntico a CU-27 sobre `/admin/mensajes` (`src/app/admin/mensajes/page.tsx:16`, `:59-64`) y `cambiarEstadoMensaje` (`src/app/admin/acciones.ts:56-75`), que actualiza `mensajes_contacto.estado` (`:61-64`), audita (`:66-72`) y revalida (`:74`).
- **Flujos alternos:** validación fallida → retorno silencioso (`:59`).
- **Resultado:** mensaje marcado. La respuesta se hace fuera del sistema mediante el enlace `mailto:` (`src/app/admin/mensajes/page.tsx:66`).
- **Archivos:** `src/app/admin/mensajes/page.tsx`, `src/app/admin/acciones.ts:56-75`
- **Include:** CU-00A, CU-00B

### CU-30 — Consultar el contenido institucional

- **Actor:** rol con `expediente.leer`
- **Precondición:** sesión válida
- **Flujo principal:**
  1. **CU-00A** con `expediente.leer` en cada pantalla: historias (`src/app/admin/historias/page.tsx:14`), blog (`src/app/admin/blog/page.tsx:22`), eventos (`src/app/admin/eventos/page.tsx:22`).
  2. Cada una hace una única consulta ordenada por fecha (`historias/page.tsx:16-18`, `blog/page.tsx:24-26`, `eventos/page.tsx:24`).
  3. Se rinde el listado con el distintivo de `BORRADOR` o `PUBLICADO`.
- **Flujos alternos:** listas vacías con `Vacio` o `FilaVacia`.
- **Resultado:** consulta de solo lectura. La propia pantalla de eventos declara que el alta y la edición no están implementadas (`src/app/admin/eventos/page.tsx:30`).
- **Archivos:** `src/app/admin/historias/page.tsx`, `src/app/admin/blog/page.tsx`, `src/app/admin/eventos/page.tsx`
- **Include:** CU-00A

### CU-31 — Consultar los usuarios y la matriz de permisos

- **Actor:** rol con `usuarios.gestionar` (`ADMIN`)
- **Precondición:** sesión válida
- **Flujo principal:**
  1. **CU-00A** con `usuarios.gestionar` (`src/app/admin/usuarios/page.tsx:23`).
  2. Consulta en paralelo los usuarios con sus roles, los roles con sus `permissionId` y todos los permisos ordenados por módulo y clave (`:25-36`).
  3. Construye un `Set` con las parejas `rolId:permisoId` concedidas (`:38-40`).
  4. Rinde la tabla de cuentas y la matriz rol × permiso marcando cada celda concedida.
- **Flujos alternos:** sin usuarios, `FilaVacia` (`:51`).
- **Resultado:** vista de solo lectura. **No hay alta, edición ni desactivación de cuentas desde la interfaz.**
- **Archivos:** `src/app/admin/usuarios/page.tsx`
- **Include:** CU-00A

### CU-32 — Consultar la configuración del sistema

- **Actor:** rol con `usuarios.gestionar`
- **Precondición:** sesión válida
- **Flujo principal:**
  1. **CU-00A** con `usuarios.gestionar` (`src/app/admin/configuracion/page.tsx:22`).
  2. Consulta `configuracion` ordenada por grupo y clave (`:24-26`) y deduce los grupos presentes (`:28`).
  3. Muestra el estado de la pasarela leyendo `pasarela.modoPrueba` y `pasarela.nombre` (`:41-48`).
  4. Rinde una tabla por grupo, con los títulos legibles de `TITULOS_GRUPO` (`:15-19`).
- **Flujos alternos:** un grupo sin título legible se muestra con su clave cruda (`:55`).
- **Resultado:** consulta de los siete parámetros del sistema. **No se pueden editar desde la interfaz.**
- **Archivos:** `src/app/admin/configuracion/page.tsx`, `src/lib/pasarela.ts`
- **Include:** CU-00A

### CU-33 — Consultar la bitácora de auditoría

- **Actor:** rol con `auditoria.leer` (`ADMIN`, `DIRECCION`)
- **Precondición:** sesión válida
- **Flujo principal:**
  1. **CU-00A** con `auditoria.leer` (`src/app/admin/auditoria/page.tsx:27`).
  2. Lee `accion`, `entidad` y `pagina` de `searchParams` y normaliza la página a un mínimo de 1 (`:28-34`).
  3. Consulta en paralelo la página de 25 entradas, el total con el mismo filtro y las listas `distinct` de acciones y de entidades para los desplegables (`:36-54`).
  4. Calcula el total de páginas y conserva los filtros en los enlaces de paginación (`:56-60`).
  5. Rinde el formulario `GET`, la tabla y la navegación anterior/siguiente.
- **Flujos alternos:** sin coincidencias, `FilaVacia` (`:131-134`). En la primera y en la última página se omite el enlace correspondiente (`:155`, `:163`).
- **Resultado:** trazabilidad completa de accesos y cambios.
- **Archivos:** `src/app/admin/auditoria/page.tsx`, `src/lib/sesion.ts:56-84`
- **Include:** CU-00A

### 7.1 Resumen de relaciones «include» y «extend»

| Relación | Casos |
|---|---|
| **include CU-00A (Verificar permiso)** | CU-13, CU-14, CU-15, CU-16, CU-17, CU-18, CU-19, CU-20, CU-21, CU-22, CU-23, CU-24, CU-25, CU-26, CU-27, CU-28, CU-29, CU-30, CU-31, CU-32, CU-33 |
| **include CU-00B (Registrar en la bitácora)** | CU-04, CU-05, CU-06, CU-07, CU-08, CU-10 (por escritura directa en `src/auth.ts:48-56`), CU-14, CU-17, CU-18, CU-19, CU-22, CU-23, CU-27, CU-28, CU-29 |
| **include entre casos de negocio** | CU-07 incluye CU-08; CU-08 incluye CU-09 (ambos por `redirect` obligatorio) |
| **extend (opcionales)** | CU-01 ← CU-04 (formulario embebido en la portada); CU-02 ← CU-03; CU-03 ← CU-05 (botón «Quiero apadrinar»); CU-16 ← CU-17; CU-17 ← CU-18 y CU-19; CU-22 ← CU-23 |
| **Casos que NO registran auditoría** | CU-01, CU-02, CU-03, CU-09, CU-11, CU-12 (cierre de sesión), CU-13, CU-15, CU-16, CU-20, CU-21, CU-24, CU-25, CU-26, CU-30, CU-31, CU-32, CU-33 |

**Total: 33 casos de uso de negocio más 2 casos de soporte incluidos.**

---

## 8. Flujos internos para diagramas de secuencia

Aclaración de nomenclatura: el proyecto **no tiene controladores**. La cadena real
en Next 16 es *actor → componente cliente → acción de servidor o componente de
servidor → cliente Prisma → tabla → respuesta*. Se conserva el orden pedido y se
indica en cada paso qué pieza cumple el papel del controlador.

### 8.1 Inicio de sesión y carga de permisos

| # | Participante | Llamada real | Archivo:línea |
|---|---|---|---|
| 1 | Actor | Envía correo y contraseña | — |
| 2 | Vista (cliente) | `FormularioLogin` → `useActionState` dispara la acción | `src/app/login/formulario.tsx:18`, `:21` |
| 3 | Ruta | `POST /login` | `src/app/login/page.tsx:74` |
| 4 | Acción («controlador») | `iniciarSesion()` normaliza el correo a minúsculas | `src/app/login/acciones.ts:15` |
| 5 | Acción | `signIn("credentials", { email, password, redirectTo })` | `src/app/login/acciones.ts:14-18` |
| 6 | NextAuth | Invoca `authorize(credenciales)` | `src/auth.ts:21` |
| 7 | **Validación** | `esquemaCredenciales.safeParse()`; si falla devuelve `null` | `src/auth.ts:22-23` |
| 8 | Consulta | `prisma.user.findUnique({ where: { email }, include: { padrino, roles → role → permisos → permission } })` | `src/auth.ts:26-36` |
| 9 | Tablas | `usuarios` ⨝ `usuarios_roles` ⨝ `roles` ⨝ `roles_permisos` ⨝ `permisos`, más `padrinos` | — |
| 10 | **Regla** | Rechaza si el usuario no existe o si `activo = false` | `src/auth.ts:38` |
| 11 | **Regla** | `bcrypt.compare(password, passwordHash)`; si no coincide devuelve `null` | `src/auth.ts:40-41` |
| 12 | Escritura | `prisma.user.update({ ultimoAcceso: new Date() })` → tabla `usuarios` | `src/auth.ts:43-46` |
| 13 | Escritura | `prisma.auditLog.create({ accion: "INICIO_SESION" })` → tabla `bitacora` | `src/auth.ts:48-56` |
| 14 | Transformación | Aplana `roles` y deduplica `permisos` con `Set`; adjunta `padrinoId` | `src/auth.ts:58-74` |
| 15 | NextAuth | Callback `jwt` copia id, nombre, roles, permisos y `padrinoId` al token | `src/auth.config.ts:27-38` |
| 16 | NextAuth | Callback `session` vuelca el token en `session.user` | `src/auth.config.ts:39-56` |
| 17 | Respuesta | Cookie de sesión y redirección a `redirectTo` (`/inicio` por omisión) | `src/app/login/acciones.ts:11` |
| 18 | Reparto | `InicioPage` redirige a `/admin` o a `/portal` según los permisos | `src/app/inicio/page.tsx:11-23` |

- **Transacción:** ninguna; los pasos 12 y 13 son escrituras independientes.
- **Correo o archivo:** ninguno.
- **Camino de error:** `AuthError` capturado en `src/app/login/acciones.ts:20-22` devuelve un mensaje único que no distingue entre contraseña incorrecta y cuenta inactiva.

### 8.2 Consulta de un expediente con filtrado por permiso

| # | Participante | Llamada real | Archivo:línea |
|---|---|---|---|
| 1 | Actor | Pulsa «Ver expediente» en el listado | `src/app/admin/beneficiarios/page.tsx:232-238` |
| 2 | Proxy | `auth()` comprueba que exista sesión para `/admin/:path*` | `src/proxy.ts:11-22`, `:25` |
| 3 | Layout | `requireSesion()` y comprobación de los cuatro permisos de panel | `src/app/admin/layout.tsx:15`, `:18-26` |
| 4 | Ruta | `GET /admin/beneficiarios/[id]` → `ExpedientePage` | `src/app/admin/beneficiarios/[id]/page.tsx:67` |
| 5 | **Autorización** | `requirePermiso(EXPEDIENTE_LEER)` → `redirect("/sin-acceso")` si falta | `src/app/admin/beneficiarios/[id]/page.tsx:73`, `src/lib/sesion.ts:44` |
| 6 | Cálculo de banderas | Siete llamadas a `tienePermiso()` | `src/app/admin/beneficiarios/[id]/page.tsx:75-87` |
| 7 | Consulta base | `prisma.beneficiario.findUnique` con `programa`, `padrinazgos` activos, próxima `cita` y `_count` de documentos, seguimientos y evaluaciones | `:89-105` → tablas `beneficiarios`, `programas`, `padrinazgos`, `padrinos`, `citas` |
| 8 | **Regla** | `if (!beneficiario) notFound()` | `:107` |
| 9 | Consulta condicionada | `expedienteClinico.findUnique` **solo si** `puedeClinico` | `:110-112` → `expedientes_clinicos` |
| 10 | Consulta condicionada | `evaluacionClinica.findMany` solo si `puedeClinico` | `:113-118` → `evaluaciones_clinicas` |
| 11 | Consulta condicionada | `fichaSocioeconomica.findUnique` solo si `puedeSocio` | `:119-123` → `fichas_socioeconomicas` |
| 12 | Consulta condicionada | `documento.findMany` solo si `puedeDocumentos` | `:124-129` → `documentos` |
| 13 | Consulta condicionada | `seguimiento.findMany` solo si `puedeSeguimiento` | `:130-135` → `seguimientos` |
| 14 | Consulta condicionada | `auditLog.findMany` de las últimas 15 solo si `puedeAuditoria` | `:136-142` → `bitacora` |
| 15 | Cálculo | Completitud sobre siete criterios | `:149-158` |
| 16 | Escritura | `registrarAuditoria({ accion: "VER_EXPEDIENTE" })` → `bitacora`, con la IP tomada de las cabeceras | `:164-170`, `src/lib/sesion.ts:63-83` |
| 17 | Respuesta | HTML con las secciones permitidas; las bloqueadas rinden `AccesoRestringido` | `src/components/ui.tsx:306` |

- **Transacción:** ninguna. Los pasos 9-14 son secuenciales; solo el par de conteos de `:144-147` va en `Promise.all`.
- **Punto clave de seguridad:** el dato prohibido **nunca se consulta**, así que no llega al HTML ni siquiera oculto por CSS.
- **Correo o archivo:** ninguno.

### 8.3 Registro de un avance y su propagación al portal del padrino

| # | Participante | Llamada real | Archivo:línea |
|---|---|---|---|
| 1 | Actor (terapeuta o trabajo social) | Abre `/admin/beneficiarios/[id]/avance` | — |
| 2 | **Autorización** | `requirePermiso(SEGUIMIENTO_ESCRIBIR)` en la página | `src/app/admin/beneficiarios/[id]/avance/page.tsx:24` |
| 3 | Consulta | `prisma.beneficiario.findUnique` con nombres, código y padrinazgo activo | `:26-38` → `beneficiarios`, `padrinazgos`, `padrinos` |
| 4 | Vista | `FormularioAvance` con la fecha de hoy precargada por `fechaParaInput(new Date())` | `:62-66`, `src/lib/fechas.ts:57-61` |
| 5 | Actor | Llena fecha, área, título, descripción y la casilla «visible para el padrino» | — |
| 6 | Acción | `POST` → `registrarAvance(estado, FormData)` | `src/app/admin/beneficiarios/acciones.ts:103` |
| 7 | **Autorización** | `requirePermiso(SEGUIMIENTO_ESCRIBIR)` **de nuevo**, ahora en el servidor de la acción | `:107` |
| 8 | **Validación** | `esquemaAvance.safeParse()`: título ≥ 5, descripción ≥ 10, fecha `AAAA-MM-DD` | `:109-115`, esquema en `:94-101` |
| 9 | Transformación | `visible = v.visibleParaPadrino === "on"`; `fechaDesdeInput()` fija medianoche UTC | `:118`, `:123`, `src/lib/fechas.ts:63-65` |
| 10 | Escritura | `prisma.seguimiento.create` con `registradoPor = usuario.nombre` | `:120-130` → tabla `seguimientos` |
| 11 | Escritura | `registrarAuditoria({ accion: "CREAR", entidad: "Seguimiento" })` con detalle que distingue visible de interno | `:132-138` → `bitacora` |
| 12 | Caché | `revalidatePath("/admin/beneficiarios/<id>")` | `:140` |
| 13 | Respuesta | `redirect("/admin/beneficiarios/<id>#avances")` | `:141` |
| 14 | Propagación | El padrino abre `/portal/[id]`; la consulta filtra `seguimientos` por `visibleParaPadrino: true` | `src/app/portal/[id]/page.tsx:38-48` |
| 15 | Escritura | `registrarAuditoria({ accion: "VER_PORTAL" })` | `src/app/portal/[id]/page.tsx:60-66` → `bitacora` |
| 16 | Respuesta | El padrino ve el avance solo si el paso 9 lo marcó visible | — |

- **Transacción:** ninguna; los pasos 10 y 11 son escrituras independientes.
- **Doble comprobación:** pasos 2 y 7. La acción no confía en que la pantalla se haya rendido.
- **Correo o archivo:** ninguno. El padrino no recibe aviso de que hay un avance nuevo.

### 8.4 Asignación de un padrinazgo

| # | Participante | Llamada real | Archivo:línea |
|---|---|---|---|
| 1 | Actor (trabajo social o administrador) | Abre `/admin/asignaciones` | — |
| 2 | **Autorización** | `requirePermiso(PADRINAZGOS_GESTIONAR)` | `src/app/admin/asignaciones/page.tsx:34` |
| 3 | Consultas | `Promise.all`: padrinazgos activos, beneficiarios `ACTIVO` sin padrinazgo activo, padrinos activos con su conteo, y el ajuste `donaciones.aporteSugerido` | `:36-77` → `padrinazgos`, `beneficiarios`, `padrinos`, `configuracion` |
| 4 | Vista | `FormularioAsignacion` con los desplegables ya filtrados | `src/app/admin/asignaciones/formulario.tsx:15` |
| 5 | Acción | `POST` → `asignarPadrinazgo(estado, FormData)` | `src/app/admin/asignaciones/acciones.ts:27` |
| 6 | **Autorización** | `requirePermiso(PADRINAZGOS_GESTIONAR)` en el servidor | `:31` |
| 7 | **Validación** | `esquemaAsignacion.safeParse()`: aporte ≥ 50, modalidad del enum, fecha `AAAA-MM-DD` | `:33-39`, esquema en `:12-25` |
| 8 | Relectura | `Promise.all` de `padrino.findUnique` y `beneficiario.findUnique` (este último con sus padrinazgos activos) | `:43-57` → `padrinos`, `beneficiarios`, `padrinazgos` |
| 9 | **Regla 1** | Padrino inexistente o `activo = false` → error en el campo `padrinoId` | `:59-61` |
| 10 | **Regla 2** | Beneficiario inexistente o `estado ≠ ACTIVO` → error en `beneficiarioId` | `:62-64` |
| 11 | **Regla 3 (carrera)** | Beneficiario con padrinazgo activo → error; el comentario explica que se revalida aquí porque otra persona pudo asignarlo entre la carga y el envío | `:65-73` |
| 12 | Consulta | `padrinazgo.findUnique` por la llave única compuesta `padrinoId_beneficiarioId` | `:77-85` → índice `padrinazgos_padrinoId_beneficiarioId_key` |
| 13 | Escritura (rama A) | Si existía: `padrinazgo.update` con `activo = true`, `fechaFin = null`, nuevo aporte y modalidad | `:95-99` → `padrinazgos` |
| 14 | Escritura (rama B) | Si no existía: `padrinazgo.create` | `:101-108` → `padrinazgos` |
| 15 | Escritura | `registrarAuditoria` con `accion = "ACTUALIZAR"` o `"CREAR"` y `entidadId = beneficiarioId` | `:110-116` → `bitacora` |
| 16 | Caché | `revalidatePath` de `/admin/asignaciones`, `/admin/donantes` y `/admin/beneficiarios/<id>` | `:118-120` |
| 17 | Respuesta | Mensaje de confirmación con el primer nombre del beneficiario y el nombre del padrino | `:122-124` |
| 18 | Efecto lateral | El beneficiario desaparece de `/apadrina` y aparece en `/portal` del padrino | `src/app/(publico)/apadrina/page.tsx:34`, `src/app/portal/page.tsx:24` |

- **Transacción:** **no la hay**. Los pasos 8-14 no están envueltos en `$transaction`; la protección contra la doble asignación es la revalidación del paso 11 más el índice único del paso 12.
- **Correo o archivo:** ninguno. Al padrino no se le notifica su asignación.

### 8.5 Donación de extremo a extremo

| # | Participante | Llamada real | Archivo:línea |
|---|---|---|---|
| 1 | Actor (donante anónimo) | Abre `/donar` | — |
| 2 | Consultas | `Promise.all`: campañas con `activa = true` y el ajuste `donaciones.aporteSugerido` | `src/app/(publico)/donar/page.tsx:18-24` → `campanas`, `configuracion` |
| 3 | Vista | `FormularioDonacion` con el monto sugerido y el desplegable de campañas | `src/components/formularios-publicos.tsx:362` |
| 4 | Acción | `POST` → `iniciarDonacion(estado, FormData)` | `src/app/(publico)/acciones.ts:194` |
| 5 | **Validación** | `esquemaDonacion.safeParse()`: monto ≥ 25 y método en `TARJETA \| TRANSFERENCIA \| DEPOSITO` | `:198-204`, esquema en `src/lib/formularios.ts:77-90` |
| 6 | Servicio externo (simulado) | `pasarela.crearIntencion({ monto, moneda: "GTQ", metodo, descripcion })` | `:207-212` → `src/lib/pasarela.ts:45-57` |
| 7 | Generación | `generarReferencia()` produce `CER-SIM-` + 6 caracteres | `src/lib/pasarela.ts:32-39` |
| 8 | Escritura | `prisma.donacion.create` con `estado: "PENDIENTE"` y `referenciaPasarela` única | `:214-227` → tabla `donaciones` |
| 9 | Escritura | `registrarAuditoria({ accion: "CREAR", entidad: "Donacion" })` | `:229-235` → `bitacora` |
| 10 | Respuesta | `redirect("/donar/pagar/<id>")` | `:237` |
| 11 | Vista | `PagarPage` consulta la donación con su campaña | `src/app/(publico)/donar/pagar/[id]/page.tsx:23-26` → `donaciones`, `campanas` |
| 12 | **Regla** | `notFound()` si no existe; `redirect` al comprobante si el estado ya no es `PENDIENTE` | `:28-29` |
| 13 | Actor | Pulsa aprobar o rechazar; dos `<form>` distintos con `aprobar = si \| no` | `:72-87` |
| 14 | Acción | `confirmarDonacion(FormData)` lee id e indicador | `src/app/(publico)/acciones.ts:240-242` |
| 15 | Consulta | `prisma.donacion.findUnique`; si no existe, `redirect("/donar")` | `:244-245` → `donaciones` |
| 16 | Servicio externo (simulado) | `pasarela.confirmar(referencia, aprobar)` | `:247-250` → `src/lib/pasarela.ts:59-67` |
| 17 | Escritura | `prisma.donacion.update` a `COMPLETADA` o `FALLIDA` | `:252-255` → `donaciones` |
| 18 | Escritura | `registrarAuditoria` con `PAGO_APROBADO` o `PAGO_RECHAZADO` y la referencia en el detalle | `:257-263` → `bitacora` |
| 19 | Respuesta | `redirect("/donar/gracias/<id>")` | `:265` |
| 20 | Vista | `GraciasPage` consulta la donación y rinde el comprobante en pantalla | `src/app/(publico)/donar/gracias/[id]/page.tsx:22-25` |
| 21 | Consulta interna | El personal con `donaciones.leer` la ve en `/admin/donaciones`; solo las `COMPLETADA` suman al total | `src/app/admin/donaciones/page.tsx:47-59` |

- **Transacción:** ninguna. Los pasos 8-9 y 17-18 son escrituras independientes.
- **Correo o archivo:** **ninguno**. El comprobante solo existe como HTML; no se genera PDF ni se envía correo. El propio comprobante advierte que no tiene validez fiscal (`src/app/(publico)/donar/gracias/[id]/page.tsx:79-81`).
- **Dato relevante:** `campanas.recaudado` **no se actualiza** al completarse una donación; ningún punto del código la incrementa.

---

## 9. Arquitectura de componentes y despliegue

### 9.1 Capas y dependencias

| Capa / componente | Archivos representativos | De qué depende |
|---|---|---|
| **Navegador** | HTML rendido más los componentes marcados `"use client"`: `src/app/login/formulario.tsx:1`, `src/components/formularios-publicos.tsx`, `src/components/carrusel.tsx`, `src/components/admin/barra-lateral.tsx`, `src/app/admin/asignaciones/formulario.tsx`, `src/app/admin/beneficiarios/[id]/editar/formulario.tsx`, `src/app/admin/beneficiarios/[id]/avance/formulario.tsx` | Del servidor de Next; usan `useActionState` para invocar acciones de servidor |
| **Proxy de sesión** | `src/proxy.ts` | De `authConfig`; se ejecuta antes que las páginas de `/admin/*`, `/portal/*` e `/inicio` |
| **Capa de presentación (servidor)** | Los 34 `page.tsx` y los cuatro `layout.tsx` | De `src/lib/sesion.ts`, `src/lib/prisma.ts` y de los componentes de `src/components/` |
| **Capa de acciones (mutaciones)** | `src/app/(publico)/acciones.ts`, `src/app/admin/acciones.ts`, `src/app/admin/asignaciones/acciones.ts`, `src/app/admin/beneficiarios/acciones.ts`, `src/app/login/acciones.ts` | De `sesion.ts` (autorización y auditoría), `formularios.ts` (Zod), `prisma.ts` y `pasarela.ts` |
| **Capa de seguridad** | `src/auth.ts`, `src/auth.config.ts`, `src/lib/sesion.ts`, `src/lib/rbac.ts` | De NextAuth, bcryptjs, Zod y Prisma |
| **Capa de acceso a datos** | `src/lib/prisma.ts` y el cliente generado en `src/generated/prisma/` | De `@prisma/adapter-pg` y de `DATABASE_URL` |
| **Base de datos** | PostgreSQL, 26 tablas y 8 tipos enumerados | Ninguna; es la capa terminal |
| **Servicio de pago** | `src/lib/pasarela.ts` | De nada externo: la implementación `PasarelaSimulada` es local |
| **Sistema de diseño** | `src/components/ui.tsx`, `src/components/admin/estructura.tsx`, `src/app/globals.css` | De Tailwind 4 y `lucide-react` |
| **Datos de demostración** | `prisma/seed.ts` | De `bcryptjs`, del cliente Prisma y de `src/lib/rbac.ts` (importa el catálogo, no lo duplica) |

Dependencia notable en un solo sentido: `prisma/seed.ts:9` importa `CATALOGO_PERMISOS` y `CATALOGO_ROLES` desde `src/lib/rbac.ts`, de modo que el archivo de RBAC es la fuente única de verdad y la base es su reflejo.

### 9.2 Servicios externos

| Servicio | Estado real en el código | Archivo donde se configura |
|---|---|---|
| Base de datos PostgreSQL | **En uso.** Cliente único global en desarrollo para evitar múltiples conexiones con la recarga en caliente | `src/lib/prisma.ts:6-20`; URL desde `DATABASE_URL`; migraciones configuradas en `prisma.config.ts:10-16` |
| Pasarela de pago | **Simulada por diseño.** `PasarelaSimulada` implementa la interfaz `Pasarela` con `modoPrueba = true`; no hay red ni credenciales | `src/lib/pasarela.ts:41-70`; la interfaz a sustituir está en `:20-30`; el ajuste informativo `pasarela.modo` vive en `configuracion` (`prisma/seed.ts:1283-1287`) |
| Correo SMTP / transaccional | **NO ENCONTRADO.** No existe ninguna dependencia de correo en `package.json` ni ninguna referencia a `nodemailer`, `resend`, `smtp` o similar en `src/`. Los formularios solo escriben en la base | — |
| Generación de PDF | **NO ENCONTRADO.** Ninguna biblioteca de PDF en `package.json`. El comprobante de donación es HTML | — |
| Almacenamiento de archivos | **NO ENCONTRADO.** No hay integración con S3 ni Cloudinary; la propia pantalla lo declara: «La carga de archivos a un almacenamiento externo (S3 o Cloudinary) todavía no está conectada» | `src/app/admin/documentos/page.tsx:66` |
| Respaldos | **NO ENCONTRADO.** No hay tarea programada, script de respaldo ni `pg_dump` en el repositorio | — |
| Fuentes tipográficas | Google Fonts a través de `next/font/google`, que las descarga y sirve desde el propio dominio | `src/app/layout.tsx:5-16` |
| Autenticación federada | **NO ENCONTRADO.** El único proveedor configurado es `Credentials` | `src/auth.ts:16` |

### 9.3 Puertos y protocolos

| Elemento | Valor | Archivo |
|---|---|---|
| Protocolo de la aplicación | HTTP/HTTPS (Next lo sirve; el proyecto no fuerza HTTPS ni configura cabeceras de seguridad) | `next.config.ts:3-5` está vacío de opciones |
| Puerto de la aplicación | **NO ENCONTRADO**; se usa el predeterminado de `next dev` y `next start` | `package.json:6-8` |
| Base de datos | PostgreSQL sobre TCP, puerto `5433` en la cadena de ejemplo, esquema `public` | `.env.example:1` |
| Rutas interceptadas por el proxy | `/admin/:path*`, `/portal/:path*`, `/inicio` | `src/proxy.ts:24-26` |
| Confianza en el host | `AUTH_TRUST_HOST` | `.env.example:3` |
| Cabeceras leídas | `x-forwarded-for` y `x-real-ip`, para la IP de la bitácora — implica que se espera un proxy inverso por delante | `src/lib/sesion.ts:66-69` |

### 9.4 Notas de despliegue derivadas del código

- La aplicación es **monolítica**: un solo proceso Node sirve el sitio público, el panel y el portal.
- Casi todas las páginas declaran `export const dynamic = "force-dynamic"` (por ejemplo `src/app/(publico)/page.tsx:23`, `src/app/admin/page.tsx:21`, `src/app/portal/page.tsx:16`), de modo que **no hay renderizado estático ni caché de página**: cada visita consulta la base.
- La invalidación tras una mutación se hace con `revalidatePath()` en las acciones (`src/app/admin/beneficiarios/acciones.ts:89-90`, `src/app/admin/asignaciones/acciones.ts:118-120`, `src/app/admin/acciones.ts:32`).
- El cliente Prisma se guarda en `globalThis` fuera de producción para no abrir una conexión por recarga (`src/lib/prisma.ts:13-20`).
- El despliegue exige ejecutar `prisma migrate` y `prisma generate`, ya que `src/generated/` está excluido del control de versiones (`.gitignore:47`).

---

## 10. Reglas de negocio y validaciones

### 10.1 Reglas de acceso y confidencialidad

| # | Regla | Archivo:línea |
|---|---|---|
| RN-01 | Una cuenta con `activo = false` no puede iniciar sesión, aunque la contraseña sea correcta | `src/auth.ts:38` |
| RN-02 | El correo se compara siempre en minúsculas, tanto al autenticar como al registrarse | `src/auth.ts:27`, `src/app/(publico)/acciones.ts:83`, `src/app/login/acciones.ts:15` |
| RN-03 | La autorización se evalúa por permiso, no por rol, y siempre en el servidor | `src/lib/sesion.ts:40-46` |
| RN-04 | Sin sesión, cualquier ruta de `/admin`, `/portal` o `/inicio` redirige a `/login` conservando el destino | `src/proxy.ts:15-19` |
| RN-05 | El destino de redirección tras el login debe ser una ruta interna: debe empezar con `/` y no con `//` | `src/app/login/page.tsx:35-38` |
| RN-06 | Para entrar a cualquier ruta de `/admin` hace falta al menos uno de cuatro permisos de panel | `src/app/admin/layout.tsx:18-26` |
| RN-07 | Para entrar a `/portal` hace falta `portal.padrino`, comprobado en el layout y de nuevo en cada página | `src/app/portal/layout.tsx:13`, `src/app/portal/page.tsx:19`, `src/app/portal/[id]/page.tsx:20` |
| RN-08 | Si el rol no puede leer un bloque del expediente, **la consulta no se ejecuta**: el dato no llega al HTML | `src/app/admin/beneficiarios/[id]/page.tsx:110-142` |
| RN-09 | El padrino solo ve beneficiarios ligados a **su** `padrinoId` de sesión; nunca se confía en el id de la URL | `src/app/portal/page.tsx:22-24`, `src/app/portal/[id]/page.tsx:23-29` |
| RN-10 | El padrino solo ve los seguimientos marcados `visibleParaPadrino = true` | `src/app/portal/[id]/page.tsx:39`, `src/app/portal/page.tsx:33` |
| RN-11 | La galería pública expone únicamente id, nombres, fecha de nacimiento, resumen público, foto y programa; la proyección excluye apellidos, CUI, diagnóstico y datos familiares | `src/app/(publico)/apadrina/page.tsx:38-45`, `src/app/(publico)/apadrina/[id]/page.tsx:35-43`, `src/app/(publico)/page.tsx:118-125` |
| RN-12 | En la interfaz pública solo se muestra el primer nombre, obtenido con `primerNombre()` | `src/lib/utils.ts:8-10`, usado en `src/app/(publico)/apadrina/page.tsx:114` |
| RN-13 | Cada apertura de un expediente queda registrada en la bitácora | `src/app/admin/beneficiarios/[id]/page.tsx:164-170` |
| RN-14 | Cada consulta del progreso desde el portal queda registrada en la bitácora | `src/app/portal/[id]/page.tsx:60-66` |
| RN-15 | Cada inicio de sesión queda registrado en la bitácora | `src/auth.ts:48-56` |
| RN-16 | La bitácora guarda la IP tomada del primer valor de `x-forwarded-for` o de `x-real-ip`; si las cabeceras fallan, la entrada se escribe igual con IP nula | `src/lib/sesion.ts:63-83` |
| RN-17 | Las secciones de la barra lateral se filtran por el permiso de cada una | `src/components/admin/barra-lateral.tsx:59`, catálogo en `src/components/admin/navegacion.ts:11-130` |
| RN-18 | Las consultas costosas del tablero solo se ejecutan si el rol tiene el permiso correspondiente | `src/app/admin/page.tsx:55-64` |

### 10.2 Reglas del dominio de beneficiarios y expedientes

| # | Regla | Archivo:línea |
|---|---|---|
| RN-19 | Un beneficiario pertenece obligatoriamente a un programa; no se puede borrar un programa con beneficiarios (`ON DELETE RESTRICT`) | `migration.sql:527` |
| RN-20 | `codigoExpediente` es único en todo el sistema | `migration.sql:452` |
| RN-21 | `cui` es único cuando está presente | `migration.sql:455` |
| RN-22 | Un beneficiario tiene como máximo un expediente clínico y una ficha socioeconómica (índices únicos sobre `beneficiarioId`) | `migration.sql:461`, `migration.sql:467` |
| RN-23 | Al borrar un beneficiario se borran en cascada su expediente clínico, ficha, evaluaciones, documentos, seguimientos, citas y padrinazgos | `migration.sql:530`, `:533`, `:536`, `:539`, `:542`, `:545`, `:554` |
| RN-24 | La completitud del expediente se calcula sobre siete criterios: CUI, dirección, expediente clínico, ficha socioeconómica, al menos tres documentos, al menos una evaluación y al menos un avance | `src/app/admin/beneficiarios/[id]/page.tsx:149-158` |
| RN-25 | Un expediente cuenta como incompleto cuando `estadoExpediente` es distinto de `COMPLETO` | `src/app/admin/beneficiarios/page.tsx:75`, `src/app/admin/page.tsx:39-41` |
| RN-26 | La búsqueda de beneficiarios es insensible a mayúsculas sobre nombres, apellidos y código de expediente | `src/app/admin/beneficiarios/page.tsx:52-61` |
| RN-27 | El avance registra automáticamente el nombre del autor de la sesión en `registradoPor` | `src/app/admin/beneficiarios/acciones.ts:128` |
| RN-28 | Un avance es privado por omisión: `visibleParaPadrino` tiene predeterminado `false` y solo se activa con la casilla marcada | `migration.sql:204`, `src/app/admin/beneficiarios/acciones.ts:118` |

### 10.3 Reglas de padrinazgo y recaudación

| # | Regla | Archivo:línea |
|---|---|---|
| RN-29 | Un beneficiario no puede tener dos padrinazgos activos a la vez; se revalida en el servidor porque otra persona pudo asignarlo entre la carga y el envío | `src/app/admin/asignaciones/acciones.ts:65-73` |
| RN-30 | Solo se puede asignar a un padrino con `activo = true` | `src/app/admin/asignaciones/acciones.ts:59-61` |
| RN-31 | Solo se puede asignar a un beneficiario con `estado = ACTIVO` | `src/app/admin/asignaciones/acciones.ts:62-64` |
| RN-32 | El par padrino-beneficiario es único en la base, de modo que un padrinazgo anterior se **reactiva** en vez de crearse otra vez | `migration.sql:488`, `src/app/admin/asignaciones/acciones.ts:75-108` |
| RN-33 | El aporte mensual mínimo de un padrinazgo es de Q50 | `src/app/admin/asignaciones/acciones.ts:15-18` |
| RN-34 | El aporte mínimo sugerido al inscribirse como padrino también es de Q50, pero el campo es opcional y admite cadena vacía | `src/lib/formularios.ts:50-56` |
| RN-35 | Al finalizar un padrinazgo se conserva la fila y se marca con `activo = false` y `fechaFin` | `src/app/admin/asignaciones/acciones.ts:144-147` |
| RN-36 | Un beneficiario con padrinazgo activo desaparece de la galería pública | `src/app/(publico)/apadrina/page.tsx:34`, `src/app/(publico)/page.tsx:115` |
| RN-37 | El monto mínimo de una donación es de Q25 | `src/lib/formularios.ts:80-83` |
| RN-38 | Los métodos de pago admitidos son `TARJETA`, `TRANSFERENCIA` y `DEPOSITO` | `src/lib/formularios.ts:84-86`, catálogo en `src/lib/pasarela.ts:72-76` |
| RN-39 | La moneda es siempre `GTQ` | `migration.sql:263`, `src/app/(publico)/acciones.ts:209` |
| RN-40 | La referencia de la pasarela es única en la base y se genera con el prefijo `CER-SIM-` más seis caracteres de un alfabeto sin letras ni dígitos ambiguos | `migration.sql:491`, `src/lib/pasarela.ts:32-39` |
| RN-41 | En ningún paso se piden ni se guardan datos de tarjeta | `src/lib/pasarela.ts:1-5` |
| RN-42 | Una donación que ya no está `PENDIENTE` no puede volver a la pantalla de pago | `src/app/(publico)/donar/pagar/[id]/page.tsx:29` |
| RN-43 | Solo las donaciones `COMPLETADA` suman al total recaudado | `src/app/admin/page.tsx:56-59`, `src/app/admin/donaciones/page.tsx:52-56` |
| RN-44 | Al borrar un padrino o una campaña, sus donaciones se conservan con la referencia en nulo (`ON DELETE SET NULL`) | `migration.sql:557`, `:560` |

### 10.4 Validaciones de formulario (esquemas Zod)

| # | Validación | Archivo:línea |
|---|---|---|
| RN-45 | Credenciales: correo con formato válido y contraseña de al menos un carácter | `src/auth.ts:8-11` |
| RN-46 | Inscripción de beneficiario: nombre ≥ 3, fecha con patrón `AAAA-MM-DD`, sexo del enum, municipio y departamento ≥ 2, encargado ≥ 3, parentesco ≥ 3, teléfono ≥ 8, correo válido o cadena vacía | `src/lib/formularios.ts:23-42` |
| RN-47 | Inscripción de padrino: nombre ≥ 3, correo válido, teléfono ≥ 8, contraseña de 8 a 72 caracteres | `src/lib/formularios.ts:44-62` |
| RN-48 | Las dos contraseñas deben coincidir; el error se dirige al campo `passwordConfirmacion` | `src/lib/formularios.ts:64-67` |
| RN-49 | No puede existir otra cuenta con el mismo correo, ni en `usuarios` ni en `padrinos` | `src/app/(publico)/acciones.ts:85-98` |
| RN-50 | Contacto: nombre ≥ 3, correo válido, asunto ≥ 3, mensaje ≥ 10 | `src/lib/formularios.ts:69-75` |
| RN-51 | Donación: nombre ≥ 3, correo válido, monto ≥ 25, método del enum | `src/lib/formularios.ts:77-90` |
| RN-52 | Datos generales del expediente: 21 campos validados, con nombres y apellidos ≥ 2, municipio y departamento ≥ 2, encargado ≥ 3, teléfono ≥ 8 y los tres enums de estado | `src/app/admin/beneficiarios/acciones.ts:12-37` |
| RN-53 | Avance: fecha con patrón, área ≥ 3, título ≥ 5, descripción ≥ 10 | `src/app/admin/beneficiarios/acciones.ts:94-101` |
| RN-54 | Asignación: padrino y beneficiario obligatorios, aporte ≥ 50, modalidad del enum, fecha con patrón | `src/app/admin/asignaciones/acciones.ts:12-25` |
| RN-55 | Cambio de estado de las bandejas: id no vacío y estado dentro de los cuatro valores de `EstadoSolicitud` | `src/app/admin/acciones.ts:9-12` |
| RN-56 | Solo se muestra el primer mensaje de error por campo | `src/lib/formularios.ts:11-18` |
| RN-57 | Los campos opcionales vacíos se normalizan a `null` antes de escribir en la base | `src/app/(publico)/acciones.ts:44-47`, `src/app/admin/beneficiarios/acciones.ts:61-72` |
| RN-58 | Las casillas de verificación se interpretan comparando el valor con la cadena `"on"` | `src/app/admin/beneficiarios/acciones.ts:76`, `:118`, `src/app/(publico)/acciones.ts:224` |
| RN-59 | El estado de las donaciones recibido por URL se valida contra una lista blanca antes de filtrar | `src/app/admin/donaciones/page.tsx:32`, `:42-44` |
| RN-60 | La página de la bitácora se normaliza a un mínimo de 1 | `src/app/admin/auditoria/page.tsx:30` |

### 10.5 Reglas de presentación de datos

| # | Regla | Archivo:línea |
|---|---|---|
| RN-61 | Las fechas de calendario (`@db.Date`) se formatean en UTC porque se guardan a medianoche UTC y Guatemala es UTC−6; formatearlas en zona local las correría un día | `src/lib/fechas.ts:1-5`, `:9-29` |
| RN-62 | Solo las marcas de tiempo (`createdAt`, `updatedAt`, `ultimoAcceso`) se formatean en `America/Guatemala` | `src/lib/fechas.ts:7`, `:31-42` |
| RN-63 | Una fecha de un campo de formulario se convierte fijando la medianoche UTC explícitamente | `src/lib/fechas.ts:63-65` |
| RN-64 | La edad se calcula en UTC comparando año, mes y día | `src/lib/fechas.ts:44-55` |
| RN-65 | Los importes se presentan en quetzales con la configuración regional `es-GT` y dos decimales | `src/lib/fechas.ts:67-74` |
| RN-66 | Los valores `Decimal` de Prisma se convierten a número pasando por su representación en texto, sin depender del tipo en ejecución | `src/lib/utils.ts:24-28` |
| RN-67 | La paginación de la bitácora es de 25 entradas por página | `src/app/admin/auditoria/page.tsx:20` |
| RN-68 | El expediente muestra las últimas 15 entradas de bitácora de ese beneficiario | `src/app/admin/beneficiarios/[id]/page.tsx:140` |
| RN-69 | El tablero muestra los cinco últimos avances y las seis últimas entradas de bitácora | `src/app/admin/page.tsx:45`, `:63` |
| RN-70 | La portada muestra como máximo tres beneficiarios esperando padrino y tres historias | `src/app/(publico)/page.tsx:126`, `:132` |
| RN-71 | Todos los filtros de listado son formularios `method="get"`, de modo que funcionan sin JavaScript | `src/app/admin/beneficiarios/page.tsx:121`, `src/app/(publico)/apadrina/page.tsx:67`, `src/app/admin/auditoria/page.tsx:70`, `src/components/admin/selector-estado.tsx:10` |
| RN-72 | Cuando falta un ajuste de configuración se usa el valor de reserva `"350"` para el aporte sugerido | `src/app/(publico)/donar/page.tsx:55`, `src/app/(publico)/inscripcion/padrino/page.tsx:56`, `src/app/admin/asignaciones/page.tsx:102` |

---

## 11. Trazabilidad

Requisitos funcionales propuestos a partir de lo que el código realmente hace.
Estado: **implementado** (funciona de extremo a extremo), **parcial** (existe la
lectura o parte del flujo, falta la escritura o un tramo), **no implementado**
(el modelo de datos lo contempla pero no hay código que lo ejecute).

| # | Enunciado | Archivos que lo implementan | Estado |
|---|---|---|---|
| RF-01 | El sistema deberá autenticar a los usuarios mediante correo electrónico y contraseña cifrada con bcrypt. | `src/auth.ts:16-79`, `src/app/login/acciones.ts:7-28`, `src/app/login/formulario.tsx` | Implementado |
| RF-02 | El sistema deberá impedir el acceso a las cuentas marcadas como inactivas. | `src/auth.ts:38` | Implementado |
| RF-03 | El sistema deberá registrar en la bitácora cada inicio de sesión con el actor, la fecha y la dirección IP. | `src/auth.ts:48-56`, `src/lib/sesion.ts:56-84` | Parcial: el inicio se registra, pero **sin IP** porque `authorize()` escribe directamente en `prisma.auditLog` sin pasar por `registrarAuditoria()` |
| RF-04 | El sistema deberá administrar roles y permisos, y evaluar la autorización por permiso en el servidor antes de ejecutar cualquier consulta. | `src/lib/rbac.ts`, `src/lib/sesion.ts:40-54`, `prisma/seed.ts:48-74` | Implementado |
| RF-05 | El sistema deberá conducir a cada usuario, tras iniciar sesión, a la zona que le corresponde según sus permisos. | `src/app/inicio/page.tsx:8-24` | Implementado |
| RF-06 | El sistema deberá mostrar una pantalla explicativa cuando el usuario carezca del permiso requerido. | `src/app/sin-acceso/page.tsx`, `src/lib/sesion.ts:44` | Implementado |
| RF-07 | El sistema deberá permitir cerrar la sesión desde cualquier zona autenticada. | `src/components/cerrar-sesion.tsx`, `src/app/login/acciones.ts:30-32` | Implementado |
| RF-08 | El sistema deberá permitir crear, editar y desactivar cuentas de usuario desde la interfaz. | `src/app/admin/usuarios/page.tsx` | Parcial: solo consulta de cuentas y de la matriz de permisos; no hay alta, edición ni desactivación |
| RF-09 | El sistema deberá mostrar la matriz vigente de roles y permisos leída de la base de datos. | `src/app/admin/usuarios/page.tsx:25-40`, `:84-158` | Implementado |
| RF-10 | El sistema deberá permitir el alta de un expediente de beneficiario. | — | **No implementado**: no existe ningún `prisma.beneficiario.create` en `src/`; el alta solo ocurre por `prisma/seed.ts:206-441` o directamente en la base |
| RF-11 | El sistema deberá permitir consultar el listado de beneficiarios con búsqueda por nombre, apellido o código de expediente y filtros por programa y estado. | `src/app/admin/beneficiarios/page.tsx:39-91` | Implementado |
| RF-12 | El sistema deberá mostrar el expediente completo de un beneficiario dividido en secciones y ocultar aquellas para las que el rol no tenga permiso. | `src/app/admin/beneficiarios/[id]/page.tsx:73-142` | Implementado |
| RF-13 | El sistema deberá permitir editar los datos generales del expediente. | `src/app/admin/beneficiarios/[id]/editar/page.tsx`, `src/app/admin/beneficiarios/acciones.ts:12-92` | Implementado |
| RF-14 | El sistema deberá permitir registrar y editar el expediente clínico del beneficiario. | `prisma/schema.prisma:188-206`, lectura en `src/app/admin/beneficiarios/[id]/page.tsx:110-118` | Parcial: solo lectura. El permiso `expediente.clinico.escribir` existe (`src/lib/rbac.ts:52-57`) pero **ninguna función lo comprueba** ni escribe en la tabla |
| RF-15 | El sistema deberá permitir registrar y editar la ficha socioeconómica del hogar. | `prisma/schema.prisma:223-243`, lectura en `src/app/admin/beneficiarios/[id]/page.tsx:119-123` | Parcial: solo lectura. El permiso `expediente.socioeconomico.escribir` no se comprueba en ninguna función |
| RF-16 | El sistema deberá permitir registrar evaluaciones clínicas asociadas al expediente. | `prisma/schema.prisma:208-221`, lectura en `src/app/admin/beneficiarios/[id]/page.tsx:113-118` | Parcial: solo lectura; la escritura solo ocurre en `prisma/seed.ts:465-524` |
| RF-17 | El sistema deberá permitir registrar avances de seguimiento y decidir si son visibles para el padrino. | `src/app/admin/beneficiarios/[id]/avance/`, `src/app/admin/beneficiarios/acciones.ts:94-142` | Implementado |
| RF-18 | El sistema deberá calcular y mostrar el porcentaje de completitud del expediente. | `src/app/admin/beneficiarios/[id]/page.tsx:149-158` | Parcial: se calcula y se muestra, pero **no se persiste** ni actualiza `estadoExpediente` |
| RF-19 | El sistema deberá permitir adjuntar documentos al expediente subiendo el archivo. | `src/app/admin/documentos/page.tsx`, `prisma/schema.prisma:245-261` | Parcial: solo listado y control de vigencia. La carga de archivos no está conectada, declarado en `src/app/admin/documentos/page.tsx:66` |
| RF-20 | El sistema deberá registrar y mostrar las citas programadas del beneficiario. | `prisma/schema.prisma:281-292`, próxima cita en `src/app/admin/beneficiarios/[id]/page.tsx:97-101` | Parcial: solo se muestra la próxima cita; no hay pantalla de agenda ni alta de citas |
| RF-21 | El sistema deberá publicar en el sitio público únicamente a los beneficiarios activos, autorizados y sin padrino asignado, mostrando solo primer nombre, edad y programa. | `src/app/(publico)/apadrina/page.tsx:30-47`, `src/app/(publico)/apadrina/[id]/page.tsx:33-44`, `src/app/(publico)/page.tsx:111-128` | Implementado |
| RF-22 | El sistema deberá recibir solicitudes de inscripción de beneficiarios desde el sitio público. | `src/app/(publico)/inscripcion/beneficiario/page.tsx`, `src/app/(publico)/acciones.ts:19-62` | Implementado |
| RF-23 | El sistema deberá permitir al personal clasificar cada solicitud de inscripción como nueva, en revisión, aprobada o rechazada. | `src/app/admin/solicitudes/page.tsx`, `src/app/admin/acciones.ts:14-33` | Implementado |
| RF-24 | El sistema deberá convertir una solicitud aprobada en un expediente de beneficiario. | — | **No implementado**: aprobar una solicitud solo cambia su estado; no hay vínculo ni creación del beneficiario |
| RF-25 | El sistema deberá permitir a una persona inscribirse como padrino y crear su cuenta de acceso al portal en un solo paso. | `src/app/(publico)/inscripcion/padrino/page.tsx`, `src/app/(publico)/acciones.ts:69-157` | Implementado |
| RF-26 | El sistema deberá impedir el registro de un padrino con un correo ya utilizado. | `src/app/(publico)/acciones.ts:85-98` | Implementado |
| RF-27 | El sistema deberá permitir asignar un beneficiario activo sin padrino a un padrino activo, con su aporte y modalidad. | `src/app/admin/asignaciones/page.tsx`, `src/app/admin/asignaciones/acciones.ts:27-125` | Implementado |
| RF-28 | El sistema deberá impedir que un beneficiario tenga dos padrinazgos activos de forma simultánea. | `src/app/admin/asignaciones/acciones.ts:65-73`, índice único en `migration.sql:488` | Implementado |
| RF-29 | El sistema deberá permitir dar por terminado un padrinazgo conservando el histórico. | `src/app/admin/asignaciones/acciones.ts:127-160` | Implementado |
| RF-30 | El sistema deberá permitir al padrino consultar el listado de las personas que apadrina. | `src/app/portal/page.tsx:18-40` | Implementado |
| RF-31 | El sistema deberá permitir al padrino consultar los avances de su apadrinado, mostrando exclusivamente los marcados como visibles. | `src/app/portal/[id]/page.tsx:20-55` | Implementado |
| RF-32 | El sistema deberá impedir que un padrino acceda al progreso de un beneficiario que no le fue asignado. | `src/app/portal/[id]/page.tsx:23-29`, `:55` | Implementado |
| RF-33 | El sistema deberá permitir registrar una donación desde el sitio público indicando monto, método y destino. | `src/app/(publico)/donar/page.tsx`, `src/app/(publico)/acciones.ts:194-238` | Implementado |
| RF-34 | El sistema deberá integrarse con una pasarela de pago para cobrar la donación. | `src/lib/pasarela.ts` | Parcial: la interfaz `Pasarela` está definida y aislada, pero la única implementación es `PasarelaSimulada` con `modoPrueba = true` |
| RF-35 | El sistema deberá emitir un comprobante de la donación con su referencia. | `src/app/(publico)/donar/gracias/[id]/page.tsx` | Parcial: el comprobante es HTML en pantalla; no se genera PDF ni se envía por correo, y declara no tener validez fiscal |
| RF-36 | El sistema deberá permitir al personal autorizado consultar las donaciones, filtrarlas por estado y ver el total recaudado. | `src/app/admin/donaciones/page.tsx:34-59` | Implementado |
| RF-37 | El sistema deberá permitir consultar los padrinos con sus beneficiarios asignados y su aporte mensual. | `src/app/admin/donantes/page.tsx:30-43` | Implementado |
| RF-38 | El sistema deberá administrar campañas de recaudación con su meta y su avance. | `src/app/admin/campanas/page.tsx`, `src/app/(publico)/donar/page.tsx:19-22` | Parcial: solo consulta. No hay alta ni edición, y `campanas.recaudado` **nunca se actualiza** al completarse una donación |
| RF-39 | El sistema deberá recibir mensajes de contacto desde el sitio público y permitir su seguimiento. | `src/app/(publico)/contacto/page.tsx`, `src/app/(publico)/acciones.ts:159-191`, `src/app/admin/mensajes/page.tsx` | Implementado |
| RF-40 | El sistema deberá notificar por correo electrónico las inscripciones, los mensajes y los comprobantes. | — | **No implementado**: no hay ninguna dependencia ni código de correo en el proyecto |
| RF-41 | El sistema deberá recibir y clasificar postulaciones de padrinos y voluntarios. | `src/app/admin/voluntarios/page.tsx`, `src/app/admin/acciones.ts:35-54` | Implementado |
| RF-42 | El sistema deberá administrar el contenido institucional: historias, entradas de blog y eventos. | `src/app/admin/historias/page.tsx`, `src/app/admin/blog/page.tsx`, `src/app/admin/eventos/page.tsx` | Parcial: solo consulta; el alta y la edición no existen, declarado en `src/app/admin/eventos/page.tsx:30` |
| RF-43 | El sistema deberá publicar en el sitio público las historias de avance en estado publicado. | `src/app/(publico)/page.tsx:129-133` | Implementado |
| RF-44 | El sistema deberá publicar en el sitio público las entradas de blog y los eventos. | `prisma/schema.prisma:395-425` | **No implementado**: no existe ninguna ruta pública de blog ni de eventos |
| RF-45 | El sistema deberá administrar el catálogo de programas de atención. | `src/app/admin/programas/page.tsx` | Parcial: solo consulta; el alta y la edición no existen |
| RF-46 | El sistema deberá administrar los parámetros de configuración de la organización. | `src/app/admin/configuracion/page.tsx`, `prisma/seed.ts:1242-1291` | Parcial: solo consulta; no hay edición desde la interfaz |
| RF-47 | El sistema deberá alimentar los datos de contacto del sitio público desde la configuración almacenada. | `src/components/publico.tsx:14-25`, `src/app/(publico)/contacto/page.tsx:16` | Implementado |
| RF-48 | El sistema deberá registrar en una bitácora las consultas de expedientes y todas las modificaciones de datos. | `src/lib/sesion.ts:56-84` y sus 15 puntos de invocación | Implementado |
| RF-49 | El sistema deberá permitir consultar la bitácora con filtros por acción y por entidad, y paginación. | `src/app/admin/auditoria/page.tsx:22-60` | Implementado |
| RF-50 | El sistema deberá permitir administrar una galería de medios. | `prisma/schema.prisma:427-438`, `prisma/seed.ts:1133-1153` | **No implementado**: la tabla `medios` existe y se siembra, pero **ninguna pantalla la consulta** |
| RF-51 | El sistema deberá permitir exportar el expediente a PDF y generar el carné del beneficiario. | — | **No implementado** |
| RF-52 | El sistema deberá ofrecer recuperación de contraseña y segundo factor de autenticación. | — | **No implementado** |
| RF-53 | El sistema deberá generar respaldos de la base de datos. | — | **No implementado** |
| RF-54 | El sistema deberá funcionar sin JavaScript en el navegador para los filtros y los cambios de estado. | `src/app/admin/beneficiarios/page.tsx:121`, `src/app/(publico)/apadrina/page.tsx:67`, `src/components/admin/selector-estado.tsx:10` | Implementado |
| RF-55 | El sistema deberá ser accesible: enlaces de salto al contenido, tablas con `caption`, campos con etiqueta asociada y textos alternativos en las imágenes. | `src/app/admin/layout.tsx:30-32`, `src/app/portal/layout.tsx:17-19`, `src/components/admin/estructura.tsx:26`, `src/components/ui.tsx:381-542`, `src/app/(publico)/page.tsx:61-82` | Implementado |

**Resumen:** 55 requisitos identificados — **32 implementados**, **14 parciales**, **9 no implementados**.

---

## 12. Vacíos y hallazgos

### 12.1 Existe en el código pero no está documentado

| # | Hallazgo | Archivo:línea |
|---|---|---|
| H-01 | **`/admin/asignaciones` está implementado pero el README lo declara pendiente.** El README dice: «Alta de padrinazgos desde el panel. La asignación padrino ↔ beneficiario se hace por seed o en la base». En realidad existen la pantalla, el formulario y las dos acciones | `README.md:241-243` frente a `src/app/admin/asignaciones/page.tsx`, `src/app/admin/asignaciones/acciones.ts` |
| H-02 | El README describe «panel con 16 secciones»; el catálogo real tiene **17** | `README.md:262` frente a `src/components/admin/navegacion.ts:11-130` |
| H-03 | La ruta `/admin/asignaciones` y sus archivos no aparecen en el árbol del README | `README.md:253-273` |
| H-04 | Los componentes `src/components/carrusel.tsx` y `src/components/foto-beneficiario.tsx` no se mencionan en ninguna documentación | `src/components/carrusel.tsx`, `src/components/foto-beneficiario.tsx` |
| H-05 | La regla de negocio que **revalida la carrera de asignación** (dos personas asignando el mismo beneficiario a la vez) solo está documentada en un comentario del código | `src/app/admin/asignaciones/acciones.ts:65-66` |
| H-06 | El script `tools_generar_capitulo5.py` (29 460 bytes) vive en la raíz del repositorio sin ninguna referencia en el README ni en `package.json`; no forma parte de la aplicación | `tools_generar_capitulo5.py` |
| H-07 | La carpeta `docs/generated/` con el `.docx` y 16 diagramas no está documentada ni excluida de git | `docs/generated/` |
| H-08 | La contraseña de las cuentas de demostración se muestra en claro en la propia pantalla de acceso pública | `src/app/login/page.tsx:82`, `prisma/seed.ts:1408` |

### 12.2 Falta implementar

| # | Vacío | Evidencia |
|---|---|---|
| V-01 | **No existe el alta de beneficiarios.** No hay ningún `prisma.beneficiario.create` en `src/`; solo se pueden editar los que ya están en la base | Búsqueda en `src/`: únicamente `prisma.beneficiario.update` en `src/app/admin/beneficiarios/acciones.ts:54` |
| V-02 | No hay escritura del expediente clínico ni de las evaluaciones clínicas, pese a existir el permiso `expediente.clinico.escribir` | `src/lib/rbac.ts:52-57`; ninguna función lo comprueba |
| V-03 | No hay escritura de la ficha socioeconómica, pese a existir `expediente.socioeconomico.escribir` | `src/lib/rbac.ts:64-69`; sin uso |
| V-04 | No hay carga de archivos, pese a existir `documentos.subir` | `src/lib/rbac.ts:76-81`; la pantalla lo declara en `src/app/admin/documentos/page.tsx:66` |
| V-05 | No hay alta ni edición de citas; solo se muestra la próxima | `src/app/admin/beneficiarios/[id]/page.tsx:97-101` |
| V-06 | Aprobar una solicitud de inscripción **no crea el beneficiario**: la aprobación solo cambia un enum | `src/app/admin/acciones.ts:14-33`; `solicitudes_inscripcion` no tiene ninguna llave foránea hacia `beneficiarios` |
| V-07 | Aprobar una postulación no dispara ninguna acción; la cuenta ya se creó al inscribirse | `src/app/admin/acciones.ts:35-54` frente a `src/app/(publico)/acciones.ts:102-136` |
| V-08 | No hay gestión de usuarios: ni alta, ni edición, ni desactivación desde la interfaz | `src/app/admin/usuarios/page.tsx` es de solo lectura |
| V-09 | No hay edición de la configuración; los siete parámetros solo se pueden cambiar en la base | `src/app/admin/configuracion/page.tsx` |
| V-10 | No hay alta ni edición de programas, campañas, historias, entradas de blog ni eventos | `src/app/admin/programas/page.tsx`, `campanas/page.tsx`, `historias/page.tsx`, `blog/page.tsx`, `eventos/page.tsx` (esta última lo declara en `:30`) |
| V-11 | `campanas.recaudado` **nunca se incrementa**; una campaña puede tener donaciones `COMPLETADA` y seguir mostrando 0 | Ninguna escritura de `recaudado` en `src/`; solo `prisma/seed.ts:949-977` |
| V-12 | El estado `REEMBOLSADA` de `EstadoDonacion` no se puede alcanzar desde la aplicación | `migration.sql:14`; solo se filtra en `src/app/admin/donaciones/page.tsx:32` |
| V-13 | No hay envío de correo en ninguna parte del sistema | No existe dependencia de correo en `package.json`; sin coincidencias de `nodemailer`, `smtp`, `resend` en `src/` |
| V-14 | No hay generación de PDF ni de carné | Sin dependencias de PDF en `package.json` |
| V-15 | No hay recuperación de contraseña ni segundo factor | Único proveedor: `Credentials` en `src/auth.ts:16` |
| V-16 | No hay respaldos programados ni script de respaldo | Sin tareas ni scripts en `package.json:5-15` |
| V-17 | No hay pruebas automatizadas de ninguna clase | Sin dependencias de prueba en `package.json`; sin archivos `*.test.*` ni `*.spec.*` en el repositorio |
| V-18 | El campo `notaInterna` de `solicitudes_inscripcion` y de `postulaciones` **no se lee ni se escribe en ningún punto** de la aplicación | `migration.sql:375`, `:394`; sin coincidencias en `src/` |
| V-19 | La tabla `medios` no la consulta ninguna pantalla | Solo `prisma/seed.ts:1133-1153` |
| V-20 | No existe ninguna ruta pública de blog ni de eventos, aunque las tablas y el estado de publicación sí existen | `prisma/schema.prisma:395-425`; sin rutas en `src/app/(publico)/` |
| V-21 | El cierre de sesión no se registra en la bitácora, a diferencia del inicio | `src/app/login/acciones.ts:30-32` |
| V-22 | El registro de inicio de sesión **no guarda la IP**, porque `authorize()` escribe directamente con `prisma.auditLog.create` en lugar de usar `registrarAuditoria()` | `src/auth.ts:48-56` frente a `src/lib/sesion.ts:63-83` |
| V-23 | La completitud del expediente se calcula en cada visita pero no se persiste ni actualiza `estadoExpediente` | `src/app/admin/beneficiarios/[id]/page.tsx:149-158` |
| V-24 | El padrino no recibe aviso alguno cuando se publica un avance ni cuando se le asigna un beneficiario | Sin notificaciones en `src/app/admin/beneficiarios/acciones.ts:120-141` ni en `src/app/admin/asignaciones/acciones.ts:110-125` |

### 12.3 Código declarado y nunca utilizado

| # | Símbolo | Definido en | Usos fuera de su archivo |
|---|---|---|---|
| M-01 | `requireAlgunPermiso()` | `src/lib/sesion.ts:48-54` | Ninguno |
| M-02 | `tieneAlguno()` | `src/lib/sesion.ts:33-38` | Ninguno |
| M-03 | `permisosDeRol()` | `src/lib/rbac.ts:207-209` | Ninguno |
| M-04 | `slugify()` | `src/lib/utils.ts:30-37` | Ninguno; los `slug` de campañas, historias, blog y eventos solo se escriben desde el seed |
| M-05 | `formatFechaLarga()` | `src/lib/fechas.ts:20-29` | Ninguno |

### 12.4 Inconsistencias de nombres

| # | Inconsistencia | Evidencia |
|---|---|---|
| N-01 | **Idioma mixto entre modelos y tablas.** Doce modelos están en español (`Beneficiario`, `Programa`, `Padrino`, `Padrinazgo`, `Donacion`, `Cita`, `Seguimiento`, `Documento`, `EvaluacionClinica`, `FichaSocioeconomica`, `ExpedienteClinico`) y catorce en inglés (`User`, `Role`, `Permission`, `UserRole`, `RolePermission`, `Campaign`, `Story`, `Post`, `Event`, `Media`, `SupportRequest`, `VolunteerApplication`, `ContactMessage`, `Setting`, `AuditLog`), mientras que **todas** las tablas están en español mediante `@@map` | `prisma/schema.prisma:71-528` |
| N-02 | Consecuencia directa de N-01: la columna `bitacora.entidad` guarda el **nombre del modelo en inglés** (`User`, `SupportRequest`, `VolunteerApplication`, `ContactMessage`, `Donacion`, `Beneficiario`, `Seguimiento`, `Padrinazgo`), que no coincide con el nombre de la tabla que representa. El filtro de auditoría muestra esos valores crudos al usuario final | `src/auth.ts:52`, `src/app/(publico)/acciones.ts:55`, `:149`, `src/app/admin/acciones.ts:27`; presentación en `src/app/admin/auditoria/page.tsx:145` |
| N-03 | **`bitacora.entidadId` no siempre guarda el id de la entidad nombrada.** Para `Padrinazgo` guarda el `beneficiarioId` en las asignaciones (`asignaciones/acciones.ts:114`) y en la finalización (`:153`), pero el **id del padrinazgo** en el portal (`portal/[id]/page.tsx:64`). Para `Seguimiento` guarda el `beneficiarioId`, no el id del avance | `src/app/admin/asignaciones/acciones.ts:114`, `:153`; `src/app/portal/[id]/page.tsx:64`; `src/app/admin/beneficiarios/acciones.ts:136` |
| N-04 | La columna `tamanoBytes` de `documentos` y de `medios` está escrita sin eñe, a diferencia del resto de campos en español | `migration.sql:186`, `:351` |
| N-05 | El modelo `Campaign` (inglés) mapea a `campanas` (español sin eñe) y su campo de relación en `Donacion` se llama `campaign`, de modo que la misma entidad aparece con tres grafías distintas en el código | `prisma/schema.prisma:351`, `:356`, `:371` |
| N-06 | `historias.programa` es texto libre y no una llave foránea a `programas`, pese a llamarse igual que la tabla | `migration.sql:301` |
| N-07 | Las columnas de autoría `documentos.subidoPor`, `medios.subidoPor`, `seguimientos.registradoPor` y `fichas_socioeconomicas.realizadoPor` son texto libre sin llave foránea a `usuarios`; `registradoPor` guarda el **nombre** del usuario mientras que `bitacora.actor` guarda el **correo** | `migration.sql:190`, `:353`, `:205`, `:172`; escritura en `src/app/admin/beneficiarios/acciones.ts:128` frente a `:133` |
| N-08 | El listado de beneficiarios usa el encabezado «Expediente» **dos veces** en la misma tabla: una para el código y otra para el estado del expediente | `src/app/admin/beneficiarios/page.tsx:29`, `:35` |
| N-09 | `mensajes_contacto` reutiliza el enum `EstadoSolicitud`, de modo que un mensaje de contacto puede quedar «APROBADA» o «RECHAZADA», rótulos que no encajan con el dominio | `migration.sql:409`, opciones en `src/components/admin/selector-estado.tsx:3-8` |
| N-10 | `mensajes_contacto` carece de la columna `notaInterna` que sí tienen las otras dos bandejas, lo que rompe la simetría del grupo de formularios entrantes | `migration.sql:402-414` frente a `:375` y `:394` |
| N-11 | `postulaciones.tipo` es texto libre sin enum ni restricción; el único valor que escribe la aplicación es `"PADRINO"`, y la vista distingue solo entre ese valor y «cualquier otro» | `migration.sql:387`, `src/app/(publico)/acciones.ts:128`, `src/app/admin/voluntarios/page.tsx:64-68` |
| N-12 | `donaciones.metodo` es `TEXT` libre aunque el formulario lo restringe a tres valores mediante Zod; la restricción no existe en la base | `migration.sql:264` frente a `src/lib/formularios.ts:84-86` |
| N-13 | El archivo `src/proxy.ts` cumple el papel del antiguo `middleware.ts`, nombre por el que se le busca habitualmente. Está documentado en el propio archivo, pero es un nombre no estándar fuera de Next 16 | `src/proxy.ts:5-8` |

### 12.5 Observaciones de seguridad derivadas del código

| # | Observación | Evidencia |
|---|---|---|
| S-01 | Las tres acciones de cambio de estado de las bandejas exigen `expediente.leer`, un permiso de **lectura**, para ejecutar una **escritura**. En la práctica, el rol `DIRECCION` —descrito en el código como «Solo lectura» (`src/lib/rbac.ts:156`)— puede modificar el estado de solicitudes, postulaciones y mensajes | `src/app/admin/acciones.ts:15`, `:36`, `:57`; descripción del rol en `src/lib/rbac.ts:153-166` |
| S-02 | La contraseña común de las cinco cuentas de demostración se publica en la pantalla de acceso, accesible sin sesión | `src/app/login/page.tsx:77-83` |
| S-03 | El seed advierte en su cabecera y en su salida que los datos son ficticios y que las contraseñas deben cambiarse antes de producción | `prisma/seed.ts:1-4`, `:1375-1376` |
| S-04 | No hay control de intentos fallidos de acceso ni bloqueo temporal de cuentas | `src/auth.ts:21-78` |
| S-05 | Las pantallas del flujo de donación (`/donar/pagar/[id]` y `/donar/gracias/[id]`) son públicas y muestran nombre, correo y monto del donante a quien conozca el identificador de la donación, que es un `cuid` no adivinable pero tampoco protegido por sesión | `src/app/(publico)/donar/pagar/[id]/page.tsx:23-26`, `src/app/(publico)/donar/gracias/[id]/page.tsx:22-25` |
| S-06 | `next.config.ts` no define cabeceras de seguridad (CSP, HSTS, `X-Frame-Options`) | `next.config.ts:3-5` |
| S-07 | La aplicación depende de `x-forwarded-for` para la IP de la bitácora, lo que presupone un proxy inverso de confianza por delante; sin él, el valor es manipulable por el cliente | `src/lib/sesion.ts:66-69` |

### 12.6 Elementos verificados como correctos

Se listan porque suelen ser puntos débiles y en este proyecto están resueltos:

- La autorización se comprueba **dos veces** en toda operación de escritura: en la página y otra vez dentro de la acción de servidor, de modo que la acción no confía en que la pantalla se haya rendido (`src/app/admin/beneficiarios/[id]/editar/page.tsx:24` y `src/app/admin/beneficiarios/acciones.ts:43`).
- Los datos que un rol no puede ver **no se consultan**, en lugar de consultarse y ocultarse en la interfaz (`src/app/admin/beneficiarios/[id]/page.tsx:110-142`).
- El portal del padrino parte siempre del `padrinoId` de la sesión y nunca del identificador de la URL (`src/app/portal/page.tsx:22-24`, `src/app/portal/[id]/page.tsx:23-29`).
- El manejo de zonas horarias está resuelto de forma explícita y documentada: las fechas de calendario se formatean en UTC y solo las marcas de tiempo en hora de Guatemala (`src/lib/fechas.ts:1-7`).
- El registro de padrino se hace dentro de una transacción, de modo que no puede quedar un usuario sin su padrino asociado (`src/app/(publico)/acciones.ts:102-136`).
- La pasarela está aislada tras una interfaz, de modo que sustituirla no obliga a tocar el resto de la aplicación (`src/lib/pasarela.ts:20-30`).
- El catálogo de roles y permisos tiene una única fuente de verdad: el seed importa de `src/lib/rbac.ts` en lugar de duplicar el catálogo (`prisma/seed.ts:9`).

---

*Fin del inventario. Documento generado por lectura del código; no se modificó ningún archivo del sistema.*
