# CERNACE — plataforma web

Plataforma del **Centro de Educación y Rehabilitación para Niños y Adolescentes
con Capacidades Especiales** (Chimaltenango, Guatemala). Reúne el sitio
institucional, los expedientes digitalizados de los beneficiarios, el portal del
padrino, el flujo de donaciones y el panel de administración.

Proyecto de graduación. **Todos los datos incluidos son ficticios** y deben
sustituirse antes de cualquier uso real.

---

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript estricto, Tailwind CSS v4 |
| Backend | Server Components y Server Actions de Next, validación con zod |
| Base de datos | PostgreSQL 16 con Prisma 7 (driver adapter `@prisma/adapter-pg`) |
| Autenticación | Auth.js v5 (`next-auth@beta`), proveedor de credenciales, sesión JWT |
| Iconografía | lucide-react |

Los componentes están escritos a mano: no se usa ninguna librería de UI.

---

## Puesta en marcha

### 1. Requisitos

- Node.js 20.9 o superior
- Docker (para PostgreSQL) o una instancia de PostgreSQL 16 propia

### 2. Base de datos

```bash
docker run -d --name cernace2-postgres \
  -e POSTGRES_USER=cernace -e POSTGRES_PASSWORD=cernace -e POSTGRES_DB=cernace \
  -p 5433:5432 postgres:16-alpine
```

> El puerto es **5433** para no chocar con otra instancia de PostgreSQL que ya
> ocupe el 5432. Si el 5432 está libre, puedes usarlo y ajustar `DATABASE_URL`.

### 3. Variables de entorno

Copia `.env.example` a `.env` y genera el secreto:

```bash
cp .env.example .env
openssl rand -base64 32   # pega el resultado en AUTH_SECRET
```

```env
DATABASE_URL="postgresql://cernace:cernace@localhost:5433/cernace?schema=public"
AUTH_SECRET="<el secreto generado>"
AUTH_TRUST_HOST=true
```

### 4. Instalar, migrar y sembrar

```bash
npm install
npm run db:migrate     # aplica las migraciones y genera el cliente Prisma
npm run db:seed        # carga los datos de demostración
npm run dev
```

La aplicación queda en <http://localhost:3000>. Si ese puerto está ocupado,
`npm run dev -- -p 3100`.

### Comandos útiles

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Compilación y arranque en producción |
| `npm run verificar` | `tsc --noEmit` + `eslint .` + `next build` |
| `npm run db:seed` | Recarga los datos de demostración (borra y vuelve a insertar) |
| `npm run db:studio` | Prisma Studio |
| `npm run db:reset` | Reinicia la base de datos desde cero y siembra |

---

## Cuentas de demostración

Contraseña para todas: `cernace2026`

| Correo | Rol | Qué puede hacer |
| --- | --- | --- |
| `admin@cernace.org` | ADMIN | Todos los permisos |
| `direccion@cernace.org` | DIRECCION | Solo lectura, incluida la auditoría; sin gestión de usuarios |
| `trabajosocial@cernace.org` | TRABAJO_SOCIAL | Expediente completo; edita ficha socioeconómica y avances |
| `terapeuta@cernace.org` | TERAPEUTA | Área clínica (lee y escribe) y avances; **sin** ficha socioeconómica |
| `padrino@cernace.org` | PADRINO | Solo el portal del padrino |

Cámbialas antes de cualquier despliegue real.

---

## Los nueve objetivos y su ruta

| # | Objetivo | Ruta | Notas |
| --- | --- | --- | --- |
| 1 | Sitio web institucional informativo | `/`, `/contacto` | Misión, programas, historias y contacto, todo leído de la base |
| 2 | Expedientes digitalizados y centralizados, con usuarios, roles y respaldo | `/admin/beneficiarios`, `/admin/beneficiarios/[id]`, `/admin/usuarios`, `/admin/auditoria` | Expediente con datos generales, clínico, socioeconómico, documentos, avances y bitácora |
| 3 | Seguimiento con permisos para personal y padrinos | `/admin/beneficiarios/[id]/avance` y `/portal/[id]` | La casilla «visible para el padrino» decide qué se comparte |
| 4 | Pasarela de pago para donaciones | `/donar` → `/donar/pagar/[id]` → `/donar/gracias/[id]` | Modo prueba; nunca se piden datos de tarjeta |
| 5 | Formulario de inscripción de beneficiarios | `/inscripcion/beneficiario` → `/admin/solicitudes` | |
| 6 | Formulario de inscripción de padrinos | `/inscripcion/padrino` → `/admin/voluntarios` | |
| 7 | Página pública de beneficiarios sin apoyo asignado | `/apadrina`, `/apadrina/[id]` | Solo primer nombre, edad y programa |
| 8 | Panel de administrador | `/admin` y sus 16 secciones | |
| 9 | Landing page institucional | `/` | Cifras, programas e historias reales de la base |

---

## Cómo funciona el control de acceso

`src/lib/rbac.ts` es la fuente de verdad del catálogo de permisos y alimenta el
seed. Los permisos viven en la base de datos (tablas `permisos`, `roles`,
`roles_permisos`), y la matriz que se ve en `/admin/usuarios` se lee de ahí, no
del código.

Tres reglas que la implementación respeta:

1. **La autorización corre en el servidor.** `requirePermiso()` (en
   `src/lib/sesion.ts`) se ejecuta al inicio de cada página y de cada server
   action. `src/proxy.ts` solo redirige a `/login` a quien no tiene sesión: es
   conveniencia de navegación, no la barrera de seguridad.
2. **Si un rol no puede leer un bloque, la consulta no se ejecuta.** En el
   expediente, un terapeuta no recibe un bloque oculto con CSS: la consulta a
   `fichaSocioeconomica` sencillamente no corre, así que el ingreso del hogar no
   forma parte del HTML.
3. **El portal del padrino parte del padrino de la sesión.** La consulta exige
   que el padrinazgo le pertenezca, y filtra por `visibleParaPadrino: true`. Un
   id ajeno en la URL devuelve 404.

Cada apertura de expediente y cada cambio escriben en `AuditLog`.

---

## Verificación realizada

`npm run verificar` pasa sin warnings. Además se comprobó contra la aplicación
corriendo (no por inspección del código):

- Las 26 rutas del menú y las 3 subrutas del expediente responden 200 (o 307 en
  las que redirigen por diseño). Ninguna da 404.
- Entrando como **terapeuta**: el expediente muestra la sección clínica y, en
  lugar de la ficha socioeconómica, un bloque de acceso restringido. El ingreso
  familiar, la fuente de ingreso y el nivel de vulnerabilidad **no aparecen en
  el HTML** (verificado sobre la respuesta, no supuesto).
- Un **padrino** que abre `/admin/beneficiarios` acaba en `/sin-acceso`; en su
  portal ve el avance marcado como visible y no la nota interna de trabajo
  social; un id ajeno en `/portal/[id]` devuelve 404.
- El flujo de donación llega al comprobante con su referencia, monto y estado, y
  la transacción queda registrada en `/admin/auditoria` (acción
  `PAGO_APROBADO`). El camino de rechazo también funciona.
- Una inscripción enviada desde el formulario público aparece en
  `/admin/solicitudes`; una inscripción de padrino, en `/admin/voluntarios`.
- Una fecha de nacimiento del 14/03/2018 se muestra como **14/03/2018**, no como
  13/03.
- Los formularios públicos y el registro de avances funcionan **sin
  JavaScript**: las pruebas se hicieron replicando el POST de un navegador sin
  JS habilitado.

---

## Detalles del entorno que conviene recordar

Cinco cosas que no son obvias y que ya están resueltas en el repositorio:

1. **Prisma 7 exige un driver adapter.** `new PrismaClient()` a secas falla;
   ver `src/lib/prisma.ts`. Además la configuración vive en `prisma.config.ts`
   (no en `package.json`) y ahí se declara el seed. En Prisma 7.9 la propiedad
   `url` **ya no va en el bloque `datasource` del schema**: se pasa desde
   `prisma.config.ts`. El generador es `prisma-client` con `output`, y el
   cliente se importa desde `@/generated/prisma/client`.
2. **Next 16 deprecó `middleware.ts`.** El archivo es `src/proxy.ts` y exporta
   un default con la misma firma.
3. **La augmentación de tipos de `next-auth/jwt` no se aplica.** En los
   callbacks `jwt` y `session` hay que estrechar `user` y `token` con un `as`
   explícito (`src/auth.config.ts`).
4. **Fechas sin hora.** PostgreSQL las guarda a medianoche UTC y Guatemala es
   UTC-6, así que formatearlas en zona local las corre al día anterior. Por eso
   `formatFecha()` fuerza `timeZone: "UTC"` para fechas de calendario y
   `formatFechaHora()` usa la zona local para `createdAt`/`updatedAt`. La edad se
   calcula con `getUTCFullYear()`/`getUTCMonth()`/`getUTCDate()`.
5. **Páginas que leen la base pueden prerenderizarse.** Todas las rutas que
   consultan Prisma llevan `export const dynamic = "force-dynamic"`; en la salida
   del build ninguna aparece marcada con `○` salvo `/_not-found`.

En lucide-react los nombres actuales son `CircleCheck`, `CircleAlert`,
`TriangleAlert`, `House`, `ChartLine` (no `CheckCircle2`, `AlertCircle`,
`AlertTriangle`, `Home`, `LineChart`).

---

## Accesibilidad

Se trabajó contra WCAG 2.2 AA:

- Landmarks (`header`, `nav`, `main`, `aside`, `footer`) y jerarquía de
  encabezados sin saltos.
- Enlace de salto al inicio, con destino `<main id="contenido" tabIndex={-1}>`.
- Utilidad `.visually-hidden` que se revela al recibir foco.
- `:focus-visible` con contorno de 3 px; sobre superficies oscuras usa el
  amarillo de marca (`.superficie-oscura`).
- Tablas reales con `<caption>` y `<th scope>`.
- Ningún estado se comunica solo con color: cada chip lleva su icono.
- Los enlaces repetidos («Ver expediente») se desambiguan con texto oculto que
  incluye el nombre.
- Formularios con `<label for>`, `aria-describedby` para las ayudas (colocadas
  **antes** del control, para que el autocompletado no las tape), `aria-invalid`
  y errores anunciados con `role="alert"`.
- Se respeta `prefers-reduced-motion`; los tamaños van en `rem` y los párrafos
  se limitan a ~80 caracteres con `.medida-lectura`.

No se ha hecho una auditoría con lector de pantalla real ni una revisión formal
de contraste con herramienta automatizada.

---

## Qué quedó pendiente

Lista honesta de lo que **no** está implementado:

- **Carga de archivos.** Los documentos se listan y se registran desde la base,
  pero no hay integración con S3 ni Cloudinary: no se pueden subir archivos
  desde la interfaz.
- **Correos transaccionales.** No hay Resend ni SMTP conectado. Las
  inscripciones y los comprobantes no se envían por correo.
- **Edición de la ficha clínica y de la socioeconómica.** Solo los datos
  generales del expediente tienen formulario de edición; el resto se carga por
  seed o directamente en la base.
- **Alta y edición de contenido.** Blog, eventos, historias y campañas son de
  solo lectura en el panel.
- **Gestión de usuarios desde la interfaz.** `/admin/usuarios` muestra las
  cuentas y la matriz de permisos, pero no permite crear, editar ni desactivar
  cuentas todavía.
- **Alta de padrinazgos desde el panel.** La asignación padrino ↔ beneficiario
  se hace por seed o en la base.
- **Exportar el expediente a PDF y generar carné.**
- **Pasarela real.** La implementación es simulada por diseño. Cambiar a Stripe
  o PayPal consiste en sustituir la implementación de la interfaz `Pasarela` en
  `src/lib/pasarela.ts`, sin tocar el resto de la aplicación.
- **Pruebas automatizadas.** La verificación descrita arriba se hizo con scripts
  manuales contra el servidor; no hay suite de tests en el repositorio.
- **Recuperación de contraseña y segundo factor.**

---

## Estructura del proyecto

```
prisma/
  schema.prisma          26 tablas, enums de PostgreSQL
  seed.ts                datos de demostración (ficticios)
src/
  app/
    (publico)/           landing, galería, inscripciones, contacto, donaciones
    admin/               panel con 16 secciones
    portal/              portal del padrino
    login/, inicio/, sin-acceso/
    api/auth/[...nextauth]/
  components/            UI escrita a mano
  lib/
    rbac.ts              catálogo de roles y permisos (fuente de verdad)
    sesion.ts            requirePermiso() y registrarAuditoria()
    prisma.ts            cliente con driver adapter
    pasarela.ts          interfaz Pasarela + implementación simulada
    fechas.ts            formatFecha (UTC) vs formatFechaHora (local)
  auth.ts, auth.config.ts
  proxy.ts               reemplaza a middleware.ts en Next 16
```
