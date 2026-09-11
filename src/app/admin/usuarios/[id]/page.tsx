import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS, ROLES } from "@/lib/rbac";
import { Campo, Chip, Tarjeta, TarjetaCabecera, Vacio } from "@/components/ui";
import { EncabezadoPagina } from "@/components/admin/estructura";
import { formatFechaHora } from "@/lib/fechas";
import { FormularioContrasena, FormularioEditarUsuario } from "../formulario";
import { actualizarUsuario, restablecerContrasena } from "../acciones";

export const metadata: Metadata = { title: "Editar cuenta" };

export const dynamic = "force-dynamic";

export default async function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePermiso(PERMISOS.USUARIOS_GESTIONAR);

  const [usuario, roles] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: {
        padrino: { select: { id: true } },
        roles: {
          include: {
            role: {
              include: {
                permisos: { include: { permission: true } },
              },
            },
          },
        },
      },
    }),
    prisma.role.findMany({
      orderBy: { clave: "asc" },
      include: { permisos: { select: { permissionId: true } } },
    }),
  ]);

  if (!usuario) notFound();

  const seleccionados = usuario.roles.map((ur) => ur.role.clave);
  const esPadrino = seleccionados.includes(ROLES.PADRINO);

  // Los permisos efectivos son la unión de los de sus roles: es exactamente lo
  // que el token de sesión llevará y lo que evaluará requirePermiso().
  const efectivos = new Map(
    usuario.roles.flatMap((ur) =>
      ur.role.permisos.map((rp) => [rp.permission.clave, rp.permission]),
    ),
  );
  const porModulo = new Map<string, string[]>();
  for (const permiso of efectivos.values()) {
    const lista = porModulo.get(permiso.modulo) ?? [];
    lista.push(permiso.nombre);
    porModulo.set(permiso.modulo, lista);
  }

  const opcionesRol = roles.map((rol) => ({
    clave: rol.clave,
    nombre: rol.nombre,
    descripcion: rol.descripcion,
    permisos: rol.permisos.length,
  }));

  return (
    <>
      <Link
        href="/admin/usuarios"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver a usuarios
      </Link>

      <EncabezadoPagina
        titulo={usuario.nombre}
        descripcion={`${usuario.email} · último acceso ${formatFechaHora(usuario.ultimoAcceso)}`}
        acciones={
          usuario.activo ? (
            <Chip tono="ok">Cuenta activa</Chip>
          ) : (
            <Chip tono="bad">Cuenta inactiva</Chip>
          )
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <Tarjeta>
            <TarjetaCabecera
              titulo="Datos y roles"
              descripcion="El correo no se puede cambiar: es la credencial de acceso y la referencia de la bitácora."
            />
            <div className="p-5">
              <FormularioEditarUsuario
                accion={actualizarUsuario}
                id={usuario.id}
                nombre={usuario.nombre}
                cargo={usuario.cargo}
                roles={opcionesRol}
                seleccionados={seleccionados}
              />
            </div>
          </Tarjeta>

          <Tarjeta>
            <TarjetaCabecera
              titulo="Contraseña"
              descripcion="No hay recuperación por correo: el restablecimiento lo hace un administrador."
              icono={<KeyRound className="size-5" />}
            />
            <div className="p-5">
              <FormularioContrasena
                accion={restablecerContrasena}
                id={usuario.id}
              />
            </div>
          </Tarjeta>
        </div>

        <aside className="space-y-6">
          <Tarjeta>
            <TarjetaCabecera
              titulo="Límites de esta cuenta"
              descripcion="Unión de los permisos de sus roles. Es lo que evalúa el servidor."
              icono={<ShieldCheck className="size-5" />}
            />
            {efectivos.size === 0 ? (
              <Vacio mensaje="Sin roles asignados: la cuenta no puede abrir ninguna sección." />
            ) : (
              <div className="space-y-5 p-5">
                {[...porModulo.entries()].map(([modulo, nombres]) => (
                  <div key={modulo}>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                      {modulo}
                    </h3>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {nombres.map((nombre) => (
                        <li key={nombre}>
                          <Chip tono="neutro">{nombre}</Chip>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Tarjeta>

          <Tarjeta>
            <TarjetaCabecera titulo="Portal del padrino" />
            <dl className="grid gap-5 p-5">
              <Campo etiqueta="Rol de padrino">
                {esPadrino ? "Asignado" : "No asignado"}
              </Campo>
              <Campo etiqueta="Ficha de padrino">
                {usuario.padrino ? (
                  <Chip tono="ok">Enlazada</Chip>
                ) : (
                  <Chip tono="neutro">Sin ficha</Chip>
                )}
              </Campo>
            </dl>
            <p className="medida-lectura border-t border-line px-5 py-4 text-xs text-ink-soft">
              El portal parte de la ficha de padrino, no del rol. Al conceder el
              rol se enlaza la ficha del mismo correo o se crea una nueva; al
              retirarlo se desenlaza sin borrar padrinazgos ni donaciones.
            </p>
          </Tarjeta>
        </aside>
      </div>
    </>
  );
}
