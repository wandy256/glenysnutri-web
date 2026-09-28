"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api, mediaUrl, WHATSAPP_URL } from "../../../lib/api";
import { fechaLarga } from "../../../lib/fecha";

// Una línea corta sin punto final se muestra como subtítulo dentro del artículo.
const esSubtitulo = (t: string) => t.length <= 70 && !/[.:!?…]$/.test(t.trim());

export type Post = { slug: string; title: string; excerpt: string; content: string; category: string; coverKey: string | null; publishedAt: string | null };

/**
 * Página de artículo. Si viene `initial` (generado al publicar el sitio) se muestra al instante;
 * si no (artículo publicado después del último despliegue), se carga desde la API.
 */
export function ArticlePage({ slug, initial = null }: { slug: string; initial?: Post | null }) {
  const [post, setPost] = useState<Post | null>(initial);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    if (!slug) return;
    fetch(api(`/public/posts?slug=${encodeURIComponent(slug)}`))
      .then(async (response) => { if (!response.ok) throw new Error(); return response.json(); })
      .then((payload: { post: Post }) => setPost(payload.post))
      .catch(() => { if (!initial) setMissing(true); });
  }, [slug, initial]);
  if (missing) return <main className="article-state"><h1>Artículo no encontrado</h1><Link href="/#blog">Volver al blog</Link></main>;
  if (!post) return <main className="article-state"><p>Cargando artículo…</p></main>;
  return <main className="article-page">
    <header className="article-header"><Link href="/"><Image src="/assets/logo-glenys.png" width={1988} height={602} alt="Dra. Glenys Nina" unoptimized /></Link><Link href="/#blog">← Volver al blog</Link></header>
    <article>
      <div className={`article-cover ${post.coverKey ? "has-photo" : ""}`} style={post.coverKey ? { backgroundImage: `url(${mediaUrl(post.coverKey)})` } : undefined}><span>{post.category}</span></div>
      <div className="article-body"><p className="kicker">{post.category}</p><h1>{post.title}</h1><p className="article-excerpt">{post.excerpt}</p><div className="article-meta">Publicado el {fechaLarga(post.publishedAt)}</div><div className="article-content">{post.content.split(/\n+/).map((texto, index) => esSubtitulo(texto) ? <h2 key={index}>{texto}</h2> : <p key={index}>{texto}</p>)}</div><aside>Este contenido es educativo y no sustituye una consulta médica individual.</aside><a className="button button-green" href={WHATSAPP_URL} target="_blank" rel="noreferrer">Agendar consulta</a></div>
    </article>
  </main>;
}
