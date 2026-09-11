# Fotografías de beneficiarios

Estas imágenes se muestran en la galería pública (`/apadrina`), en el perfil
individual y en la portada. Son fotografías reales de beneficiarios de CERNACE.

## Requisitos antes de publicar una fotografía

- Consentimiento firmado del encargado legal para uso público de la imagen.
- La galería solo expone primer nombre, edad y programa. Una fotografía
  identifica al menor mucho más que ese texto: trátala con el mismo criterio que
  el resto del expediente.
- Un beneficiario sin `fotoUrl` se muestra con su inicial, así que dejarlo en
  blanco siempre es una opción válida.

## Cómo añadir o reemplazar

1. Guarda el archivo en esta carpeta. Nombres en minúsculas y sin espacios: un
   espacio inicial rompe la URL de la imagen.
2. Apunta `beneficiarios.fotoUrl` a la ruta pública, por ejemplo
   `/beneficiarios/kevin.jpg`.

## Encuadre

Los marcos están ajustados a **retrato vertical** (3:4 en las tarjetas, círculo
en el perfil), con el recorte anclado arriba para no cortar la cara. Una
fotografía apaisada se recortará por los lados; si solo tienes apaisadas,
conviene recortarlas a vertical antes de subirlas.

`next/image` genera las versiones optimizadas, así que no hace falta reducir el
archivo a mano.

Las historias usan el mismo esquema en `public/historias/` con
`historias.imagenUrl`, y el carrusel de la portada en `public/carrusel/`. El
carrusel sí admite orientaciones mixtas: encaja las fotos completas en un marco
4:3 sin recortarlas.
