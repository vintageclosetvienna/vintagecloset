'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Reveal } from '@/components/shared/Reveal';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Clock, ArrowRight, Spinner } from '@phosphor-icons/react';
import { 
  getJournalArticle, 
  getRelatedArticles,
  type JournalArticle,
} from '@/lib/journal-data';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

export default function ArticlePage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [article, setArticle] = useState<JournalArticle | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<JournalArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchArticle() {
      setIsLoading(true);
      setNotFound(false);

      try {
        // Fetch the article
        const articleData = await getJournalArticle(slug);
        
        if (!articleData) {
          setNotFound(true);
        } else {
          // Don't show drafts on the public site
          if (articleData.isDraft) {
            setNotFound(true);
          } else {
            setArticle(articleData);
            // Fetch related articles
            const related = await getRelatedArticles(articleData.category, slug, 2);
            setRelatedArticles(related);
          }
        }
      } catch (error) {
        console.error('Error fetching article:', error);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <Spinner size={48} className="animate-spin text-accent-start mx-auto mb-4" />
          <p className="text-muted">Loading article...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (notFound || !article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold text-ink mb-4">Article not found</h1>
          <p className="text-muted mb-6">The article you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link href="/journal">
            <Button>Back to Journal</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Split content into paragraphs
  const paragraphs = article.content.split('\n\n').filter(p => p.trim());

  return (
    <article className="min-h-screen bg-surface">
      {/* Hero */}
      <div className="relative h-[50vh] md:h-[60vh]">
        <Image 
          src={article.coverImage} 
          alt={article.title} 
          fill 
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 text-white">
          <div className="container mx-auto max-w-4xl">
            <Reveal>
              <Link 
                href="/journal"
                className="inline-flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-colors mb-6 group"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back to Journal
              </Link>
              
              <span className="block text-sm font-bold uppercase tracking-wider mb-4 text-accent-start">
                {article.category}
              </span>
              
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-[1.1]">
                {article.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
                <span>By {article.author}</span>
                <span className="hidden sm:inline">•</span>
                <span>{formatDate(article.publishedAt)}</span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} />
                  {article.readTime} min read
                </span>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-2xl mx-auto">
          {/* Lead paragraph */}
          {paragraphs[0] && (
            <Reveal>
              <p className="text-xl md:text-2xl font-medium leading-relaxed text-ink mb-8">
                {paragraphs[0]}
              </p>
            </Reveal>
          )}

          {/* Body paragraphs */}
          <div className="space-y-6">
            {paragraphs.slice(1).map((paragraph, idx) => {
              // Check if it's a quote (starts with ")
              const isQuote = paragraph.startsWith('"') && paragraph.endsWith('"');
              
              if (isQuote) {
                return (
                  <Reveal key={idx} delay={0.1}>
                    <blockquote className="my-10 border-l-4 border-accent-start pl-6 py-2">
                      <p className="text-2xl font-display font-bold italic text-ink">
                        {paragraph}
                      </p>
                    </blockquote>
                  </Reveal>
                );
              }
              
              return (
                <Reveal key={idx} delay={0.05 * idx}>
                  <p className="text-lg text-muted leading-relaxed">
                    {paragraph}
                  </p>
                </Reveal>
              );
            })}
          </div>

          {/* Tags */}
          <Reveal className="mt-12 pt-8 border-t border-hairline">
            <div className="flex flex-wrap gap-2">
              {article.tags.map(tag => (
                <span 
                  key={tag} 
                  className="px-3 py-1.5 bg-white border border-hairline rounded-md text-sm text-muted hover:border-accent-start hover:text-accent-start transition-colors cursor-pointer"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Reveal>

          {/* Share / Author */}
          <Reveal className="mt-12 p-6 bg-white rounded-2xl border border-hairline">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-start to-accent-end flex items-center justify-center text-white font-bold text-lg">
                VC
              </div>
              <div>
                <p className="font-bold text-ink">{article.author}</p>
                <p className="text-sm text-muted">Curators of vintage excellence</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="py-16 bg-white border-t border-hairline">
          <div className="container mx-auto px-4">
            <Reveal>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-ink mb-8 text-center">
                More in {article.category}
              </h2>
            </Reveal>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {relatedArticles.map((related, idx) => (
                <Reveal key={related.id} delay={idx * 0.1}>
                  <Link href={`/journal/${related.slug}`} className="group block">
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-4">
                      <Image 
                        src={related.coverImage} 
                        alt={related.title} 
                        fill 
                        className="object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                    </div>
                    <h3 className="text-xl font-display font-bold text-ink group-hover:text-accent-start transition-colors mb-2">
                      {related.title}
                    </h3>
                    <p className="text-muted text-sm line-clamp-2 mb-3">
                      {related.excerpt}
                    </p>
                    <span className="text-sm font-bold text-accent-start flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Read <ArrowRight size={14} weight="bold" />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 md:py-20 bg-surface">
        <div className="container mx-auto px-4">
          <Reveal className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-ink mb-4">
              Explore the Collection
            </h2>
            <p className="text-muted mb-8 max-w-md mx-auto">
              Discover the pieces we write about. Each item in our shop has a story.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/women">
                <Button>Shop Women</Button>
              </Link>
              <Link href="/men">
                <Button variant="secondary">Shop Men</Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </article>
  );
}
