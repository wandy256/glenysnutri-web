"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { api, mediaUrl } from "../lib/api";
import { fechaLarga } from "../lib/fecha";

type Comment = { id: number; author: string; message: string; createdAt: string };
type Engagement = { likes: number; comments: Comment[] };
type PublicPost = { id?: number; slug: string; category: string; title: string; excerpt: string; content?: string; coverKey?: string | null; publishedAt?: string | null; date?: string; read?: string; theme?: string; symbol?: string };

// Los artículos llegan ya cargados desde el build (initialPosts) y se actualizan desde la API al abrir la página.
export type { PublicPost };



const instagramTopics = [
  { label: "Nutrición", title: "Ideas frescas para sus meriendas", color: "insta-green", symbol: "🍓" },
  { label: "Pediatría", title: "Señales de una hidratación adecuada", color: "insta-pink", symbol: "💧" },
  { label: "Crecimiento", title: "Cada niño tiene su propio ritmo", color: "insta-cream", symbol: "🌱" },
  { label: "Familias", title: "Comer juntos también nutre", color: "insta-green", symbol: "♡" },
];
const INSTAGRAM_ACCOUNT = "dra.glenys_nutri";

type InstagramItem = {
  id?: number;
  url: string;
  title: string;
  label: string;
  mediaKey?: string | null;
  color?: string;
  symbol?: string;
};

function isInstagramPostUrl(url: string) {
  return /^https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?(?:\?.*)?$/.test(url);
}

function getVisitorId() {
  const key = "glenys-visitor-id";
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
  } catch { /* navegación privada */ }
  const value = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `visitor-${Date.now()}`;
  try { window.localStorage.setItem(key, value); } catch { /* sin almacenamiento */ }
  return value;
}

const quitarAcentos = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/**
 * Lista de artículos. En la portada se muestran los más recientes (`limit`);
 * en /blog se muestran todos, con filtro por categoría y buscador (`filtros`).
 */
export function BlogSection({ initialPosts = [], limit, filtros = false }: { initialPosts?: PublicPost[]; limit?: number; filtros?: boolean }) {
  const [posts, setPosts] = useState<PublicPost[]>(initialPosts);
  const [categoria, setCategoria] = useState("Todas");
  const [buscar, setBuscar] = useState("");
  const [data, setData] = useState<Record<string, Engagement>>({});
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<PublicPost | null>(null);
  const [author, setAuthor] = useState("");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  async function load(slug: string) {
    try {
      const response = await fetch(api(`/engagement?post=${encodeURIComponent(slug)}`));
      const payload = (await response.json()) as Engagement;
      setData((current) => ({ ...current, [slug]: { likes: payload.likes ?? 0, comments: payload.comments ?? [] } }));
    } catch {
      setData((current) => ({ ...current, [slug]: { likes: 0, comments: [] } }));
    }
  }

  useEffect(() => {
    fetch(api("/public/posts"))
      .then((response) => response.json())
      .then((payload: { posts?: PublicPost[] }) => {
        if (payload.posts?.length) setPosts(payload.posts);
      })
      .catch(() => undefined);
  }, []);

  const categorias = ["Todas", ...Array.from(new Set(posts.map((p) => p.category).filter(Boolean)))];
  const q = quitarAcentos(buscar.trim());
  const visibles = posts
    .filter((p) => categoria === "Todas" || p.category === categoria)
    .filter((p) => !q || quitarAcentos(`${p.title} ${p.excerpt} ${p.category}`).includes(q))
    .slice(0, limit ?? posts.length);
  const claveVisibles = visibles.map((p) => p.slug).join(",");

  useEffect(() => { claveVisibles.split(",").filter(Boolean).forEach((slug) => void load(slug)); }, [claveVisibles]);

  async function like(slug: string) {
    if (liked.has(slug)) return;
    setLiked((current) => new Set(current).add(slug));
    setData((current) => ({
      ...current,
      [slug]: { likes: (current[slug]?.likes ?? 0) + 1, comments: current[slug]?.comments ?? [] },
    }));
    try {
      const response = await fetch(api("/engagement"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "like", postSlug: slug, visitorId: getVisitorId() }),
      });
      if (response.ok) {
        const payload = (await response.json()) as { likes: number };
        setData((current) => ({ ...current, [slug]: { likes: payload.likes, comments: current[slug]?.comments ?? [] } }));
      }
    } catch {
      // Keep the friendly optimistic state while the connection recovers.
    }
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setFeedback("");
    try {
      const response = await fetch(api("/engagement"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "comment", postSlug: selected.slug, author, message }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "No fue posible enviar el comentario");
      setMessage("");
      setFeedback(payload.message ?? "Comentario enviado para revisión");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible publicar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={`section blog-section ${filtros ? "blog-archive" : ""}`} id="blog">
      {filtros ? (
        <div className="blog-filters">
          <div className="chips" role="group" aria-label="Filtrar por tema">
            {categorias.map((c) => (
              <button key={c} type="button" className={c === categoria ? "chip active" : "chip"} aria-pressed={c === categoria} onClick={() => setCategoria(c)}>{c}</button>
            ))}
          </div>
          <label className="blog-search">
            <span className="sr-only">Buscar artículos</span>
            <input type="search" placeholder="Buscar: miel, reflujo, meriendas…" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
          </label>
        </div>
      ) : (
        <div className="section-heading split-heading">
          <div>
            <p className="kicker">Blog de la doctora</p>
            <h2>Información que acompaña decisiones reales</h2>
          </div>
          <p>Contenido educativo sobre pediatría, nutrición clínica y bienestar familiar.</p>
        </div>
      )}

      {filtros && !visibles.length ? <p className="empty-state blog-empty">No encontramos artículos con esa búsqueda. Prueba con otra palabra.</p> : null}

      <div className="blog-grid">
        {visibles.map((post, index) => {
          const engagement = data[post.slug] ?? { likes: 0, comments: [] };
          const themes = ["post-green", "post-pink", "post-cream"];
          const symbols = ["🍐", "🍉", "🥬"];
          return (
            <article className="blog-card" key={post.slug}>
              <a className={`post-cover ${post.coverKey ? "has-photo" : post.theme ?? themes[index % themes.length]}`} href={`/blog/${post.slug}/`} tabIndex={-1} aria-hidden="true">
                {post.coverKey ? <img src={mediaUrl(post.coverKey)} alt="" loading="lazy" decoding="async" /> : <b>{post.symbol ?? symbols[index % symbols.length]}</b>}
                <span>{post.category}</span>
              </a>
              <div className="post-body">
                <small>{post.date ?? fechaLarga(post.publishedAt)}{post.read ? ` · ${post.read} de lectura` : ""}</small>
                <h3><a href={`/blog/${post.slug}/`}>{post.title}</a></h3>
                <p>{post.excerpt}</p>
                <a className="read-post" href={`/blog/${post.slug}/`}>Leer artículo →</a>
                <div className="post-actions">
                  <button
                    className={liked.has(post.slug) ? "liked" : ""}
                    type="button"
                    onClick={() => void like(post.slug)}
                    aria-label={`Me gusta en ${post.title}`}
                  >
                    ♡ <span>{engagement.likes}</span>
                  </button>
                  <button type="button" onClick={() => { setSelected(post); setFeedback(""); }}>
                    Comentarios <span>{engagement.comments.length}</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {limit && posts.length > limit ? (
        <div className="blog-more"><Link className="button button-outline-dark" href="/blog/">Ver todos los artículos ({posts.length}) →</Link></div>
      ) : null}

      {selected ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelected(null);
        }}>
          <div className="comment-modal" role="dialog" aria-modal="true" aria-labelledby="comment-title">
            <button className="modal-close" type="button" onClick={() => setSelected(null)} aria-label="Cerrar comentarios">×</button>
            <p className="kicker">Conversación</p>
            <h3 id="comment-title">{selected.title}</h3>
            <form onSubmit={submitComment}>
              <label>
                Nombre
                <input value={author} onChange={(event) => setAuthor(event.target.value)} maxLength={60} required />
              </label>
              <label>
                Comentario
                <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={500} rows={3} required />
              </label>
              <button className="button button-green" type="submit" disabled={saving}>
                {saving ? "Publicando…" : "Publicar comentario"}
              </button>
              {feedback ? <p className="form-feedback" role="status">{feedback}</p> : null}
            </form>
            <div className="comments-list">
              {(data[selected.slug]?.comments ?? []).length ? (
                (data[selected.slug]?.comments ?? []).map((comment) => (
                  <article key={comment.id}>
                    <strong>{comment.author}</strong>
                    <p>{comment.message}</p>
                  </article>
                ))
              ) : <p className="empty-state">Sé la primera persona en comentar.</p>}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function InstagramCarousel() {
  const rail = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<InstagramItem[]>([]);
  const move = (direction: number) => rail.current?.scrollBy({ left: direction * 330, behavior: "smooth" });

  useEffect(() => {
    fetch(api("/public/instagram")).then((response) => response.json()).then((payload: { posts?: InstagramItem[] }) => {
      if (payload.posts?.length) setItems(payload.posts);
    }).catch(() => undefined);
  }, []);

  // Sin publicaciones cargadas se muestran temas de ejemplo que llevan al perfil.
  const lista: InstagramItem[] = items.length ? items : instagramTopics.map((item) => ({ ...item, url: `https://www.instagram.com/${INSTAGRAM_ACCOUNT}/` }));

  return (
    <section className="section instagram-section" id="instagram">
      <div className="section-heading instagram-heading">
        <div>
          <p className="kicker">Sígueme en Instagram</p>
          <h2>@dra.glenys_nutri</h2>
        </div>
        <div className="carousel-controls" aria-label="Controles del carrusel">
          <button type="button" onClick={() => move(-1)} aria-label="Publicaciones anteriores">←</button>
          <button type="button" onClick={() => move(1)} aria-label="Publicaciones siguientes">→</button>
        </div>
      </div>
      <div className="instagram-rail" ref={rail}>
        {lista.map((item, index) => (
          <a
            className={`instagram-card ${item.mediaKey ? "has-photo" : item.color ?? ["insta-green", "insta-pink", "insta-cream"][index % 3]}`}
            href={isInstagramPostUrl(item.url) ? item.url.split("?")[0] : item.url}
            target="_blank"
            rel="noreferrer"
            key={item.id ?? item.title}
          >
            {item.mediaKey ? <img src={mediaUrl(item.mediaKey)} alt="" loading="lazy" decoding="async" /> : null}
            <span>{item.label}</span>
            {!item.mediaKey ? <b aria-hidden="true">{item.symbol ?? <IgGlyph />}</b> : <b />}
            <strong>{item.title}</strong>
            <small>Ver en Instagram ↗</small>
          </a>
        ))}
      </div>
      <a className="instagram-follow" href={`https://www.instagram.com/${INSTAGRAM_ACCOUNT}/`} target="_blank" rel="noreferrer">Seguir a @{INSTAGRAM_ACCOUNT} en Instagram ↗</a>
    </section>
  );
}

function IgGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4.2" /><circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Galería: aparece sola cuando la doctora sube fotos con uso "Galería pública" desde el panel. */
export function GallerySection() {
  const [images, setImages] = useState<Array<{ id: number; objectKey: string; title: string; altText: string }>>([]);
  useEffect(() => {
    fetch(api("/public/gallery")).then((response) => response.json()).then((payload: { images?: typeof images }) => setImages(payload.images ?? [])).catch(() => undefined);
  }, []);
  if (!images.length) return null;
  return (
    <section className="section gallery-section" id="galeria">
      <div className="section-heading split-heading"><div><p className="kicker">Galería</p><h2>Una práctica cercana a las familias</h2></div><p>Momentos de consulta, actividades clínicas y educación comunitaria.</p></div>
      <div className="dynamic-gallery">{images.map((item) => <article key={item.id}><img src={mediaUrl(item.objectKey)} alt={item.altText || item.title} loading="lazy" />{item.title ? <span>{item.title}</span> : null}</article>)}</div>
    </section>
  );
}

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setStatus("");
    try {
      const response = await fetch(api("/subscribe"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };
      setStatus(payload.message ?? payload.error ?? "No pudimos completar la suscripción");
      if (response.ok) setEmail("");
    } catch {
      setStatus("No pudimos completar la suscripción en este momento");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="newsletter" id="suscripcion">
      <div>
        <p className="kicker">Comunidad Glenys Nina</p>
        <h2>Consejos útiles, directo a tu correo</h2>
        <p>Recibe nuevas publicaciones y recomendaciones para acompañar el crecimiento de tus hijos.</p>
      </div>
      <form onSubmit={subscribe}>
        <label className="sr-only" htmlFor="subscriber-email">Correo electrónico</label>
        <input id="subscriber-email" type="email" placeholder="Tu correo electrónico" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <button className="button button-pink" type="submit" disabled={sending}>{sending ? "Enviando…" : "Suscribirme"}</button>
        {status ? <p className="newsletter-status" role="status">{status}</p> : null}
      </form>
    </section>
  );
}
