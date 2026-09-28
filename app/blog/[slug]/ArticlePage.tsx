"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { api, mediaUrl, SITE_URL, WHATSAPP_URL } from "../../../lib/api";
import { fechaLarga } from "../../../lib/fecha";
import { SiteFooter, SiteHeader, WhatsAppFloat } from "../../SiteChrome";

// Una línea corta sin punto final se muestra como subtítulo dentro del artículo.
const esSubtitulo = (t: string) => t.length <= 70 && !/[.:!?…]$/.test(t.trim());

export type Post = { slug: string; title: string; excerpt: string; content: string; category: string; coverKey: string | null; publishedAt: string | null };
export type Resumen = { slug: string; title: string; category: string; coverKey: string | null; publishedAt: string | null };

/** Minutos de lectura aproximados (200 palabras por minuto). */
const minutosLectura = (texto: string) => Math.max(1, Math.round(texto.split(/\s+/).length / 200));

/** Hasta 3 artículos: primero los de la misma categoría, luego los más recientes. */
function elegirRelacionados(todos: Resumen[], actual: { slug: string; category: string }) {
  const otros = todos.filter((p) => p.slug !== actual.slug);
  return [...otros.filter((p) => p.category === actual.category), ...otros.filter((p) => p.category !== actual.category)].slice(0, 3);
}

/**
 * Página de artículo. Si viene `initial` (generado al publicar el sitio) se muestra al instante;
 * si no (artículo publicado después del último despliegue), se carga desde la API.
 */
export function ArticlePage({ slug, initial = null, lista = [] }: { slug: string; initial?: Post | null; lista?: Resumen[] }) {
  const [post, setPost] = useState<Post | null>(initial);
  const [todos, setTodos] = useState<Resumen[]>(lista);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    if (!slug) return;
    fetch(api(`/public/posts?slug=${encodeURIComponent(slug)}`))
      .then(async (response) => { if (!response.ok) throw new Error(); return response.json(); })
      .then((payload: { post: Post }) => setPost(payload.post))
      .catch(() => { if (!initial) setMissing(true); });
    fetch(api("/public/posts")).then((r) => r.json()).then((j: { posts?: Resumen[] }) => { if (j.posts?.length) setTodos(j.posts); }).catch(() => undefined);
  }, [slug, initial]);

  let cuerpo;
  if (missing) cuerpo = <main className="article-state"><h1>Artículo no encontrado</h1><Link href="/blog/">Ver todos los artículos</Link></main>;
  else if (!post) cuerpo = <main className="article-state"><p>Cargando artículo…</p></main>;
  else {
    const url = `${SITE_URL}/blog/${post.slug}/`;
    const relacionados = elegirRelacionados(todos, post);
    cuerpo = (
      <main className="article-page">
        <nav className="article-crumbs" aria-label="Ruta"><Link href="/">Inicio</Link> / <Link href="/blog/">Blog</Link> / <span>{post.category}</span></nav>
        <article>
          <header className="article-top">
            <div className="article-top-copy">
              <p className="kicker">{post.category}</p>
              <h1>{post.title}</h1>
              <p className="article-excerpt">{post.excerpt}</p>
              <div className="article-meta">Dra. Glenys Nina Cuevas · {fechaLarga(post.publishedAt)} · {minutosLectura(post.content)} min de lectura</div>
            </div>
            {post.coverKey ? (
              <figure className="article-figure"><img src={mediaUrl(post.coverKey)} alt={`Infografía: ${post.title}`} /></figure>
            ) : null}
          </header>
          <div className="article-body">
            <div className="article-content">{post.content.split(/\n+/).map((texto, index) => esSubtitulo(texto) ? <h2 key={index}>{texto}</h2> : <p key={index}>{texto}</p>)}</div>
            <aside>Este contenido es educativo y no sustituye una consulta médica individual.</aside>
            <Compartir titulo={post.title} url={url} />
            <div className="article-cta">
              <div><strong>¿Tienes dudas sobre la salud o alimentación de tu hijo?</strong><p>Agenda una consulta con la Dra. Glenys Nina en San Cristóbal.</p></div>
              <a className="button button-green" href={WHATSAPP_URL} target="_blank" rel="noreferrer">Agendar consulta</a>
            </div>
            <Conversacion slug={post.slug} />
          </div>
        </article>
        {relacionados.length ? (
          <section className="related" aria-labelledby="relacionados">
            <h2 id="relacionados">Sigue leyendo</h2>
            <div className="related-grid">
              {relacionados.map((r) => (
                <a key={r.slug} className="related-card" href={`/blog/${r.slug}/`}>
                  <div className="related-cover">{r.coverKey ? <img src={mediaUrl(r.coverKey)} alt="" loading="lazy" /> : null}</div>
                  <small>{r.category}</small>
                  <strong>{r.title}</strong>
                </a>
              ))}
            </div>
            <Link className="related-all" href="/blog/">Ver todos los artículos →</Link>
          </section>
        ) : null}
      </main>
    );
  }
  return <><SiteHeader activo="blog" />{cuerpo}<SiteFooter /><WhatsAppFloat /></>;
}

function Compartir({ titulo, url }: { titulo: string; url: string }) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try { await navigator.clipboard.writeText(url); setCopiado(true); window.setTimeout(() => setCopiado(false), 2500); } catch { /* sin portapapeles */ }
  }
  return (
    <div className="share">
      <span>Compartir</span>
      <a className="share-wa" href={`https://wa.me/?text=${encodeURIComponent(`${titulo} — ${url}`)}`} target="_blank" rel="noreferrer">WhatsApp</a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer">Facebook</a>
      <button type="button" onClick={() => void copiar()}>{copiado ? "¡Enlace copiado!" : "Copiar enlace"}</button>
    </div>
  );
}

type Comentario = { id: number; author: string; message: string; createdAt: string };

function visitante() {
  const key = "glenys-visitor-id";
  try { const v = window.localStorage.getItem(key); if (v) return v; } catch { /* navegación privada */ }
  const v = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `visitor-${Date.now()}`;
  try { window.localStorage.setItem(key, v); } catch { /* sin almacenamiento */ }
  return v;
}

/** Me gusta y comentarios dentro del artículo (los comentarios se publican tras aprobarse en el panel). */
function Conversacion({ slug }: { slug: string }) {
  const [likes, setLikes] = useState(0);
  const [gusta, setGusta] = useState(false);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [autor, setAutor] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    fetch(api(`/engagement?post=${encodeURIComponent(slug)}`)).then((r) => r.json())
      .then((j: { likes?: number; comments?: Comentario[] }) => { setLikes(j.likes ?? 0); setComentarios(j.comments ?? []); })
      .catch(() => undefined);
  }, [slug]);

  async function meGusta() {
    if (gusta) return;
    setGusta(true); setLikes((n) => n + 1);
    try {
      const r = await fetch(api("/engagement"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "like", postSlug: slug, visitorId: visitante() }) });
      if (r.ok) setLikes(((await r.json()) as { likes: number }).likes);
    } catch { /* se mantiene el conteo optimista */ }
  }

  async function comentar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setEnviando(true); setAviso("");
    try {
      const r = await fetch(api("/engagement"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "comment", postSlug: slug, author: autor, message: mensaje }) });
      const j = (await r.json()) as { message?: string; error?: string };
      if (!r.ok) throw new Error(j.error ?? "No fue posible enviar el comentario");
      setMensaje(""); setAviso(j.message ?? "Gracias. Tu comentario se publicará cuando sea revisado.");
    } catch (err) { setAviso(err instanceof Error ? err.message : "No fue posible enviar el comentario"); }
    finally { setEnviando(false); }
  }

  return (
    <section className="conversation" aria-labelledby="conversacion">
      <div className="conversation-head">
        <h2 id="conversacion">Comentarios {comentarios.length ? `(${comentarios.length})` : ""}</h2>
        <button type="button" className={gusta ? "like liked" : "like"} onClick={() => void meGusta()} aria-label="Me gusta este artículo">♡ {likes} {likes === 1 ? "me gusta" : "me gusta"}</button>
      </div>
      {comentarios.length ? (
        <div className="comments-list">{comentarios.map((c) => <article key={c.id}><strong>{c.author}</strong><p>{c.message}</p></article>)}</div>
      ) : <p className="empty-state">Sé la primera persona en comentar.</p>}
      <form className="comment-form" onSubmit={comentar}>
        <label>Nombre<input value={autor} onChange={(e) => setAutor(e.target.value)} maxLength={60} required /></label>
        <label>Comentario<textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} maxLength={500} rows={3} required /></label>
        <button className="button button-green" type="submit" disabled={enviando}>{enviando ? "Enviando…" : "Publicar comentario"}</button>
        {aviso ? <p className="form-feedback" role="status">{aviso}</p> : null}
      </form>
    </section>
  );
}
