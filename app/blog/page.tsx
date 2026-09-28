import type { Metadata } from "next";
import { BlogSection, NewsletterForm } from "../InteractiveSections";
import { SiteFooter, SiteHeader, WhatsAppFloat } from "../SiteChrome";
import { buildPostList } from "../../lib/posts";

export const metadata: Metadata = {
  title: "Blog de pediatría y nutrición infantil | Dra. Glenys Nina Cuevas",
  description: "Artículos de la Dra. Glenys Nina sobre alimentación infantil, lactantes, prevención y hábitos saludables en familia.",
  alternates: { canonical: "https://glenysnutri.com/blog/" },
};

export default async function BlogIndex() {
  const posts = await buildPostList();
  return (
    <>
      <SiteHeader activo="blog" />
      <main>
        <section className="blog-hero">
          <p className="kicker">Blog de la doctora</p>
          <h1>Información clara para decisiones reales<span className="dot dot-pink">.</span></h1>
          <p>Artículos sobre pediatría, nutrición infantil y bienestar familiar, escritos por la Dra. Glenys Nina Cuevas.</p>
        </section>
        <BlogSection initialPosts={posts} filtros />
        <NewsletterForm />
      </main>
      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}
