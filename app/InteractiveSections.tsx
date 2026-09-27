"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

type Comment = { id: number; author: string; message: string; createdAt: string };
type Engagement = { likes: number; comments: Comment[] };
type PublicPost = { id?: number; slug: string; category: string; title: string; excerpt: string; content?: string; coverKey?: string | null; publishedAt?: string | null; date?: string; read?: string; theme?: string; symbol?: string };

const fallbackPosts: PublicPost[] = [
  {
    slug: "alimentacion-complementaria",
    category: "Nutrición infantil",
    title: "Alimentación complementaria sin estrés",
    excerpt: "Señales, texturas y hábitos para acompañar este momento con calma y seguridad.",
    date: "12 julio 2026",
    read: "5 min",
    theme: "post-green",
    symbol: "🍐",
  },
  {
    slug: "hidratacion-saludable",
    category: "Vida saludable",
    title: "Hidratación real: más agua, menos azúcar",
    excerpt: "Cómo elegir bebidas y alimentos que sí aportan hidratación durante los días de calor.",
    date: "5 julio 2026",
    read: "4 min",
    theme: "post-pink",
    symbol: "🍉",
  },
  {
    slug: "hierro-en-la-infancia",
    category: "Crecimiento",
    title: "Hierro en la infancia: pequeñas decisiones, gran impacto",
    excerpt: "Una guía clara sobre fuentes de hierro y combinaciones que favorecen su absorción.",
    date: "28 junio 2026",
    read: "6 min",
    theme: "post-cream",
    symbol: "🥬",
  },
];

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
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const value = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `visitor-${Date.now()}`;
  window.localStorage.setItem(key, value);
  return value;
}

export function BlogSection() {
  const [posts, setPosts] = useState<PublicPost[]>(fallbackPosts);
  const [data, setData] = useState<Record<string, Engagement>>({});
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<PublicPost | null>(null);
  const [author, setAuthor] = useState("");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  async function load(slug: string) {
    try {
      const response = await fetch(`/api/engagement?post=${encodeURIComponent(slug)}`);
      const payload = (await response.json()) as Engagement;
      setData((current) => ({ ...current, [slug]: { likes: payload.likes ?? 0, comments: payload.comments ?? [] } }));
    } catch {
      setData((current) => ({ ...current, [slug]: { likes: 0, comments: [] } }));
    }
  }

  useEffect(() => {
    fetch("/api/public/posts")
      .then((response) => response.json())
      .then((payload: { posts?: PublicPost[] }) => {
        if (payload.posts?.length) setPosts(payload.posts);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => { posts.forEach((post) => void load(post.slug)); }, [posts]);

  async function like(slug: string) {
    if (liked.has(slug)) return;
    setLiked((current) => new Set(current).add(slug));
    setData((current) => ({
      ...current,
      [slug]: { likes: (current[slug]?.likes ?? 0) + 1, comments: current[slug]?.comments ?? [] },
    }));
    try {
      const response = await fetch("/api/engagement", {
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
      const response = await fetch("/api/engagement", {
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
    <section className="section blog-section" id="blog">
      <div className="section-heading split-heading">
        <div>
          <p className="kicker">Blog de la doctora</p>
          <h2>Información que acompaña decisiones reales</h2>
        </div>
        <p>Contenido educativo sobre pediatría, nutrición clínica y bienestar familiar.</p>
      </div>

      <div className="blog-grid">
        {posts.map((post, index) => {
          const engagement = data[post.slug] ?? { likes: 0, comments: [] };
          const themes = ["post-green", "post-pink", "post-cream"];
          const symbols = ["🍐", "🍉", "🥬"];
          return (
            <article className="blog-card" key={post.slug}>
              <div className={`post-cover ${post.theme ?? themes[index % themes.length]}`} style={post.coverKey ? { backgroundImage: `url(/media/${encodeURIComponent(post.coverKey)})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
                <span>{post.category}</span>
                {!post.coverKey ? <b aria-hidden="true">{post.symbol ?? symbols[index % symbols.length]}</b> : null}
              </div>
              <div className="post-body">
                <small>{post.date ?? post.publishedAt?.slice(0, 10) ?? "Nueva publicación"}{post.read ? ` · ${post.read} de lectura` : ""}</small>
                <h3><a href={`/blog/${post.slug}`}>{post.title}</a></h3>
                <p>{post.excerpt}</p>
                <a className="read-post" href={`/blog/${post.slug}`}>Leer artículo →</a>
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
  const [items, setItems] = useState<InstagramItem[]>(
    instagramTopics.map((item) => ({ ...item, url: `https://www.instagram.com/${INSTAGRAM_ACCOUNT}/` })),
  );
  const move = (direction: number) => rail.current?.scrollBy({ left: direction * 330, behavior: "smooth" });

  useEffect(() => {
    fetch("/api/public/instagram").then((response) => response.json()).then((payload: { posts?: InstagramItem[] }) => {
      if (payload.posts?.length) setItems(payload.posts);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!items.some((item) => isInstagramPostUrl(item.url))) return;
    const processEmbeds = () => window.setTimeout(() => window.instgrm?.Embeds.process(), 0);
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://www.instagram.com/embed.js"]');
    if (existing) {
      if (window.instgrm) processEmbeds();
      else existing.addEventListener("load", processEmbeds, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.instagram.com/embed.js";
    script.addEventListener("load", processEmbeds, { once: true });
    document.body.appendChild(script);
  }, [items]);

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
        {items.map((item, index) => isInstagramPostUrl(item.url) ? (
          <article className="instagram-embed-card" key={item.id ?? item.url}>
            <blockquote
              className="instagram-media"
              data-instgrm-permalink={item.url}
              data-instgrm-version="14"
            >
              <a href={item.url} target="_blank" rel="noreferrer">Ver publicación de @{INSTAGRAM_ACCOUNT}</a>
            </blockquote>
          </article>
        ) : (
          <a className={`instagram-card ${item.color ?? ["insta-green", "insta-pink", "insta-cream"][index % 3]}`} href={item.url} target="_blank" rel="noreferrer" key={item.id ?? item.title} style={item.mediaKey ? { backgroundImage: `linear-gradient(to top, rgba(48,39,32,.72), transparent 65%), url(/media/${encodeURIComponent(item.mediaKey)})`, backgroundSize: "cover", backgroundPosition: "center", color: "white" } : undefined}>
            <span>{item.label}</span>
            {!item.mediaKey ? <b>{item.symbol}</b> : <b />}
            <strong>{item.title}</strong>
            <small>Ver en Instagram ↗</small>
          </a>
        ))}
      </div>
      <p className="integration-note">
        Publicaciones seleccionadas y administradas desde el panel privado.
      </p>
    </section>
  );
}

export function GallerySection() {
  const [images, setImages] = useState<Array<{ id: number; objectKey: string; title: string; altText: string }>>([]);
  useEffect(() => {
    fetch("/api/public/gallery").then((response) => response.json()).then((payload: { images?: typeof images }) => setImages(payload.images ?? [])).catch(() => undefined);
  }, []);
  return (
    <section className="section gallery-section" id="galeria">
      <div className="section-heading split-heading"><div><p className="kicker">Galería profesional</p><h2>Una práctica cercana a las familias</h2></div><p>Fotografías autorizadas de consultas, actividades clínicas y educación comunitaria.</p></div>
      {images.length ? <div className="dynamic-gallery">{images.map((item) => <article key={item.id}><img src={`/media/${encodeURIComponent(item.objectKey)}`} alt={item.altText || item.title} /><span>{item.title}</span></article>)}</div> : <div className="gallery-grid">
        <article className="gallery-item gallery-main"><img src="/assets/hero-doctor.png" alt="Atención clínica pediátrica y nutricional" /><div><span>Consulta</span><strong>Atención pediátrica integral</strong></div></article>
        <article className="gallery-item gallery-placeholder gallery-green"><b aria-hidden="true">🌿</b><div><span>Nutrición</span><strong>Educación alimentaria</strong></div></article>
        <article className="gallery-item gallery-placeholder gallery-pink"><b aria-hidden="true">♡</b><div><span>Comunidad</span><strong>Actividades con familias</strong></div></article>
        <article className="gallery-item gallery-brand"><img src="/assets/logo-glenys.png" alt="Logo de la Dra. Glenys Nina" /><div><span>Compromiso</span><strong>Cuidar y nutrir</strong></div></article>
      </div>}
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
      const response = await fetch("/api/subscribe", {
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
