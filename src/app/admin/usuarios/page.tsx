import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, Minus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermiso } from "@/lib/sesion";
import { PERMISOS, ROLES } from "@/lib/rbac";
import { Boton, Chip, Kpi, Tarjeta, TarjetaCabecera } from "@/components/ui";
import {
  Celda,
  EncabezadoPagina,
  Fila,
  FilaVacia,
  Tabla,
} from "@/components/admin/estructura";
import { formatFechaHora } from "@/lib/fechas";
import { FormularioNuevoUsuario } from "./formulario";
import { cambiarEstadoUsuario, crearUsuario } from "./acciones";

export const metadata: Metadata = { title: "Usuarios y roles" };

export const dynamic = "force-dynamic";

const COLUMNAS = [
  "Usuario",
  "Cargo",
  "Roles",
  "Último acceso",
  "Estado",
  "Acciones",
];

export default async function UsuariosPage() {
  const actor = await requirePermiso(PERMISOS.USUARIOS_GESTIONAR);

  const [usuarios, roles, permisos] = await Promise.all([
    prisma.user.findMany({
      orderBy: { nombre: "asc" },
      include: {
        roles: { include: { role: true } },
        beneficiario: { select: { id: true, codigoExpediente: true } },
      },
    }),
    // La matriz se arma con lo que hay en la base, no con un mapa en la interfaz.
    prisma.role.findMany({
      orderBy: { clave: "asc" },
      include: {
        permisos: { select: { permissionId: true } },
        _count: { select: { usuarios: true } },
      },
    }),
    prisma.permission.findMany({ orderBy: [{ modulo: "asc" }, { clave: "asc" }] }),
  ]);

  const concedido = new Set(
    roles.flatMap((rol) => rol.permisos.map((p) => `${rol.id}:${p.permissionId}`)),
  );

  const esAdmin = (usuario: (typeof usuarios)[number]) =>
    usuario.roles.some((ur) => ur.role.clave === ROLES.ADMIN);

  const activos = usuarios.filter((u) => u.activo);
  const adminsActivos = activos.filter(esAdmin).length;

  const opcionesRol = roles.map((rol) => ({
    clave: rol.clave,
    nombre: rol.nombre,
    descripcion: rol.descripcion,
    permisos: rol.permisos.length,
  }));

  return (
    <>
      <EncabezadoPagina
        titulo="Usuarios y roles"
        descripcion="Alta de cuentas y asignación de roles. Los permisos de cada rol están fijados en la base de datos: al elegir un rol se conceden exactamente los de su fila en la matriz."
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <Kpi etiqueta="Cuentas activas" valor={activos.length} />
        <Kpi
          etiqueta="Cuentas desactivadas"
          valor={usuarios.length - activos.length}
        />
        <Kpi etiqueta="Administradores activos" valor={adminsActivos} />
      </div>

      <Tarjeta className="mt-8">
        <TarjetaCabecera
          titulo="Nueva cuenta"
          descripcion="El acceso queda habilitado de inmediato con el correo y la contraseña que definas."
        />
        <div className="p-5">
          <FormularioNuevoUsuario accion={crearUsuario} roles={opcionesRol} />
        </div>
      </Tarjeta>

      <div className="mt-8">
        <h2 className="mb-4 font-heading text-xl font-semibold text-ink">
          Cuentas del sistema
        </h2>
        <Tabla
          caption="Cuentas de usuario del sistema con su rol y último acceso"
          columnas={COLUMNAS}
        >
          {usuarios.length === 0 ? (
            <FilaVacia
              columnas={COLUMNAS.length}
              mensaje="No hay usuarios registrados."
            />
          ) : (
            usuarios.map((usuario) => {
              const esYo = usuario.id === actor.id;
              // Se oculta el botón cuando la acción no puede prosperar; el
              // servidor vuelve a comprobarlo en cambiarEstadoUsuario().
              const ultimoAdmin =
                usuario.activo && esAdmin(usuario) && adminsActivos <= 1;
              const puedeCambiarEstado = !esYo && !ultimoAdmin;

              return (
                <Fila key={usuario.id}>
                  <Celda>
                    <Link
                      href={`/admin/usuarios/${usuario.id}`}
                      className="font-medium text-brand-dark hover:underline"
                    >
                      {usuario.nombre}
                    </Link>
                    <span className="block text-xs text-ink-soft">
                      {usuario.email}
                    </span>
                  </Celda>
                  <Celda>
                    {usuario.beneficiario ? (
                      <Link
                        href={`/admin/beneficiarios/${usuario.beneficiario.id}`}
                        className="text-brand-dark hover:underline"
                      >
                        {usuario.beneficiario.codigoExpediente}
                      </Link>
                    ) : (
                      (usuario.cargo ?? "—")
                    )}
                  </Celda>
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
                  <Celda>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/usuarios/${usuario.id}`}
                        className="text-sm font-semibold text-brand-dark hover:underline"
                      >
                        Editar
                        <span className="visually-hidden">
                          la cuenta de {usuario.nombre}
                        </span>
                      </Link>
                      {puedeCambiarEstado ? (
                        <form action={cambiarEstadoUsuario}>
                          <input type="hidden" name="id" value={usuario.id} />
                          <input
                            type="hidden"
                            name="activar"
                            value={usuario.activo ? "no" : "si"}
                          />
                          <Boton
                            type="submit"
                            variante={usuario.activo ? "contorno" : "suave"}
                            className="px-3 py-1.5 text-xs"
                          >
                            {usuario.activo ? "Desactivar" : "Reactivar"}
                            <span className="visually-hidden">
                              la cuenta de {usuario.nombre}
                            </span>
                          </Boton>
                        </form>
                      ) : (
                        <Chip tono="neutro">
                          {esYo ? "Tu cuenta" : "Único administrador"}
                        </Chip>
                      )}
                    </div>
                  </Celda>
                </Fila>
              );
            })
          )}
        </Tabla>
      </div>

      <section aria-labelledby="matriz-titulo" className="mt-10">
        <Tarjeta className="overflow-hidden">
          <TarjetaCabecera
            id="matriz-titulo"
            titulo="Matriz de roles y permisos"
            descripcion="Cada celda marcada es una fila real de la tabla roles_permisos. Estos permisos son los que evalúa requirePermiso() en el servidor y no se editan desde la interfaz: son el límite de cada rol."
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
                      <span className="mt-0.5 block font-normal normal-case tracking-normal text-ink-soft/80">
                        {rol._count.usuarios}{" "}
                        {rol._count.usuarios === 1 ? "cuenta" : "cuentas"}
                      </span>
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
