import type { Metadata } from "next";
import { cache } from "react";
import { getJournalArticle } from "@/lib/journal-data";
import { SITE_URL, SITE_NAME } from "@/lib/site";

// The article page runs in the browser; its title, share preview and article data for search engines come from here
const getArticle = cache(getJournalArticle);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug).catch(() => null);
  if (!article || article.isDraft) return { title: "Journal", robots: { index: false } };

  const images = article.coverImage ? [article.coverImage] : undefined;
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/journal/${article.slug}` },
    openGraph: { type: "article", title: article.title, description: article.excerpt, url: `/journal/${article.slug}`, images, publishedTime: article.publishedAt, authors: [article.author] },
    twitter: { card: "summary_large_image", title: article.title, description: article.excerpt, images },
  };
}

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug).catch(() => null);
  const jsonLd = article && !article.isDraft
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: article.title,
        description: article.excerpt,
        image: article.coverImage ? [article.coverImage] : undefined,
        datePublished: article.publishedAt,
        author: { "@type": "Person", name: article.author },
        publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: `${SITE_URL}/brand/vintage-closet-logo.png` } },
        mainEntityOfPage: `${SITE_URL}/journal/${article.slug}`,
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      )}
      {children}
    </>
  );
}
