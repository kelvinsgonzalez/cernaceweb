# Despliegue en Oracle Cloud (gratis) con el dominio cernace.org

Todo lo que hace falta ya está en el repositorio:

| Archivo | Para qué |
| --- | --- |
| `Dockerfile` | Imagen de producción (Node 24, `prisma generate`, `next build`) |
| `despliegue/docker-compose.yml` | Postgres 16 + la app + Caddy (HTTPS automático) |
| `despliegue/Caddyfile` | Proxy inverso y certificado de Let's Encrypt |
| `despliegue/entrypoint.sh` | Al arrancar: migraciones, sincronizar permisos, `npm start` |
| `despliegue/.env.ejemplo` | Las tres variables que hay que rellenar en el servidor |
| `prisma/crear-admin.ts` | Primera cuenta de administrador (`npm run db:admin`) |

El orden recomendado: **1) servidor → 2) probar por IP → 3) dominio → 4) DNS y
HTTPS**. Así el dominio se compra cuando ya hay algo funcionando.

---

## 1. Servidor en Oracle Cloud

### 1.1 Cuenta

1. <https://www.oracle.com/cloud/free/> → *Start for free*.
2. Piden una tarjeta de crédito/débito internacional para verificar la
   identidad; hacen un cargo temporal (≈ 1 USD) que devuelven. Con el nivel
   *Always Free* no cobran nada mientras no se cambie el plan.
3. **La región de origen no se puede cambiar después.** Para Guatemala lo
   razonable es *US East (Ashburn)* o *US West (Phoenix)*, pero las regiones
   populares suelen estar sin capacidad ARM. Si tras varios intentos no hay,
   *São Paulo* o *Querétaro* también sirven.

### 1.2 Crear la máquina

*Compute → Instances → Create instance.*

| Campo | Valor |
| --- | --- |
| Image | **Ubuntu 24.04** (Canonical Ubuntu, no la de Oracle Linux) |
| Shape | **VM.Standard.A1.Flex** (Ampere, ARM) con **2 OCPU y 12 GB** de RAM |
| Networking | Dejar que cree una VCN nueva y **asignar IP pública** |
| SSH keys | Generar un par nuevo y **descargar la clave privada** (o pegar tu `~/.ssh/id_ed25519.pub`) |
| Boot volume | 50 GB es más que suficiente |

Notas:

- El nivel gratuito permite hasta 4 OCPU y 24 GB de ARM en total. 2/12 deja
  margen para una segunda máquina si un día hace falta.
- **No usar la VM.Standard.E2.1.Micro (AMD, 1 GB de RAM):** `next build` se
  queda sin memoria ahí.
- Si sale *"Out of host capacity"*: cambia el *Availability Domain* (AD-1, AD-2,
  AD-3) y reintenta; suele haber capacidad de madrugada. Si no hay manera,
  pasar la cuenta a *Pay As You Go* (Upgrade) mantiene los recursos Always Free
  gratis y da prioridad de capacidad; solo cobran si se crea algo fuera del
  nivel gratuito.

Cuando arranque, anota la **IP pública**.

### 1.3 Abrir los puertos 80 y 443 (dos sitios distintos)

Oracle tiene dos cortafuegos y hay que abrir los dos.

**a) En la consola web** — *Networking → Virtual Cloud Networks → tu VCN →
Security Lists → Default Security List → Add Ingress Rules*:

| Source CIDR | Protocol | Destination port |
| --- | --- | --- |
| `0.0.0.0/0` | TCP | 80 |
| `0.0.0.0/0` | TCP | 443 |
| `0.0.0.0/0` | UDP | 443 (HTTP/3, opcional) |

**b) Dentro de la máquina** — la imagen de Ubuntu de Oracle trae reglas de
`iptables` que rechazan todo salvo SSH:

```bash
ssh -i clave-privada.key ubuntu@IP_PUBLICA

sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p udp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

### 1.4 Instalar Docker

```bash
sudo apt-get update && sudo apt-get upgrade -y
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
exit   # y volver a entrar para que el grupo aplique
```

---

## 2. Subir la aplicación y probar por IP

```bash
git clone https://github.com/kelvinsgonzalez/cernaceweb.git
cd cernaceweb/despliegue
cp .env.ejemplo .env
nano .env
```

En `.env`:

```env
# Mientras no haya dominio, sslip.io da un nombre válido para la IP.
# Con IP 129.146.10.20 sería:
DOMINIO=129-146-10-20.sslip.io
POSTGRES_PASSWORD=<openssl rand -hex 24>
AUTH_SECRET=<openssl rand -base64 32>
```

Levantar todo:

```bash
docker compose up -d --build     # la primera vez tarda unos minutos
docker compose logs -f app       # esperar a ver "Ready" y Ctrl+C
```

Ya se puede abrir `https://129-146-10-20.sslip.io` (con tu IP). Caddy pide el
certificado solo; si no lo consigue, `docker compose logs caddy` dice por qué
(casi siempre: puertos cerrados en 1.3).

### 2.1 Datos iniciales: elegir uno de los dos caminos

**A) Empezar vacío** (lo correcto para uso real):

```bash
docker compose exec \
  -e ADMIN_EMAIL=admin@cernace.org \
  -e ADMIN_NOMBRE="Nombre Apellido" \
  -e ADMIN_PASSWORD='una-contraseña-larga' \
  app npm run db:admin
```

La portada lee misión, programas e historias de la base, así que saldrá vacía
hasta que se carguen desde `/admin`.

**B) Cargar los datos de demostración** (para enseñar el proyecto):

```bash
docker compose exec app npx tsx prisma/seed.ts
```

Cuentas y contraseña `cernace2026` como en el README. **Cambiarlas en
`/admin/usuarios` en cuanto el sitio sea público:** el seed es público en
GitHub.

---

## 3. Comprar cernace.org

A fecha 26/09/2026 **cernace.org está libre** (WHOIS: *Domain not found*).

Recomendación: **Cloudflare Registrar** (<https://dash.cloudflare.com> →
*Domain Registration → Register domains*). Cobra el precio de coste del
registro (.org ≈ 10–11 USD/año, sin subida al renovar), incluye privacidad
WHOIS y deja el DNS ya configurado en el mismo panel. Porkbun y Namecheap son
alternativas equivalentes; en Namecheap el primer año sale más barato pero la
renovación sube.

Conviene registrarlo por 2 años o activar la renovación automática: si caduca,
el correo `@cernace.org` y la web caen a la vez.

---

## 4. Apuntar el dominio al servidor y activar HTTPS

### 4.1 Registros DNS (en Cloudflare, *DNS → Records*)

| Tipo | Nombre | Contenido | Proxy |
| --- | --- | --- | --- |
| A | `@` | IP pública de Oracle | **DNS only** (nube gris) |
| A | `www` | IP pública de Oracle | **DNS only** |

Dejarlo en *DNS only* al principio: así Caddy obtiene el certificado
directamente de Let's Encrypt. Cuando ya funcione se puede encender el proxy
naranja (protección DDoS, caché) poniendo en Cloudflare *SSL/TLS → Full
(strict)*.

### 4.2 Cambiar el dominio en el servidor

```bash
cd ~/cernaceweb/despliegue
sed -i 's/^DOMINIO=.*/DOMINIO=cernace.org/' .env
docker compose up -d --force-recreate caddy
docker compose logs -f caddy      # "certificate obtained successfully"
```

`https://cernace.org` y `https://www.cernace.org` (que redirige) ya funcionan.
El DNS tarda entre minutos y un par de horas en propagarse.

---

## 5. Operación del día a día

**Actualizar la web** tras un `git push`:

```bash
cd ~/cernaceweb && git pull && cd despliegue && docker compose up -d --build app
```

El arranque aplica las migraciones nuevas y sincroniza permisos solo.

**Copia de seguridad** (base + archivos subidos) — conviene ponerlo en un
`cron` diario y sacar el resultado del servidor:

```bash
cd ~/cernaceweb/despliegue
docker compose exec -T db pg_dump -U cernace cernace | gzip > ~/backup-$(date +%F).sql.gz
docker run --rm -v despliegue_almacenamiento:/d -v ~:/salida alpine \
  tar czf /salida/almacenamiento-$(date +%F).tgz -C /d .
```

Restaurar la base: `gunzip -c backup.sql.gz | docker compose exec -T db psql -U cernace cernace`.

**Ver qué pasa:** `docker compose ps`, `docker compose logs -f app`.

**Espacio en disco:** `docker system prune -f` de vez en cuando limpia
imágenes viejas de builds anteriores.

---

## 6. Antes de dar la dirección al público

- [ ] Contraseñas de demostración cambiadas (o base vacía + admin propio).
- [ ] `AUTH_SECRET` y `POSTGRES_PASSWORD` generados, no los del ejemplo.
- [ ] Primera copia de seguridad hecha y probada.
- [ ] Renovación automática del dominio activada.
- [ ] Correo de contacto real en `/admin` (el que muestra la web).

---

## 7. Variante: servir desde tu propia Mac con un túnel de Cloudflare

Sin VPS: el dominio (comprado en Namecheap el 26/09/2026) entra por Cloudflare
y un túnel lo conecta con la app corriendo en tu computadora. No hay que abrir
puertos ni tener IP fija, y el HTTPS lo pone Cloudflare. A cambio, la web solo
está viva mientras la Mac esté encendida y con internet.

### 7.1 DNS a Cloudflare (una sola vez)

1. Cuenta gratuita en <https://dash.cloudflare.com> → *Add a domain* →
   `cernace.org` → plan **Free**. Al final muestra **dos nameservers**
   (`xxx.ns.cloudflare.com`).
2. En Namecheap, pestaña *Domain* → **Nameservers** → cambiar *Namecheap
   BasicDNS* por **Custom DNS** → pegar los dos nameservers → ✓ guardar.
3. En *Redirect Domain* borrar la regla `cernace.org → http://www.cernace.org/`:
   con el DNS en Cloudflare ya no aplica y solo confunde.
4. Esperar el correo *"cernace.org is now active on Cloudflare"* (minutos, a
   veces horas). En Cloudflare, *SSL/TLS → Overview* dejar **Full**.

### 7.2 Crear el túnel con nombre

El túnel actual (`cloudflared tunnel --url http://localhost:3100`) es un túnel
rápido con dirección aleatoria; hay que sustituirlo por uno con nombre.

1. Cloudflare → **Zero Trust** → *Networks → Tunnels → Create a tunnel* →
   *Cloudflared* → nombre `cernace-mac`.
2. En *Install connector* elegir **macOS** y copiar el comando; es de la forma:

   ```bash
   sudo cloudflared service install eyJhIjoi...   # el token es largo
   ```

   Ejecutarlo en la terminal: deja `cloudflared` como servicio de `launchd`,
   que arranca solo al encender la Mac. Antes, cerrar el túnel rápido
   (`Ctrl+C` en su terminal o `pkill cloudflared`).
3. Pestaña *Public Hostname* → *Add a public hostname*:

   | Subdomain | Domain | Type | URL |
   | --- | --- | --- | --- |
   | *(vacío)* | cernace.org | HTTP | `localhost:3200` |
   | www | cernace.org | HTTP | `localhost:3200` |

   Cloudflare crea los registros DNS (CNAME al túnel) por ti.

### 7.3 La app en modo producción

```bash
cd ~/ProyectosWEB/webapehue/cernaceweb
# .env: DATABASE_URL apuntando al Postgres local (docker :5435) y AUTH_TRUST_HOST=true
npm run build
PORT=3200 npm start   # el 3000 ya lo ocupan otros proyectos en esta Mac
```

`https://cernace.org` ya responde. Para que sobreviva a reinicios, lo más
simple es dejar `npm start` corriendo en una sesión de `tmux` o crear un
`launchd` como el de cloudflared. Y desactivar la suspensión de la Mac
(*Ajustes → Batería / Pantalla y energía*), o `caffeinate -s npm start`.

### 7.4 Mudarse al VPS más adelante

Los archivos y la base se mueven con las copias de la sección 5. En el túnel
basta cambiar el destino del hostname (o instalar el conector en el VPS con el
mismo token) sin tocar nada del DNS ni de Namecheap.
