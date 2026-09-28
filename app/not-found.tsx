"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArticlePage } from "./blog/[slug]/ArticlePage";

// GitHub Pages sirve esta página para cualquier dirección que no exista.
// Si es /blog/<artículo>/ recién publicado (aún sin página generada), lo carga desde la API.
export default function NotFound() {
  const [slug, setSlug] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    const m = window.location.pathname.match(/^\/blog\/([a-z0-9-]+)\/?$/);
    // Solo se puede leer la dirección en el navegador (después de hidratar la página estática).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSlug(m ? m[1] : null);
  }, []);
  if (slug === undefined) return <main className="article-state"><p>Cargando…</p></main>;
  if (slug) return <ArticlePage slug={slug} />;
  return <main className="article-state"><h1>Página no encontrada</h1><Link href="/">Volver al inicio</Link></main>;
}
