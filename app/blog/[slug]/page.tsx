import { ArticlePage } from "./ArticlePage";

export const dynamic = "force-dynamic";

export default async function BlogArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ArticlePage slug={slug} />;
}
