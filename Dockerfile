# Imagen de producción de la web de CERNACE.
#
# Se usa Debian (glibc) y no Alpine porque los binarios de Prisma para
# arm64 —la arquitectura de las máquinas Ampere gratuitas de Oracle— están
# mejor soportados ahí. `node:24` coincide con la versión con la que se
# desarrolla.

FROM node:24-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# --- Dependencias y build ----------------------------------------------------
FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# El cliente Prisma se genera en src/generated (no está en git) y el build lo
# necesita. Se pasa una DATABASE_URL vacía: generate no se conecta a nada.
ENV DATABASE_URL=""
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- Imagen final ------------------------------------------------------------
# Se conservan node_modules completos (no solo los de producción) porque el
# arranque ejecuta `prisma migrate deploy` y los scripts de prisma/ con tsx.
FROM base AS runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV ALMACENAMIENTO_DIR=/datos/almacenamiento
COPY --from=build /app /app
RUN mkdir -p /datos/almacenamiento && chown -R node:node /datos /app
USER node
EXPOSE 3000
ENTRYPOINT ["/app/despliegue/entrypoint.sh"]
