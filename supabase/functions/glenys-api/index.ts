// =====================================================================
// glenys-api — API del sitio glenysnutri.com (Dra. Glenys Nina Cuevas)
// Datos en las tablas public.glenys_* (cerradas al público; solo esta función las usa con la clave de servicio).
// Imágenes en el bucket público `glenys-media`.
//
// Rutas (después de /functions/v1/glenys-api):
//   GET  /public/posts[?slug=]   GET /public/instagram   GET /public/gallery
//   GET  /engagement?post=       POST /engagement {type: like|comment}
//   POST /subscribe              GET  /unsubscribe?t=
//   POST /auth/solicitar {email} POST /auth/verificar {email, codigo}
//   /admin/session|overview|posts|comments|instagram|media|subscribers|users  (Bearer token)
// =====================================================================
import { createClient } from "npm:@supabase/supabase-js@2";
import { enviarCorreo, correoConfigurado, correoCodigo, verifyEnviar, verifyComprobar } from "./avisos.ts";

// Acceso por la API REST con la clave de servicio (las tablas glenys_* están cerradas para el público).
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});
const storage = db.storage.from("glenys-media");
const T = (t: string) => db.from(`glenys_${t}`);
// deno-lint-ignore no-explicit-any
function ok<X>(r: { data: X; error: any }): NonNullable<X> {
  if (r.error) throw r.error;
  return r.data as NonNullable<X>; // puede ser null en maybeSingle(): se comprueba donde importa
}
// deno-lint-ignore no-explicit-any
async function contar(q: any): Promise<number> {
  const r = await q;
  if (r.error) throw r.error;
  return r.count ?? 0;
}
const haceUnaHora = () => new Date(Date.now() - 3600_000).toISOString();

const ORIGENES = [
  "https://glenysnutri.com", "https://www.glenysnutri.com", "https://wandy256.github.io",
  "http://localhost:3000", "http://localhost:8766",
];
const cors = (req: Request) => {
  const o = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ORIGENES.includes(o) ? o : ORIGENES[0],
    "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Vary": "Origin",
  };
};

class Aviso extends Error { status: number; constructor(m: string, s = 400) { super(m); this.status = s; } }
type Role = "admin" | "editor";
type Usuario = { email: string; name: string; role: Role };

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const ipDe = (req: Request) => (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "desconocida";
const slugify = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);
const ts = (d: unknown) => (typeof d === "string" ? d.replace("T", " ").slice(0, 19) : null);
const IG_RE = /^https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?(?:\?.*)?$/;

// ---------------------------------------------------------------- sesión
let secretoCache: CryptoKey | null = null;
async function secreto(): Promise<CryptoKey> {
  if (secretoCache) return secretoCache;
  const r = ok(await T("config").select("valor").eq("clave", "session_secret").single());
  secretoCache = await crypto.subtle.importKey("raw", new TextEncoder().encode(r.valor),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  return secretoCache;
}
const b64u = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const deB64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
async function firmar(email: string) {
  const payload = b64u(new TextEncoder().encode(JSON.stringify({ e: email, x: Date.now() + 12 * 3600_000 })));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await secreto(), new TextEncoder().encode(payload)));
  return `${payload}.${b64u(sig)}`;
}
async function emailDeToken(req: Request): Promise<string | null> {
  const t = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const [p, s] = t.split(".");
  if (!p || !s) return null;
  try {
    const valido = await crypto.subtle.verify("HMAC", await secreto(), deB64u(s), new TextEncoder().encode(p));
    if (!valido) return null;
    const d = JSON.parse(new TextDecoder().decode(deB64u(p)));
    return d.x > Date.now() ? String(d.e) : null;
  } catch { return null; }
}
async function sha256(s: string) {
  const h = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
  return Array.from(h, (b) => b.toString(16).padStart(2, "0")).join("");
}
async function usuarioActivo(email: string) {
  return ok(await T("users").select("display_name, role, telefono").eq("email", email).eq("active", true).maybeSingle());
}
async function requireRole(req: Request, adminOnly = false): Promise<Usuario> {
  const email = await emailDeToken(req);
  if (!email) throw new Aviso("Tu sesión venció. Entra de nuevo.", 401);
  const u = await usuarioActivo(email);
  if (!u) throw new Aviso("Acceso no autorizado", 403);
  if (adminOnly && u.role !== "admin") throw new Aviso("Esta acción requiere permisos de administrador", 403);
  return { email, name: u.display_name || email, role: u.role };
}

// ---------------------------------------------------------------- acceso por código
const VERIFY = "twilio-verify";
async function verifySid(): Promise<string> {
  const r = ok(await db.from("configuracion").select("valor").eq("clave", "twilio_verify_sid").maybeSingle());
  if (!r?.valor) throw new Aviso("El envío de códigos por SMS no está configurado.", 503);
  return r.valor;
}
async function solicitarCodigo(body: Record<string, unknown>, ip: string) {
  const email = clean(body.email, 180).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Aviso("Escribe un correo válido");
  const porIp = await contar(T("login_codes").select("id", { count: "exact", head: true }).eq("ip", ip).gte("created_at", haceUnaHora()));
  if (porIp >= 10) throw new Aviso("Demasiados intentos. Espera un rato.", 429);
  const u = await usuarioActivo(email);
  // Respuesta neutra si el correo no está autorizado (no revelamos quién tiene acceso).
  if (!u) return { ok: true, canal: "correo", mensaje: "Si el correo tiene acceso, recibirás un código en unos segundos." };
  const porEmail = await contar(T("login_codes").select("id", { count: "exact", head: true }).eq("email", email).gte("created_at", haceUnaHora()));
  if (porEmail >= 5) throw new Aviso("Pediste demasiados códigos. Intenta en una hora.", 429);
  const codigo = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
  const fila = ok(await T("login_codes").insert({
    email, code_hash: await sha256(email + ":" + codigo), expires_at: new Date(Date.now() + 10 * 60_000).toISOString(), ip,
  }).select("id").single());
  if (correoConfigurado()) {
    const r = await enviarCorreo(email, `Tu código de acceso: ${codigo}`, correoCodigo(u.display_name, codigo));
    if (r === "ok") return { ok: true, canal: "correo", mensaje: "Te enviamos un código a tu correo." };
    console.error("correo:", r);
  }
  if (u.telefono) {
    // SMS con Twilio Verify (mismo servicio que el portal de pagos; entrega fiable a EE. UU. y RD).
    const r = await verifyEnviar(await verifySid(), u.telefono);
    if (r === "ok") {
      ok(await T("login_codes").update({ code_hash: VERIFY }).eq("id", fila.id));
      return { ok: true, canal: "sms", mensaje: `Te enviamos el código por SMS al número terminado en ${String(u.telefono).slice(-4)}.` };
    }
    console.error("sms:", r);
  }
  await T("login_codes").delete().eq("id", fila.id); // no dejar vivo un código que nadie recibió
  throw new Aviso("No pudimos enviar el código en este momento. Avísale a tu administrador.", 503);
}

async function verificarCodigo(body: Record<string, unknown>) {
  const email = clean(body.email, 180).toLowerCase();
  const codigo = String(body.codigo ?? "").replace(/\D/g, "");
  if (!email || codigo.length !== 6) throw new Aviso("Escribe el código de 6 dígitos.");
  const c = ok(await T("login_codes").select("id, code_hash, attempts").eq("email", email).eq("used", false)
    .gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(1).maybeSingle());
  if (!c) throw new Aviso("El código venció. Pide uno nuevo.");
  if (c.attempts >= 5) throw new Aviso("Demasiados intentos. Pide un código nuevo.", 429);
  let valido: boolean;
  if (c.code_hash === VERIFY) {
    const u0 = await usuarioActivo(email);
    valido = !!u0?.telefono && (await verifyComprobar(await verifySid(), u0.telefono, codigo)) === "ok";
  } else {
    valido = c.code_hash === await sha256(email + ":" + codigo);
  }
  if (!valido) {
    ok(await T("login_codes").update({ attempts: c.attempts + 1 }).eq("id", c.id));
    throw new Aviso("El código no es correcto.");
  }
  ok(await T("login_codes").update({ used: true }).eq("id", c.id));
  const u = await usuarioActivo(email);
  if (!u) throw new Aviso("Acceso no autorizado", 403);
  return { ok: true, token: await firmar(email), user: { email, name: u.display_name || email, role: u.role } };
}

// ---------------------------------------------------------------- público
const POST_PUBLICO = "id, slug, title, excerpt, category, coverKey:cover_key, publishedAt:published_at";
const POST_COMPLETO = "id, slug, title, excerpt, content, category, coverKey:cover_key, publishedAt:published_at";
async function publicPosts(url: URL) {
  const slug = clean(url.searchParams.get("slug"), 100);
  if (slug) {
    const p = ok(await T("posts").select(POST_COMPLETO).eq("slug", slug).eq("status", "published").maybeSingle());
    if (!p) throw new Aviso("Artículo no encontrado", 404);
    return { post: { ...p, publishedAt: ts(p.publishedAt) } };
  }
  const rows = ok(await T("posts").select(POST_PUBLICO).eq("status", "published")
    .order("published_at", { ascending: false }).order("id", { ascending: false }).limit(24));
  return { posts: rows.map((p) => ({ ...p, publishedAt: ts(p.publishedAt) })) };
}
const publicInstagram = async () => ({
  posts: ok(await T("instagram_posts").select("id, url, title, label, mediaKey:media_key").eq("active", true).eq("source", "manual")
    .order("sort_order", { ascending: true }).order("id", { ascending: false }).limit(20)),
});
const publicGallery = async () => ({
  images: ok(await T("media").select("id, objectKey:object_key, title, altText:alt_text").eq("active", true).eq("purpose", "gallery")
    .order("id", { ascending: false }).limit(30)),
});

async function postPublicado(slug: string) {
  const p = ok(await T("posts").select("id").eq("slug", slug).eq("status", "published").maybeSingle());
  if (!p) throw new Aviso("Publicación no válida");
}
const likesDe = (slug: string) => contar(T("post_likes").select("id", { count: "exact", head: true }).eq("post_slug", slug));

async function engagement(req: Request, url: URL, ip: string) {
  if (req.method === "GET") {
    const slug = clean(url.searchParams.get("post"), 100);
    await postPublicado(slug);
    const comments = ok(await T("comments").select("id, author, message, createdAt:created_at").eq("post_slug", slug)
      .eq("status", "approved").order("id", { ascending: false }).limit(20));
    return { likes: await likesDe(slug), comments: comments.map((c) => ({ ...c, createdAt: ts(c.createdAt) })) };
  }
  const body = await req.json();
  const slug = clean(body.postSlug, 100);
  await postPublicado(slug);
  if (body.type === "like") {
    const visitor = clean(body.visitorId, 80);
    if (!visitor) throw new Aviso("Identificador requerido");
    ok(await T("post_likes").upsert({ post_slug: slug, visitor_id: visitor }, { onConflict: "post_slug,visitor_id", ignoreDuplicates: true }));
    return { likes: await likesDe(slug) };
  }
  if (body.type === "comment") {
    if (body.website) return { message: "Comentario enviado para revisión" }; // trampa anti-spam
    const author = clean(body.author, 60), message = clean(body.message, 500);
    if (author.length < 2 || message.length < 3) throw new Aviso("Completa tu nombre y comentario");
    const n = await contar(T("comments").select("id", { count: "exact", head: true }).eq("ip", ip).gte("created_at", haceUnaHora()));
    if (n >= 5) throw new Aviso("Recibimos varios comentarios tuyos. Intenta más tarde.", 429);
    ok(await T("comments").insert({ post_slug: slug, author, message, status: "pending", ip }));
    return { message: "Comentario enviado para revisión" };
  }
  throw new Aviso("Acción no válida");
}

async function subscribe(req: Request, ip: string) {
  const body = await req.json();
  const gracias = { message: "¡Gracias! Ya formas parte de la comunidad." };
  if (body.website) return gracias;
  const email = clean(body.email, 160).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Aviso("Escribe un correo electrónico válido");
  const n = await contar(T("subscribers").select("id", { count: "exact", head: true }).eq("ip", ip).gte("created_at", haceUnaHora()));
  if (n >= 5) throw new Aviso("Demasiados intentos. Intenta más tarde.", 429);
  const previo = ok(await T("subscribers").select("id, status").eq("email", email).maybeSingle());
  if (!previo) ok(await T("subscribers").insert({ email, ip }));
  else if (previo.status === "unsubscribed") ok(await T("subscribers").update({ status: "active" }).eq("id", previo.id));
  return gracias;
}

// ---------------------------------------------------------------- panel
async function adminOverview(u: Usuario) {
  const cuenta = (t: string, f?: [string, unknown]) => {
    let q = T(t).select("id", { count: "exact", head: true });
    if (f) q = q.eq(f[0], f[1]);
    return contar(q);
  };
  const [posts, published, pendingComments, subscribers, media] = await Promise.all([
    cuenta("posts"), cuenta("posts", ["status", "published"]), cuenta("comments", ["status", "pending"]),
    cuenta("subscribers", ["status", "active"]), cuenta("media"),
  ]);
  return { user: u, counts: { posts, published, pendingComments, subscribers, media } };
}

async function adminPosts(req: Request, u: Usuario) {
  if (req.method === "GET") {
    const rows = ok(await T("posts").select("id, slug, title, excerpt, content, category, coverKey:cover_key, status, authorEmail:author_email, publishedAt:published_at, updatedAt:updated_at")
      .order("updated_at", { ascending: false }).order("id", { ascending: false }));
    return { posts: rows.map((p) => ({ ...p, publishedAt: ts(p.publishedAt), updatedAt: ts(p.updatedAt) })) };
  }
  const b = await req.json();
  if (req.method === "DELETE") {
    ok(await T("posts").delete().eq("id", Number(b.id)));
    return { message: "Artículo eliminado" };
  }
  const title = clean(b.title, 180);
  const slug = slugify(clean(b.slug, 100) || title);
  const fila = {
    slug, title, excerpt: clean(b.excerpt, 360), content: clean(b.content, 20000),
    category: clean(b.category, 80) || "Pediatría", cover_key: clean(b.coverKey, 240) || null,
    status: b.status === "published" ? "published" : "draft", author_email: u.email,
  };
  if (!title || !slug || fila.content.length < 20) throw new Aviso("Completa el título y el contenido del artículo");
  const ahora = new Date().toISOString();
  const duplicado = (e: { code?: string }) => {
    if (e?.code === "23505") throw new Aviso("Ya existe un artículo con esa dirección (slug)");
    throw e;
  };
  if (req.method === "POST") {
    const r = await T("posts").insert({ ...fila, published_at: fila.status === "published" ? ahora : null }).select("id").single();
    if (r.error) duplicado(r.error);
    return { id: r.data!.id, message: "Artículo guardado" };
  }
  if (req.method === "PUT") {
    const id = Number(b.id);
    const actual = ok(await T("posts").select("published_at").eq("id", id).maybeSingle());
    if (!actual) throw new Aviso("Artículo no válido");
    const published_at = fila.status === "published" ? (actual.published_at ?? ahora) : actual.published_at;
    const r = await T("posts").update({ ...fila, published_at, updated_at: ahora }).eq("id", id);
    if (r.error) duplicado(r.error);
    return { message: "Artículo actualizado" };
  }
  throw new Aviso("Método no permitido", 405);
}

async function adminComments(req: Request) {
  if (req.method === "GET") {
    const rows = ok(await T("comments").select("id, postSlug:post_slug, author, message, status, createdAt:created_at")
      .order("id", { ascending: false }).limit(200));
    rows.sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending"));
    return { comments: rows.map((c) => ({ ...c, createdAt: ts(c.createdAt) })) };
  }
  const b = await req.json();
  if (req.method === "PUT") {
    if (!["pending", "approved", "hidden"].includes(b.status)) throw new Aviso("Estado no válido");
    ok(await T("comments").update({ status: b.status }).eq("id", Number(b.id)));
    return { message: "Comentario actualizado" };
  }
  if (req.method === "DELETE") {
    ok(await T("comments").delete().eq("id", Number(b.id)));
    return { message: "Comentario eliminado" };
  }
  throw new Aviso("Método no permitido", 405);
}

async function adminInstagram(req: Request) {
  if (req.method === "GET") {
    return { posts: ok(await T("instagram_posts").select("id, url, title, label, mediaKey:media_key, active, sortOrder:sort_order")
      .eq("source", "manual").order("sort_order").order("id", { ascending: false })) };
  }
  const b = await req.json();
  if (req.method === "DELETE") {
    ok(await T("instagram_posts").delete().eq("id", Number(b.id)));
    return { message: "Publicación retirada" };
  }
  const fila = {
    url: clean(b.url, 500), title: clean(b.title, 180), label: clean(b.label, 60) || "Instagram",
    media_key: clean(b.mediaKey, 240) || null, active: b.active !== false, sort_order: Number(b.sortOrder) || 0,
  };
  if (req.method === "POST") {
    if (!IG_RE.test(fila.url) || !fila.title) throw new Aviso("Pega el enlace completo de una publicación o reel de Instagram y agrega un título");
    const r = await T("instagram_posts").insert(fila).select("id").single();
    if (r.error?.code === "23505") throw new Aviso("Esa publicación ya está en el carrusel");
    if (r.error) throw r.error;
    return { id: r.data.id, message: "Publicación agregada" };
  }
  if (req.method === "PUT") {
    ok(await T("instagram_posts").update(fila).eq("id", Number(b.id)));
    return { message: "Publicación actualizada" };
  }
  throw new Aviso("Método no permitido", 405);
}

async function adminMedia(req: Request, u: Usuario) {
  if (req.method === "GET") {
    const rows = ok(await T("media").select("id, objectKey:object_key, filename, mimeType:mime_type, size, altText:alt_text, title, purpose, active, createdAt:created_at")
      .order("id", { ascending: false }).limit(200));
    return { media: rows.map((m) => ({ ...m, createdAt: ts(m.createdAt) })) };
  }
  if (req.method === "POST") {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Aviso("Selecciona una imagen");
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) throw new Aviso("La imagen debe pesar menos de 8 MB");
    const ext = (file.name.split(".").pop() || "jpg").replace(/[^a-z0-9]/gi, "").toLowerCase();
    const key = `uploads/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
    const { error } = await storage.upload(key, file, { contentType: file.type, cacheControl: "86400" });
    if (error) { console.error(error); throw new Aviso("No se pudo subir la imagen", 500); }
    const purpose = ["library", "gallery", "blog", "instagram"].includes(clean(form.get("purpose"), 30)) ? clean(form.get("purpose"), 30) : "library";
    const r = ok(await T("media").insert({
      object_key: key, filename: file.name.slice(0, 180), mime_type: file.type, size: file.size,
      alt_text: clean(form.get("altText"), 240), title: clean(form.get("title"), 160), purpose, uploader_email: u.email,
    }).select("id").single());
    return { id: r.id, objectKey: key, message: "Imagen subida" };
  }
  if (req.method === "DELETE") {
    const b = await req.json();
    const m = ok(await T("media").delete().eq("id", Number(b.id)).select("object_key").maybeSingle());
    if (m) await storage.remove([m.object_key]);
    return { message: "Imagen eliminada" };
  }
  throw new Aviso("Método no permitido", 405);
}

async function adminSubscribers() {
  const rows = ok(await T("subscribers").select("id, email, status, createdAt:created_at").order("id", { ascending: false }).limit(2000));
  return { subscribers: rows.map((s) => ({ ...s, createdAt: ts(s.createdAt) })) };
}

async function adminUsers(req: Request) {
  if (req.method === "GET") {
    const rows = ok(await T("users").select("id, email, displayName:display_name, role, telefono, active, createdAt:created_at").order("id"));
    return { users: rows.map((x) => ({ ...x, createdAt: ts(x.createdAt) })) };
  }
  const b = await req.json();
  const email = clean(b.email, 180).toLowerCase(), display_name = clean(b.displayName, 120);
  const role = b.role === "admin" ? "admin" : "editor";
  const telefono = clean(b.telefono, 20).replace(/[^\d+]/g, "") || null;
  if (req.method === "POST") {
    if (!email.includes("@")) throw new Aviso("Correo no válido");
    const fila: Record<string, unknown> = { email, display_name, role, active: true };
    if (telefono) fila.telefono = telefono;
    ok(await T("users").upsert(fila, { onConflict: "email" }));
    return { message: "Usuario autorizado" };
  }
  if (req.method === "PUT") {
    const fila: Record<string, unknown> = { display_name, role, active: b.active !== false };
    if (telefono) fila.telefono = telefono;
    ok(await T("users").update(fila).eq("id", Number(b.id)));
    return { message: "Usuario actualizado" };
  }
  throw new Aviso("Método no permitido", 405);
}

// ---------------------------------------------------------------- router
Deno.serve(async (req) => {
  const H = cors(req);
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...H, "Content-Type": "application/json", "Cache-Control": "no-store" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: H });

  const url = new URL(req.url);
  const path = url.pathname.replace(/^.*?\/glenys-api/, "") || "/";
  const ip = ipDe(req);
  try {
    switch (path) {
      case "/public/posts": return json(await publicPosts(url));
      case "/public/instagram": return json(await publicInstagram());
      case "/public/gallery": return json(await publicGallery());
      case "/engagement": return json(await engagement(req, url, ip), req.method === "POST" ? 201 : 200);
      case "/subscribe": return json(await subscribe(req, ip), 201);
      case "/unsubscribe": {
        const t = clean(url.searchParams.get("t"), 64);
        const r = t ? ok(await T("subscribers").update({ status: "unsubscribed" }).eq("token", t).select("id")) : [];
        return json(r.length ? { message: "Listo. Ya no recibirás más correos." } : { error: "Enlace no válido" }, r.length ? 200 : 400);
      }
      case "/auth/solicitar": return json(await solicitarCodigo(await req.json(), ip));
      case "/auth/verificar": return json(await verificarCodigo(await req.json()));
    }
    if (path.startsWith("/admin/")) {
      const adminOnly = path === "/admin/subscribers" || path === "/admin/users";
      const u = await requireRole(req, adminOnly);
      switch (path) {
        case "/admin/session": return json({ user: u });
        case "/admin/overview": return json(await adminOverview(u));
        case "/admin/posts": return json(await adminPosts(req, u));
        case "/admin/comments": return json(await adminComments(req));
        case "/admin/instagram": return json(await adminInstagram(req));
        case "/admin/media": return json(await adminMedia(req, u));
        case "/admin/subscribers": return json(await adminSubscribers());
        case "/admin/users": return json(await adminUsers(req));
      }
    }
    return json({ error: "No encontrado" }, 404);
  } catch (e) {
    if (e instanceof Aviso) return json({ error: e.message }, e.status);
    console.error(e);
    return json({ error: "No pudimos completar la solicitud" }, 500);
  }
});
