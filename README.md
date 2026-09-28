# glenysnutri.com — Sitio de la Dra. Glenys Nina Cuevas

Sitio estático (Next.js, exportado) publicado en **GitHub Pages**. Los datos viven en **Supabase**
(proyecto WandyWiseHealthSystems):

| Qué | Dónde |
|---|---|
| Artículos, comentarios, likes, suscriptoras, Instagram, usuarios del panel | tablas `public.glenys_*` (cerradas al público) |
| Imágenes subidas desde el panel | bucket público `glenys-media` |
| API del sitio y del panel | Edge Function `glenys-api` (código de referencia en `supabase/functions/glenys-api`) |

## Trabajar en el sitio

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # genera la carpeta out/
```

## Publicación

Cada `push` a `main` publica automáticamente (GitHub Actions → Pages). Además se reconstruye cada hora
para que los artículos nuevos tengan su propia página con título y vista previa para WhatsApp; mientras tanto
se muestran igual desde la página de respaldo (404).

## Panel `/admin`

Acceso con un código de 6 dígitos que llega al correo del usuario autorizado (Microsoft 365, secretos `MS_*`)
o, si el correo no está disponible, por SMS al celular registrado. Los usuarios se agregan desde el panel
(pestaña **Usuarios**, solo administradores).
