// Conexión con la API del sitio (Supabase Edge Function glenys-api) y con las imágenes (Supabase Storage).
const SUPABASE_URL = "https://okrfxnhwpdkumaqovfrs.supabase.co";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? `${SUPABASE_URL}/functions/v1/glenys-api`;

/** Ruta de la API: api("/public/posts") → https://…/glenys-api/public/posts */
export const api = (path: string) => `${API_BASE}${path}`;

/** URL pública de una imagen subida desde el panel. */
export const mediaUrl = (key: string) =>
  `${SUPABASE_URL}/storage/v1/object/public/glenys-media/${key.split("/").map(encodeURIComponent).join("/")}`;

export const SITE_URL = "https://glenysnutri.com";

export const WHATSAPP_URL =
  "https://wa.me/18295980131?text=Hola%20Dra.%20Glenys%2C%20deseo%20informaci%C3%B3n%20sobre%20una%20consulta.";
