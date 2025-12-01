'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '@/components/shared/Reveal';
import { ArrowRight, Clock, BookOpen } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { 
  getJournalArticles,
  type JournalArticle 
} from '@/lib/journal-data';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

function ArticleCard({ article, index }: { article: JournalArticle; index: number }) {
  return (
    <Reveal delay={index * 0.08} className="w-full">
      <Link href={`/journal/${article.slug}`} className="group block w-full">
        <article className="w-full h-[400px] bg-white rounded-2xl overflow-hidden border border-hairline shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
          {/* Image - Fixed height */}
          <div className="relative h-[180px] w-full overflow-hidden bg-surface">
            <Image 
              src={article.coverImage} 
              alt={article.title} 
              fill 
              className="object-cover transition-transform duration-700 group-hover:scale-105" 
            />
            {/* Category badge */}
            <div className="absolute top-4 left-4">
              <span className="inline-block px-2.5 py-1 bg-white/90 backdrop-blur-sm text-xs font-bold uppercase tracking-wider text-ink rounded-md shadow-sm">
                {article.category}
              </span>
            </div>
          </div>
          
          {/* Content - Fixed height */}
          <div className="p-5 h-[220px] w-full flex flex-col">
            {/* Meta */}
            <div className="flex items-center gap-3 text-xs text-muted mb-2">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {article.readTime} min
              </span>
              <span>•</span>
              <span>{formatDate(article.publishedAt)}</span>
            </div>
            
            {/* Title */}
            <h2 className="text-lg font-display font-bold text-ink group-hover:text-accent-start transition-colors mb-2 leading-tight line-clamp-1 truncate">
              {article.title}
            </h2>
            
            {/* Excerpt */}
            <p className="text-muted text-sm leading-relaxed line-clamp-2 mb-3">
              {article.excerpt}
            </p>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-3 overflow-hidden h-6">
              {article.tags.slice(0, 3).map(tag => (
                <span 
                  key={tag} 
                  className="text-xs px-2 py-0.5 bg-surface rounded-full text-muted whitespace-nowrap"
                >
                  {tag}
                </span>
              ))}
            </div>
            
            {/* Read more */}
            <div className="flex items-center text-sm font-bold text-accent-start group-hover:translate-x-2 transition-transform mt-auto">
              Read Story <ArrowRight className="ml-2" weight="bold" size={14} />
            </div>
          </div>
        </article>
      </Link>
    </Reveal>
  );
}

function ArticleCardSkeleton() {
  return (
    <div className="w-full h-[400px] bg-white rounded-2xl overflow-hidden border border-hairline animate-pulse">
      <div className="h-[180px] bg-surface" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-surface rounded w-1/3" />
        <div className="h-5 bg-surface rounded w-3/4" />
        <div className="h-4 bg-surface rounded w-full" />
        <div className="h-4 bg-surface rounded w-2/3" />
        <div className="flex gap-2 mt-4">
          <div className="h-5 bg-surface rounded-full w-16" />
          <div className="h-5 bg-surface rounded-full w-12" />
        </div>
      </div>
    </div>
  );
}

export default function JournalPage() {
  const [articles, setArticles] = useState<JournalArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchArticles() {
      setIsLoading(true);
      try {
        const data = await getJournalArticles();
        setArticles(data);
      } catch (error) {
        console.error('Error fetching articles:', error);
        setArticles([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchArticles();
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <div className="relative min-h-[50vh] md:min-h-[45vh] flex items-end">
        <Image 
          src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop"
          alt="The Journal"
          fill
          className="object-cover"
          priority
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
        
        <div className="container mx-auto px-4 pb-12 md:pb-16 relative z-10">
          <Reveal>
            <div className="max-w-2xl">
              <span className="inline-block px-3 py-1 bg-gradient-to-r from-accent-start to-accent-end text-white text-xs font-bold uppercase tracking-wider rounded-md mb-4">
                Stories & Culture
              </span>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-4 leading-[1.05]">
                The Journal
              </h1>
              
              <p className="text-lg md:text-xl text-white/80 max-w-lg leading-relaxed">
                Exploring vintage culture, style guides, and stories from the archive. Written from Vienna with love.
              </p>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="container mx-auto px-4 py-12 md:py-16 max-w-6xl">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <ArticleCardSkeleton key={i} />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <BookOpen size={32} className="text-muted" />
            </div>
            <h2 className="text-xl font-display font-bold text-ink mb-2">No articles yet</h2>
            <p className="text-muted">Check back soon for stories and updates.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, idx) => (
              <ArticleCard key={article.id} article={article} index={idx} />
            ))}
          </div>
        )}
      </div>

      {/* Newsletter CTA */}
      <section className="py-16 md:py-24 bg-white border-t border-hairline">
        <div className="container mx-auto px-4">
          <Reveal className="max-w-2xl mx-auto text-center">
            <div className="w-12 h-12 mx-auto mb-6 rounded-full bg-accent-start/10 flex items-center justify-center">
              <BookOpen size={24} className="text-accent-start" weight="duotone" />
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-ink mb-4">
              Stay in the Loop
            </h2>
            <p className="text-muted text-lg mb-8 max-w-md mx-auto">
              Get new articles, drop announcements, and exclusive stories delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="your@email.com"
                className="flex-1 h-12 px-4 rounded-md border border-hairline bg-surface text-ink placeholder:text-muted focus:outline-none focus:border-accent-start focus:ring-2 focus:ring-accent-start/20 transition-all"
              />
              <Button className="h-12 px-6">
                Subscribe
              </Button>
            </div>
            <p className="text-xs text-muted mt-4">
              No spam. Unsubscribe anytime.
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
