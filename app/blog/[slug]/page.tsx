import type { Metadata } from "next";
import { ArticlePage } from "./ArticlePage";
import { buildPost, buildPostList, buildPostSlugs } from "../../../lib/posts";
import { SITE_URL, mediaUrl } from "../../../lib/api";

export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await buildPostSlugs();
  // Next exige al menos una ruta en export estático; "_" nunca existe y muestra "no encontrado".
  return (slugs.length ? slugs : ["_"]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await buildPost(slug);
  if (!post) return { title: "Artículo | Dra. Glenys Nina Cuevas" };
  const url = `${SITE_URL}/blog/${post.slug}/`;
  return {
    title: `${post.title} | Dra. Glenys Nina Cuevas`,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: "article", url, title: post.title, description: post.excerpt, locale: "es_DO",
      siteName: "Dra. Glenys Nina Cuevas", images: [{ url: post.coverKey ? mediaUrl(post.coverKey) : `${SITE_URL}/assets/hero-doctor.jpg` }],
      publishedTime: post.publishedAt ?? undefined,
    },
  };
}

export default async function BlogArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, lista] = await Promise.all([buildPost(slug), buildPostList()]);
  return <ArticlePage slug={slug} initial={post} lista={lista} />;
}
