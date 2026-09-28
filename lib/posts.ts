// Lectura de artículos durante la generación del sitio (build). Si la API no responde, el build no falla:
// los artículos se cargarán en el navegador desde la página 404 de respaldo.
import { api } from "./api";
import type { Post } from "../app/blog/[slug]/ArticlePage";

async function getJson<T>(path: string): Promise<T | null> {
  for (let intento = 1; intento <= 3; intento++) {
    try {
      const r = await fetch(api(path), { cache: "force-cache", signal: AbortSignal.timeout(15000) });
      if (r.status === 404) return null;
      if (r.ok) return (await r.json()) as T;
    } catch (e) {
      if (intento === 3) console.warn(`No se pudo leer ${path} durante el build:`, (e as Error).message);
    }
  }
  return null;
}

export async function buildPostSlugs(): Promise<string[]> {
  const j = await getJson<{ posts?: { slug: string }[] }>("/public/posts");
  return (j?.posts ?? []).map((p) => p.slug);
}

export async function buildPost(slug: string): Promise<Post | null> {
  const j = await getJson<{ post: Post }>(`/public/posts?slug=${encodeURIComponent(slug)}`);
  return j?.post ?? null;
}
