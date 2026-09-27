"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Post = { slug: string; title: string; excerpt: string; content: string; category: string; coverKey: string | null; publishedAt: string | null };

export function ArticlePage({ slug }: { slug: string }) {
  const [post, setPost] = useState<Post | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    fetch(`/api/public/posts?slug=${encodeURIComponent(slug)}`)
      .then(async (response) => { if (!response.ok) throw new Error(); return response.json(); })
      .then((payload: { post: Post }) => setPost(payload.post))
      .catch(() => setMissing(true));
  }, [slug]);
  if (missing) return <main className="article-state"><h1>Artículo no encontrado</h1><Link href="/#blog">Volver al blog</Link></main>;
  if (!post) return <main className="article-state"><p>Cargando artículo…</p></main>;
  return <main className="article-page">
    <header className="article-header"><Link href="/"><Image src="/assets/logo-glenys.png" width={1988} height={602} alt="Dra. Glenys Nina" unoptimized /></Link><Link href="/#blog">← Volver al blog</Link></header>
    <article>
      <div className={`article-cover ${post.coverKey ? "has-photo" : ""}`} style={post.coverKey ? { backgroundImage: `url(/media/${encodeURIComponent(post.coverKey)})` } : undefined}><span>{post.category}</span></div>
      <div className="article-body"><p className="kicker">{post.category}</p><h1>{post.title}</h1><p className="article-excerpt">{post.excerpt}</p><div className="article-meta">Publicado {post.publishedAt?.slice(0,10) ?? "recientemente"}</div><div className="article-content">{post.content.split(/\n+/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div><aside>Este contenido es educativo y no sustituye una consulta médica individual.</aside><a className="button button-green" href="https://wa.me/18295980131?text=Hola%20Dra.%20Glenys%2C%20deseo%20informaci%C3%B3n%20sobre%20una%20consulta." target="_blank">Agendar consulta</a></div>
    </article>
  </main>;
}
