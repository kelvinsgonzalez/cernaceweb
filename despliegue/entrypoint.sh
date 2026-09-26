#!/bin/sh
# Arranque del contenedor: aplica las migraciones pendientes, reconcilia el
# catálogo de permisos con src/lib/rbac.ts y levanta Next.
set -e
cd /app
echo "· Aplicando migraciones"
npx prisma migrate deploy
echo "· Sincronizando roles y permisos"
npx tsx prisma/sincronizar-acceso.ts
echo "· Iniciando la aplicación"
exec npm start
