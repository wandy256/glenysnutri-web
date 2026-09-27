export interface ContentEnv {
  DB: D1Database;
  BUCKET: R2Bucket;
  ADMIN_EMAILS?: string;
}

type Role = "admin" | "editor";

function json(payload: unknown, status = 200) {
  return Response.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}

function signedInEmail(request: Request) {
  return clean(request.headers.get("oai-authenticated-user-email"), 180).toLowerCase();
}

function signedInName(request: Request) {
  const encoded = request.headers.get("oai-authenticated-user-full-name");
  if (!encoded || request.headers.get("oai-authenticated-user-full-name-encoding") !== "percent-encoded-utf-8") return "";
  try { return decodeURIComponent(encoded).slice(0, 120); } catch { return ""; }
}

async function identity(request: Request, env: ContentEnv): Promise<{ email: string; name: string; role: Role } | null> {
  const email = signedInEmail(request);
  if (!email) return null;
  const allowlist = (env.ADMIN_EMAILS ?? "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  if (allowlist.includes(email)) return { email, name: signedInName(request), role: "admin" };
  const user = await env.DB
    .prepare("SELECT display_name AS name, role FROM users WHERE email = ? AND active = 1")
    .bind(email)
    .first<{ name: string; role: string }>();
  if (!user || (user.role !== "admin" && user.role !== "editor")) return null;
  return { email, name: user.name || signedInName(request), role: user.role } as { email: string; name: string; role: Role };
}

async function requireRole(request: Request, env: ContentEnv, adminOnly = false) {
  const user = await identity(request, env);
  if (!user) return { response: json({ error: "Acceso no autorizado", email: signedInEmail(request) || null }, 403) };
  if (adminOnly && user.role !== "admin") return { response: json({ error: "Esta acción requiere permisos de administrador" }, 403) };
  return { user };
}

async function publicPosts(request: Request, env: ContentEnv) {
  const slug = clean(new URL(request.url).searchParams.get("slug"), 100);
  if (slug) {
    const post = await env.DB.prepare(
      "SELECT id, slug, title, excerpt, content, category, cover_key AS coverKey, published_at AS publishedAt FROM posts WHERE slug = ? AND status = 'published' LIMIT 1",
    ).bind(slug).first();
    return post ? json({ post }) : json({ error: "Artículo no encontrado" }, 404);
  }
  const rows = await env.DB.prepare(
    "SELECT id, slug, title, excerpt, category, cover_key AS coverKey, published_at AS publishedAt FROM posts WHERE status = 'published' ORDER BY published_at DESC, id DESC LIMIT 24",
  ).all();
  return json({ posts: rows.results ?? [] });
}

async function publicInstagram(env: ContentEnv) {
  const rows = await env.DB.prepare(
    "SELECT id,url,title,label,media_key AS mediaKey FROM instagram_posts WHERE active=1 AND source='manual' ORDER BY sort_order ASC,id DESC LIMIT 20",
  ).all();
  return json({ posts: rows.results ?? [] });
}

async function publicGallery(env: ContentEnv) {
  const rows = await env.DB.prepare(
    "SELECT id, object_key AS objectKey, title, alt_text AS altText FROM media WHERE active = 1 AND purpose = 'gallery' ORDER BY id DESC LIMIT 30",
  ).all();
  return json({ images: rows.results ?? [] });
}

async function engagement(request: Request, env: ContentEnv) {
  const url = new URL(request.url);
  if (request.method === "GET") {
    const postSlug = clean(url.searchParams.get("post"), 100);
    const post = await env.DB.prepare("SELECT id FROM posts WHERE slug = ? AND status = 'published'").bind(postSlug).first();
    if (!post) return json({ error: "Publicación no válida" }, 400);
    const likeRow = await env.DB.prepare("SELECT COUNT(*) AS value FROM post_likes WHERE post_slug = ?").bind(postSlug).first<{ value: number }>();
    const commentRows = await env.DB.prepare(
      "SELECT id, author, message, created_at AS createdAt FROM comments WHERE post_slug = ? AND status = 'approved' ORDER BY id DESC LIMIT 20",
    ).bind(postSlug).all();
    return json({ likes: Number(likeRow?.value ?? 0), comments: commentRows.results ?? [] });
  }
  if (request.method !== "POST") return json({ error: "Método no permitido" }, 405);
  const body = (await request.json()) as Record<string, unknown>;
  const type = clean(body.type, 20);
  const postSlug = clean(body.postSlug, 100);
  const post = await env.DB.prepare("SELECT id FROM posts WHERE slug = ? AND status = 'published'").bind(postSlug).first();
  if (!post) return json({ error: "Publicación no válida" }, 400);
  if (type === "like") {
    const visitorId = clean(body.visitorId, 80);
    if (!visitorId) return json({ error: "Identificador requerido" }, 400);
    await env.DB.prepare("INSERT OR IGNORE INTO post_likes (post_slug, visitor_id) VALUES (?, ?)").bind(postSlug, visitorId).run();
    const total = await env.DB.prepare("SELECT COUNT(*) AS value FROM post_likes WHERE post_slug = ?").bind(postSlug).first<{ value: number }>();
    return json({ likes: Number(total?.value ?? 0) });
  }
  if (type === "comment") {
    const author = clean(body.author, 60);
    const message = clean(body.message, 500);
    if (author.length < 2 || message.length < 3) return json({ error: "Completa tu nombre y comentario" }, 400);
    await env.DB.prepare("INSERT INTO comments (post_slug, author, message, status) VALUES (?, ?, ?, 'pending')").bind(postSlug, author, message).run();
    return json({ message: "Comentario enviado para revisión" }, 201);
  }
  return json({ error: "Acción no válida" }, 400);
}

async function adminSession(request: Request, env: ContentEnv) {
  const auth = await requireRole(request, env);
  return "response" in auth ? auth.response : json({ user: auth.user });
}

async function adminOverview(request: Request, env: ContentEnv) {
  const auth = await requireRole(request, env);
  if ("response" in auth) return auth.response;
  const results = await env.DB.batch([
    env.DB.prepare("SELECT COUNT(*) AS value FROM posts"),
    env.DB.prepare("SELECT COUNT(*) AS value FROM posts WHERE status = 'published'"),
    env.DB.prepare("SELECT COUNT(*) AS value FROM comments WHERE status = 'pending'"),
    env.DB.prepare("SELECT COUNT(*) AS value FROM subscribers"),
    env.DB.prepare("SELECT COUNT(*) AS value FROM media"),
  ]);
  return json({
    user: auth.user,
    counts: {
      posts: Number((results[0].results?.[0] as { value?: number })?.value ?? 0),
      published: Number((results[1].results?.[0] as { value?: number })?.value ?? 0),
      pendingComments: Number((results[2].results?.[0] as { value?: number })?.value ?? 0),
      subscribers: Number((results[3].results?.[0] as { value?: number })?.value ?? 0),
      media: Number((results[4].results?.[0] as { value?: number })?.value ?? 0),
    },
  });
}

async function adminPosts(request: Request, env: ContentEnv) {
  const auth = await requireRole(request, env);
  if ("response" in auth) return auth.response;
  if (request.method === "GET") {
    const rows = await env.DB.prepare(
      "SELECT id, slug, title, excerpt, content, category, cover_key AS coverKey, status, author_email AS authorEmail, published_at AS publishedAt, updated_at AS updatedAt FROM posts ORDER BY updated_at DESC, id DESC",
    ).all();
    return json({ posts: rows.results ?? [] });
  }
  const body = (await request.json()) as Record<string, unknown>;
  const title = clean(body.title, 180);
  const slug = slugify(clean(body.slug, 100) || title);
  const excerpt = clean(body.excerpt, 360);
  const content = clean(body.content, 20000);
  const category = clean(body.category, 80) || "Pediatría";
  const coverKey = clean(body.coverKey, 240) || null;
  const status = body.status === "published" ? "published" : "draft";
  if (!title || !slug || content.length < 20) return json({ error: "Completa el título y el contenido del artículo" }, 400);
  if (request.method === "POST") {
    const result = await env.DB.prepare(
      "INSERT INTO posts (slug,title,excerpt,content,category,cover_key,status,author_email,published_at,updated_at) VALUES (?,?,?,?,?,?,?,?,CASE WHEN ? = 'published' THEN CURRENT_TIMESTAMP ELSE NULL END,CURRENT_TIMESTAMP)",
    ).bind(slug, title, excerpt, content, category, coverKey, status, auth.user.email, status).run();
    return json({ id: Number(result.meta.last_row_id ?? 0), message: "Artículo guardado" }, 201);
  }
  if (request.method === "PUT") {
    const id = Number(body.id);
    if (!Number.isInteger(id)) return json({ error: "Artículo no válido" }, 400);
    await env.DB.prepare(
      "UPDATE posts SET slug=?,title=?,excerpt=?,content=?,category=?,cover_key=?,status=?,author_email=?,published_at=CASE WHEN ?='published' THEN COALESCE(published_at,CURRENT_TIMESTAMP) ELSE published_at END,updated_at=CURRENT_TIMESTAMP WHERE id=?",
    ).bind(slug, title, excerpt, content, category, coverKey, status, auth.user.email, status, id).run();
    return json({ message: "Artículo actualizado" });
  }
  if (request.method === "DELETE") {
    const id = Number(body.id);
    await env.DB.prepare("DELETE FROM posts WHERE id = ?").bind(id).run();
    return json({ message: "Artículo eliminado" });
  }
  return json({ error: "Método no permitido" }, 405);
}

async function adminComments(request: Request, env: ContentEnv) {
  const auth = await requireRole(request, env);
  if ("response" in auth) return auth.response;
  if (request.method === "GET") {
    const rows = await env.DB.prepare(
      "SELECT id, post_slug AS postSlug, author, message, status, created_at AS createdAt FROM comments ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, id DESC LIMIT 200",
    ).all();
    return json({ comments: rows.results ?? [] });
  }
  const body = (await request.json()) as Record<string, unknown>;
  const id = Number(body.id);
  if (request.method === "PUT") {
    const status = clean(body.status, 20);
    if (!new Set(["pending", "approved", "hidden"]).has(status)) return json({ error: "Estado no válido" }, 400);
    await env.DB.prepare("UPDATE comments SET status = ? WHERE id = ?").bind(status, id).run();
    return json({ message: "Comentario actualizado" });
  }
  if (request.method === "DELETE") {
    await env.DB.prepare("DELETE FROM comments WHERE id = ?").bind(id).run();
    return json({ message: "Comentario eliminado" });
  }
  return json({ error: "Método no permitido" }, 405);
}

async function adminInstagram(request: Request, env: ContentEnv) {
  const auth = await requireRole(request, env);
  if ("response" in auth) return auth.response;
  if (request.method === "GET") {
    const rows = await env.DB.prepare("SELECT id,url,title,label,media_key AS mediaKey,active,sort_order AS sortOrder FROM instagram_posts WHERE source='manual' ORDER BY sort_order,id DESC").all();
    return json({ posts: rows.results ?? [] });
  }
  const body = (await request.json()) as Record<string, unknown>;
  const url = clean(body.url, 500);
  const title = clean(body.title, 180);
  const label = clean(body.label, 60) || "Instagram";
  const mediaKey = clean(body.mediaKey, 240) || null;
  const active = body.active === false ? 0 : 1;
  const sortOrder = Number(body.sortOrder) || 0;
  if (request.method === "POST") {
    if (!/^https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?(?:\?.*)?$/.test(url) || !title) {
      return json({ error: "Pega el enlace completo de una publicación o reel de Instagram y agrega un título" }, 400);
    }
    const result = await env.DB.prepare("INSERT INTO instagram_posts (url,title,label,media_key,active,sort_order) VALUES (?,?,?,?,?,?)")
      .bind(url, title, label, mediaKey, active, sortOrder).run();
    return json({ id: Number(result.meta.last_row_id ?? 0), message: "Publicación agregada" }, 201);
  }
  if (request.method === "PUT") {
    await env.DB.prepare("UPDATE instagram_posts SET url=?,title=?,label=?,media_key=?,active=?,sort_order=? WHERE id=?")
      .bind(url, title, label, mediaKey, active, sortOrder, Number(body.id)).run();
    return json({ message: "Publicación actualizada" });
  }
  if (request.method === "DELETE") {
    await env.DB.prepare("DELETE FROM instagram_posts WHERE id=?").bind(Number(body.id)).run();
    return json({ message: "Publicación retirada" });
  }
  return json({ error: "Método no permitido" }, 405);
}

async function adminMedia(request: Request, env: ContentEnv) {
  const auth = await requireRole(request, env);
  if ("response" in auth) return auth.response;
  if (request.method === "GET") {
    const rows = await env.DB.prepare("SELECT id,object_key AS objectKey,filename,mime_type AS mimeType,size,alt_text AS altText,title,purpose,active,created_at AS createdAt FROM media ORDER BY id DESC LIMIT 200").all();
    return json({ media: rows.results ?? [] });
  }
  if (request.method === "POST") {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return json({ error: "Selecciona una imagen" }, 400);
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) return json({ error: "La imagen debe pesar menos de 8 MB" }, 400);
    const extension = (file.name.split(".").pop() || "jpg").replace(/[^a-z0-9]/gi, "").toLowerCase();
    const objectKey = `uploads/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
    await env.BUCKET.put(objectKey, file.stream(), { httpMetadata: { contentType: file.type } });
    const title = clean(form.get("title"), 160);
    const altText = clean(form.get("altText"), 240);
    const purpose = new Set(["library", "gallery", "blog", "instagram"]).has(clean(form.get("purpose"), 30)) ? clean(form.get("purpose"), 30) : "library";
    const result = await env.DB.prepare("INSERT INTO media (object_key,filename,mime_type,size,alt_text,title,purpose,uploader_email) VALUES (?,?,?,?,?,?,?,?)")
      .bind(objectKey, file.name.slice(0, 180), file.type, file.size, altText, title, purpose, auth.user.email).run();
    return json({ id: Number(result.meta.last_row_id ?? 0), objectKey, message: "Imagen subida" }, 201);
  }
  if (request.method === "DELETE") {
    const body = (await request.json()) as { id?: number; objectKey?: string };
    const objectKey = clean(body.objectKey, 240);
    if (objectKey) await env.BUCKET.delete(objectKey);
    await env.DB.prepare("DELETE FROM media WHERE id = ?").bind(Number(body.id)).run();
    return json({ message: "Imagen eliminada" });
  }
  return json({ error: "Método no permitido" }, 405);
}

async function adminSubscribers(request: Request, env: ContentEnv) {
  const auth = await requireRole(request, env, true);
  if ("response" in auth) return auth.response;
  const rows = await env.DB.prepare("SELECT id,email,created_at AS createdAt FROM subscribers ORDER BY id DESC LIMIT 1000").all();
  return json({ subscribers: rows.results ?? [] });
}

async function adminUsers(request: Request, env: ContentEnv) {
  const auth = await requireRole(request, env, true);
  if ("response" in auth) return auth.response;
  if (request.method === "GET") {
    const rows = await env.DB.prepare("SELECT id,email,display_name AS displayName,role,active,created_at AS createdAt FROM users ORDER BY id").all();
    return json({ users: rows.results ?? [] });
  }
  const body = (await request.json()) as Record<string, unknown>;
  const email = clean(body.email, 180).toLowerCase();
  const displayName = clean(body.displayName, 120);
  const role = body.role === "admin" ? "admin" : "editor";
  if (!email.includes("@")) return json({ error: "Correo no válido" }, 400);
  if (request.method === "POST") {
    await env.DB.prepare("INSERT INTO users (email,display_name,role,active) VALUES (?,?,?,1) ON CONFLICT(email) DO UPDATE SET display_name=excluded.display_name,role=excluded.role,active=1")
      .bind(email, displayName, role).run();
    return json({ message: "Usuario autorizado" }, 201);
  }
  if (request.method === "PUT") {
    await env.DB.prepare("UPDATE users SET display_name=?,role=?,active=? WHERE id=?")
      .bind(displayName, role, body.active === false ? 0 : 1, Number(body.id)).run();
    return json({ message: "Usuario actualizado" });
  }
  return json({ error: "Método no permitido" }, 405);
}

async function serveMedia(request: Request, env: ContentEnv) {
  const url = new URL(request.url);
  const key = decodeURIComponent(url.pathname.slice("/media/".length));
  if (!key.startsWith("uploads/")) return new Response("Not found", { status: 404 });
  const object = await env.BUCKET.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=86400");
  return new Response(object.body, { headers });
}

export async function handleContentRequest(request: Request, env: ContentEnv): Promise<Response | null> {
  const path = new URL(request.url).pathname;
  try {
    if (path.startsWith("/media/")) return serveMedia(request, env);
    if (path === "/api/public/posts") return publicPosts(request, env);
    if (path === "/api/public/instagram") return publicInstagram(env);
    if (path === "/api/public/gallery") return publicGallery(env);
    if (path === "/api/engagement") return engagement(request, env);
    if (path === "/api/subscribe") return handleSubscription(request, env);
    if (path === "/api/admin/session") return adminSession(request, env);
    if (path === "/api/admin/overview") return adminOverview(request, env);
    if (path === "/api/admin/posts") return adminPosts(request, env);
    if (path === "/api/admin/comments") return adminComments(request, env);
    if (path === "/api/admin/instagram") return adminInstagram(request, env);
    if (path === "/api/admin/media") return adminMedia(request, env);
    if (path === "/api/admin/subscribers") return adminSubscribers(request, env);
    if (path === "/api/admin/users") return adminUsers(request, env);
    return null;
  } catch (error) {
    const message = error instanceof Error && error.message.includes("UNIQUE") ? "Ya existe un registro con esos datos" : "No pudimos completar la solicitud";
    return json({ error: message }, 500);
  }
}

async function handleSubscription(request: Request, env: ContentEnv) {
  if (request.method !== "POST") return json({ error: "Método no permitido" }, 405);
  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim().toLowerCase().slice(0, 160) ?? "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Escribe un correo electrónico válido" }, 400);
  await env.DB.prepare("INSERT OR IGNORE INTO subscribers (email) VALUES (?)").bind(email).run();
  return json({ message: "¡Gracias! Ya formas parte de la comunidad." }, 201);
}
