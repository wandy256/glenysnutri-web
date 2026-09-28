"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api as apiUrl, mediaUrl } from "../../lib/api";
import { authHeaders, onUnauthorized } from "./session";

type Role = "admin" | "editor";
type SessionUser = { email: string; name: string; role: Role };
type Post = { id: number; slug: string; title: string; excerpt: string; content: string; category: string; coverKey: string | null; status: string; publishedAt: string | null; updatedAt: string };
type AdminComment = { id: number; postSlug: string; author: string; message: string; status: string; createdAt: string };
type Media = { id: number; objectKey: string; filename: string; mimeType: string; size: number; altText: string; title: string; purpose: string; active: boolean; createdAt: string };
type InstagramPost = { id: number; url: string; title: string; label: string; active: boolean; sortOrder: number };
type Subscriber = { id: number; email: string; createdAt: string };
type User = { id: number; email: string; displayName: string; role: Role; active: boolean };

const tabs = ["Resumen", "Artículos", "Comentarios", "Imágenes", "Instagram", "Suscriptores", "Usuarios"] as const;
type Tab = (typeof tabs)[number];

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(apiUrl(path.replace(/^\/api/, "")), { ...options, headers: { ...(options.headers ?? {}), ...authHeaders() } });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (response.status === 401) onUnauthorized();
  if (!response.ok) throw new Error(payload.error ?? "No fue posible completar la solicitud");
  return payload;
}

function jsonOptions(method: string, body: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

const emptyPost = { id: 0, slug: "", title: "", excerpt: "", content: "", category: "Pediatría", coverKey: "", status: "draft" };

export function AdminDashboard({ signedInEmail }: { signedInEmail: string }) {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [denied, setDenied] = useState("");
  const [tab, setTab] = useState<Tab>("Resumen");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ posts: 0, published: 0, pendingComments: 0, subscribers: 0, media: 0 });
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [instagram, setInstagram] = useState<InstagramPost[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [postForm, setPostForm] = useState(emptyPost);
  const [instagramForm, setInstagramForm] = useState({ url: "", title: "", label: "Pediatría", sortOrder: 0 });
  const [userForm, setUserForm] = useState({ email: "", displayName: "", role: "editor" as Role, telefono: "" });

  const loadOverview = useCallback(async () => {
    const result = await api<{ user: SessionUser; counts: typeof counts }>("/api/admin/overview");
    setSession(result.user); setCounts(result.counts);
  }, []);

  useEffect(() => {
    void api<{ user: SessionUser; counts: typeof counts }>("/api/admin/overview")
      .then((result) => { setSession(result.user); setCounts(result.counts); })
      .catch((error: Error) => setDenied(error.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!session) return;
    const loaders: Partial<Record<Tab, () => Promise<void>>> = {
      Artículos: async () => { setPosts((await api<{ posts: Post[] }>("/api/admin/posts")).posts); setMedia((await api<{ media: Media[] }>("/api/admin/media")).media); },
      Comentarios: async () => setComments((await api<{ comments: AdminComment[] }>("/api/admin/comments")).comments),
      Imágenes: async () => setMedia((await api<{ media: Media[] }>("/api/admin/media")).media),
      Instagram: async () => setInstagram((await api<{ posts: InstagramPost[] }>("/api/admin/instagram")).posts),
      Suscriptores: async () => setSubscribers((await api<{ subscribers: Subscriber[] }>("/api/admin/subscribers")).subscribers),
      Usuarios: async () => setUsers((await api<{ users: User[] }>("/api/admin/users")).users),
    };
    loaders[tab]?.().catch((error: Error) => setNotice(error.message));
  }, [tab, session]);

  function flash(message: string) { setNotice(message); window.setTimeout(() => setNotice(""), 3200); }

  async function savePost(event: FormEvent) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const payload = { ...postForm, status: submitter?.value === "published" ? "published" : "draft" };
    const method = postForm.id ? "PUT" : "POST";
    await api("/api/admin/posts", jsonOptions(method, payload));
    flash(payload.status === "published" ? "Artículo publicado correctamente" : "Borrador guardado");
    setPostForm(emptyPost);
    setPosts((await api<{ posts: Post[] }>("/api/admin/posts")).posts);
    await loadOverview();
  }

  async function deletePost(post: Post) {
    if (!window.confirm(`¿Eliminar “${post.title}”?`)) return;
    await api("/api/admin/posts", jsonOptions("DELETE", { id: post.id }));
    setPosts(posts.filter((item) => item.id !== post.id)); flash("Artículo eliminado"); await loadOverview();
  }

  async function moderate(comment: AdminComment, status: string) {
    await api("/api/admin/comments", jsonOptions("PUT", { id: comment.id, status }));
    setComments(comments.map((item) => item.id === comment.id ? { ...item, status } : item));
    flash(status === "approved" ? "Comentario aprobado" : "Comentario ocultado"); await loadOverview();
  }

  async function deleteComment(comment: AdminComment) {
    if (!window.confirm("¿Eliminar este comentario definitivamente?")) return;
    await api("/api/admin/comments", jsonOptions("DELETE", { id: comment.id }));
    setComments(comments.filter((item) => item.id !== comment.id)); flash("Comentario eliminado");
  }

  async function uploadMedia(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    await api("/api/admin/media", { method: "POST", body: new FormData(form) });
    form.reset(); flash("Imagen subida correctamente");
    setMedia((await api<{ media: Media[] }>("/api/admin/media")).media); await loadOverview();
  }

  async function deleteMedia(item: Media) {
    if (!window.confirm(`¿Eliminar “${item.title || item.filename}”?`)) return;
    await api("/api/admin/media", jsonOptions("DELETE", { id: item.id, objectKey: item.objectKey }));
    setMedia(media.filter((image) => image.id !== item.id)); flash("Imagen eliminada");
  }

  async function saveInstagram(event: FormEvent) {
    event.preventDefault();
    await api("/api/admin/instagram", jsonOptions("POST", instagramForm));
    setInstagramForm({ url: "", title: "", label: "Pediatría", sortOrder: 0 });
    setInstagram((await api<{ posts: InstagramPost[] }>("/api/admin/instagram")).posts); flash("Publicación agregada al carrusel");
  }

  async function toggleInstagram(item: InstagramPost) {
    await api("/api/admin/instagram", jsonOptions("PUT", { ...item, active: !item.active }));
    setInstagram(instagram.map((post) => post.id === item.id ? { ...post, active: !item.active } : post));
  }

  async function deleteInstagram(item: InstagramPost) {
    await api("/api/admin/instagram", jsonOptions("DELETE", { id: item.id }));
    setInstagram(instagram.filter((post) => post.id !== item.id)); flash("Post retirado");
  }

  async function saveUser(event: FormEvent) {
    event.preventDefault();
    await api("/api/admin/users", jsonOptions("POST", userForm));
    setUserForm({ email: "", displayName: "", role: "editor", telefono: "" });
    setUsers((await api<{ users: User[] }>("/api/admin/users")).users); flash("Usuario autorizado");
  }

  async function toggleUser(item: User) {
    await api("/api/admin/users", jsonOptions("PUT", { ...item, active: !item.active }));
    setUsers(users.map((user) => user.id === item.id ? { ...user, active: !item.active } : user));
  }

  function exportSubscribers() {
    const csv = ["correo,fecha", ...subscribers.map((item) => `${item.email},${item.createdAt}`)].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "suscriptores-glenys-nina.csv"; link.click(); URL.revokeObjectURL(url);
  }

  if (loading) return <section className="admin-state"><div className="admin-loader" /><p>Preparando tu panel…</p></section>;
  if (denied || !session) return (
    <section className="admin-denied">
      <span>Acceso pendiente</span><h1>Tu cuenta todavía no está autorizada</h1>
      <p>{denied || <>Has iniciado sesión como <strong>{signedInEmail}</strong>. Este correo debe agregarse a la lista de administradores del sitio.</>}</p>
      <Link href="/">Volver a la página principal</Link>
    </section>
  );

  const availableTabs = tabs.filter((item) => session.role === "admin" || !new Set<Tab>(["Suscriptores", "Usuarios"]).has(item));
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div><small>Panel privado</small><strong>{session.role === "admin" ? "Administrador" : "Editora"}</strong></div>
        <nav>{availableTabs.map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</nav>
        <a href="/" target="_blank">Ver sitio público ↗</a>
      </aside>
      <section className="admin-content">
        <header className="admin-title"><div><p>Dra. Glenys Nina</p><h1>{tab}</h1></div><span>{session.name || session.email}</span></header>
        {notice ? <div className="admin-notice" role="status">{notice}</div> : null}

        {tab === "Resumen" ? <div className="overview-grid">
          <article><span>Artículos</span><strong>{counts.posts}</strong><small>{counts.published} publicados</small></article>
          <article><span>Por revisar</span><strong>{counts.pendingComments}</strong><small>comentarios pendientes</small></article>
          <article><span>Comunidad</span><strong>{counts.subscribers}</strong><small>suscriptores</small></article>
          <article><span>Biblioteca</span><strong>{counts.media}</strong><small>imágenes</small></article>
          <div className="admin-welcome"><p>Tu centro de contenido</p><h2>Publica, organiza y modera desde un solo lugar.</h2><button onClick={() => setTab("Artículos")}>Crear un artículo</button></div>
        </div> : null}

        {tab === "Artículos" ? <div className="admin-two-columns">
          <form className="admin-form post-editor" onSubmit={savePost}>
            <div className="form-heading"><h2>{postForm.id ? "Editar artículo" : "Nuevo artículo"}</h2>{postForm.id ? <button type="button" onClick={() => setPostForm(emptyPost)}>Cancelar</button> : null}</div>
            <label>Título<input value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} required /></label>
            <div className="form-row"><label>Categoría<input value={postForm.category} onChange={(e) => setPostForm({ ...postForm, category: e.target.value })} /></label><label>Enlace corto<input value={postForm.slug} onChange={(e) => setPostForm({ ...postForm, slug: e.target.value })} placeholder="Se crea automáticamente" /></label></div>
            <label>Resumen<textarea rows={3} maxLength={360} value={postForm.excerpt} onChange={(e) => setPostForm({ ...postForm, excerpt: e.target.value })} /></label>
            <label>Contenido<textarea className="content-editor" rows={13} value={postForm.content} onChange={(e) => setPostForm({ ...postForm, content: e.target.value })} required /></label>
            <label>Imagen de portada<select value={postForm.coverKey} onChange={(e) => setPostForm({ ...postForm, coverKey: e.target.value })}><option value="">Diseño pastel predeterminado</option>{media.map((item) => <option key={item.id} value={item.objectKey}>{item.title || item.filename}</option>)}</select></label>
            <div className="editor-actions"><button type="submit" value="draft">Guardar como borrador</button><button className="primary" type="submit" value="published">{postForm.status === "published" ? "Actualizar publicación" : "Publicar"}</button></div>
          </form>
          <div className="admin-list"><h2>Artículos</h2>{posts.map((post) => <article key={post.id}><div><span className={`status ${post.status}`}>{post.status === "published" ? "Publicado" : "Borrador"}</span><h3>{post.title}</h3><small>{post.category} · {post.updatedAt?.slice(0,10)}</small></div><div><button onClick={() => setPostForm({ ...post, coverKey: post.coverKey ?? "" })}>Editar</button><button className="danger" onClick={() => void deletePost(post)}>Eliminar</button></div></article>)}</div>
        </div> : null}

        {tab === "Comentarios" ? <div className="admin-table-list"><div className="list-header"><h2>Moderación</h2><p>Los comentarios nuevos permanecen ocultos hasta que sean aprobados.</p></div>{comments.map((comment) => <article key={comment.id}><div><span className={`status ${comment.status}`}>{comment.status}</span><strong>{comment.author}</strong><small>{comment.postSlug} · {comment.createdAt}</small><p>{comment.message}</p></div><div>{comment.status !== "approved" ? <button className="approve" onClick={() => void moderate(comment, "approved")}>Aprobar</button> : null}<button onClick={() => void moderate(comment, "hidden")}>Ocultar</button><button className="danger" onClick={() => void deleteComment(comment)}>Eliminar</button></div></article>)}</div> : null}

        {tab === "Imágenes" ? <div className="media-manager"><form className="admin-form upload-form" onSubmit={(event) => void uploadMedia(event).catch((error: Error) => flash(error.message))}><h2>Subir imagen</h2><label>Archivo<input type="file" name="file" accept="image/*" required /></label><label>Título<input name="title" required /></label><label>Texto alternativo<input name="altText" placeholder="Describe brevemente la fotografía" /></label><label>Uso<select name="purpose"><option value="library">Biblioteca general</option><option value="gallery">Galería pública</option><option value="blog">Portada de blog</option><option value="instagram">Instagram</option></select></label><button className="primary" type="submit">Subir imagen</button></form><div className="media-grid">{media.map((item) => <article key={item.id}><img src={mediaUrl(item.objectKey)} alt={item.altText || item.title} /><div><span>{item.purpose}</span><strong>{item.title || item.filename}</strong><button className="danger" onClick={() => void deleteMedia(item)}>Eliminar</button></div></article>)}</div></div> : null}

        {tab === "Instagram" ? <div className="instagram-manager">
          <section className="instagram-connection connected">
            <div>
              <span>Administración manual</span>
              <h2>@dra.glenys_nutri</h2>
              <p>Elige exactamente cuáles publicaciones aparecen en el sitio. No necesitas configurar Meta ni compartir la contraseña de Instagram.</p>
            </div>
            <a className="primary" href="https://www.instagram.com/dra.glenys_nutri/" target="_blank" rel="noreferrer">Abrir Instagram ↗</a>
          </section>

          <div className="admin-two-columns">
            <form className="admin-form" onSubmit={saveInstagram}>
              <div><span className="fallback-label">Paso 1</span><h2>Agregar publicación</h2></div>
              <p className="form-help">En Instagram, abre el post o reel, selecciona “Copiar enlace” y pégalo aquí. La publicación se mostrará completa en el carrusel.</p>
              <label>Enlace del post o reel<input type="url" value={instagramForm.url} onChange={(e) => setInstagramForm({ ...instagramForm, url: e.target.value })} placeholder="https://www.instagram.com/p/..." required /></label>
              <label>Título interno<input value={instagramForm.title} onChange={(e) => setInstagramForm({ ...instagramForm, title: e.target.value })} placeholder="Ej.: Alimentación complementaria" required /></label>
              <div className="form-row"><label>Etiqueta<input value={instagramForm.label} onChange={(e) => setInstagramForm({ ...instagramForm, label: e.target.value })} /></label><label>Orden<input type="number" value={instagramForm.sortOrder} onChange={(e) => setInstagramForm({ ...instagramForm, sortOrder: Number(e.target.value) })} /></label></div>
              <button className="primary" type="submit">Mostrar en el carrusel</button>
            </form>
            <div className="admin-list"><h2>Publicaciones del carrusel</h2>{instagram.length ? instagram.map((item) => <article key={item.id}><div><span className={`status ${item.active ? "published" : "hidden"}`}>{item.active ? "Visible" : "Oculta"}</span><h3>{item.title}</h3><a href={item.url} target="_blank" rel="noreferrer">Ver post ↗</a></div><div><button onClick={() => void toggleInstagram(item)}>{item.active ? "Ocultar" : "Mostrar"}</button><button className="danger" onClick={() => void deleteInstagram(item)}>Retirar</button></div></article>) : <p className="empty-state">Todavía no hay publicaciones agregadas.</p>}</div>
          </div>
        </div> : null}

        {tab === "Suscriptores" ? <div className="admin-table-list"><div className="list-header subscribers-header"><div><h2>Suscriptores</h2><p>{subscribers.length} correos registrados</p></div><button className="primary" onClick={exportSubscribers}>Exportar CSV</button></div>{subscribers.map((item) => <article key={item.id}><div><strong>{item.email}</strong><small>Registrado: {item.createdAt}</small></div></article>)}</div> : null}

        {tab === "Usuarios" ? <div className="admin-two-columns"><form className="admin-form" onSubmit={saveUser}><h2>Autorizar usuario</h2><label>Correo (recibirá el código de acceso)<input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required /></label><label>Nombre<input value={userForm.displayName} onChange={(e) => setUserForm({ ...userForm, displayName: e.target.value })} /></label><label>Celular (opcional, respaldo por SMS)<input type="tel" value={userForm.telefono} onChange={(e) => setUserForm({ ...userForm, telefono: e.target.value })} placeholder="809 000 0000" /></label><label>Rol<select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value as Role })}><option value="editor">Editora</option><option value="admin">Administrador</option></select></label><button className="primary" type="submit">Autorizar acceso</button></form><div className="admin-list"><h2>Usuarios autorizados</h2>{users.map((item) => <article key={item.id}><div><span className={`status ${item.active ? "published" : "hidden"}`}>{item.active ? "Activo" : "Suspendido"}</span><h3>{item.displayName || item.email}</h3><small>{item.email} · {item.role}</small></div><button onClick={() => void toggleUser(item)}>{item.active ? "Suspender" : "Activar"}</button></article>)}</div></div> : null}
      </section>
    </div>
  );
}
