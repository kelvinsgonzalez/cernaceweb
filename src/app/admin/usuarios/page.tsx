import type { Metadata } from "next";
import { CircleCheck, Minus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS } from "@/lib/rbac";
import { Chip, Tarjeta, TarjetaCabecera } from "@/components/ui";
import {
  Celda,
  EncabezadoPagina,
  Fila,
  FilaVacia,
  Tabla,
} from "@/components/admin/estructura";
import { formatFechaHora } from "@/lib/fechas";

export const metadata: Metadata = { title: "Usuarios y roles" };

export const dynamic = "force-dynamic";

const COLUMNAS = ["Usuario", "Cargo", "Roles", "Último acceso", "Estado"];

export default async function UsuariosPage() {
  await requirePermiso(PERMISOS.USUARIOS_GESTIONAR);

  const [usuarios, roles, permisos] = await Promise.all([
    prisma.user.findMany({
      orderBy: { nombre: "asc" },
      include: { roles: { include: { role: true } } },
    }),
    // La matriz se lee de la base: es la evidencia de que el control de
    // acceso existe de verdad y no está codificado en la interfaz.
    prisma.role.findMany({
      orderBy: { clave: "asc" },
      include: { permisos: { select: { permissionId: true } } },
    }),
    prisma.permission.findMany({ orderBy: [{ modulo: "asc" }, { clave: "asc" }] }),
  ]);

  const concedido = new Set(
    roles.flatMap((rol) => rol.permisos.map((p) => `${rol.id}:${p.permissionId}`)),
  );

  return (
    <>
      <EncabezadoPagina
        titulo="Usuarios y roles"
        descripcion="Cuentas del sistema y la matriz de permisos vigente, leída directamente de la base de datos."
      />

      <Tabla caption="Cuentas de usuario del sistema con su rol y último acceso" columnas={COLUMNAS}>
        {usuarios.length === 0 ? (
          <FilaVacia columnas={COLUMNAS.length} mensaje="No hay usuarios registrados." />
        ) : (
          usuarios.map((usuario) => (
            <Fila key={usuario.id}>
              <Celda>
                <span className="font-medium">{usuario.nombre}</span>
                <span className="block text-xs text-ink-soft">{usuario.email}</span>
              </Celda>
              <Celda>{usuario.cargo ?? "—"}</Celda>
              <Celda>
                <ul className="flex flex-wrap gap-1.5">
                  {usuario.roles.map((ur) => (
                    <li key={ur.roleId}>
                      <Chip tono="info">{ur.role.nombre}</Chip>
                    </li>
                  ))}
                </ul>
              </Celda>
              <Celda className="whitespace-nowrap">
                {formatFechaHora(usuario.ultimoAcceso)}
              </Celda>
              <Celda>
                {usuario.activo ? (
                  <Chip tono="ok">Activa</Chip>
                ) : (
                  <Chip tono="bad">Inactiva</Chip>
                )}
              </Celda>
            </Fila>
          ))
        )}
      </Tabla>

      <section aria-labelledby="matriz-titulo" className="mt-10">
        <Tarjeta className="overflow-hidden">
          <TarjetaCabecera
            id="matriz-titulo"
            titulo="Matriz de roles y permisos"
            descripcion="Cada celda marcada es una fila real de la tabla roles_permisos. Estos permisos son los que evalúa requirePermiso() en el servidor."
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <caption className="visually-hidden">
                Permisos concedidos a cada rol del sistema
              </caption>
              <thead className="border-b border-line bg-canvas">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-soft"
                  >
                    Permiso
                  </th>
                  {roles.map((rol) => (
                    <th
                      key={rol.id}
                      scope="col"
                      className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-ink-soft"
                    >
                      {rol.nombre}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {permisos.map((permiso) => (
                  <tr key={permiso.id} className="hover:bg-canvas">
                    <th scope="row" className="px-4 py-3 text-left font-normal">
                      <span className="block font-medium text-ink">{permiso.nombre}</span>
                      <span className="block font-mono text-xs text-ink-soft">
                        {permiso.clave}
                      </span>
                    </th>
                    {roles.map((rol) => {
                      const tiene = concedido.has(`${rol.id}:${permiso.id}`);
                      return (
                        <td key={rol.id} className="px-4 py-3 text-center">
                          {tiene ? (
                            <>
                              <CircleCheck
                                aria-hidden="true"
                                className="mx-auto size-5 text-ok-fg"
                              />
                              <span className="visually-hidden">
                                {rol.nombre} sí tiene el permiso {permiso.nombre}
                              </span>
                            </>
                          ) : (
                            <>
                              <Minus
                                aria-hidden="true"
                                className="mx-auto size-5 text-ink-soft/50"
                              />
                              <span className="visually-hidden">
                                {rol.nombre} no tiene el permiso {permiso.nombre}
                              </span>
                            </>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tarjeta>
      </section>
    </>
  );
}
