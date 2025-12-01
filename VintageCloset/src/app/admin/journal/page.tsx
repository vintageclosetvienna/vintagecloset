'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, PencilSimple, Trash, Clock, X, Star, Eye, EyeSlash, Spinner } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { FormInput, FormSelect, FormTextarea, ImageUpload } from '@/components/admin';
import { 
  JournalArticle, 
  JOURNAL_CATEGORIES, 
  getAllJournalArticles,
  calculateReadTime,
} from '@/lib/journal-data';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const CATEGORY_OPTIONS = JOURNAL_CATEGORIES.filter(c => c !== 'All').map(cat => ({
  value: cat,
  label: cat,
}));

// Edit Journal Modal Component
function EditJournalModal({
  article,
  onClose,
  onSave,
  isSaving,
}: {
  article: JournalArticle;
  onClose: () => void;
  onSave: (articleId: string, data: Partial<JournalArticle>) => Promise<void>;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
    category: article.category,
    coverImage: article.coverImage,
    images: article.images || [article.coverImage],
    tags: article.tags.join(', '),
    featured: article.featured,
    readTime: article.readTime,
    publishedAt: article.publishedAt,
    isDraft: article.isDraft || false,
  });

  const updateField = (field: string, value: string | number | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    await onSave(article.id, {
      title: formData.title,
      excerpt: formData.excerpt,
      content: formData.content,
      category: formData.category as JournalArticle['category'],
      coverImage: formData.images[0] || formData.coverImage,
      images: formData.images,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      featured: formData.featured,
      readTime: formData.readTime || calculateReadTime(formData.content),
      publishedAt: formData.publishedAt,
      isDraft: formData.isDraft,
    });
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  const isValid = formData.title && formData.excerpt && formData.category;

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{ isolation: 'isolate' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
          onWheel={handleWheel}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-hairline flex-shrink-0">
            <div>
              <h2 className="font-display font-bold text-xl text-ink">Edit Journal Entry</h2>
              <p className="text-sm text-muted mt-1">{article.slug}</p>
            </div>
            <button onClick={onClose} className="p-2 text-muted hover:text-ink transition-colors">
              <X size={20} weight="bold" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div
            className="p-6 space-y-6 flex-1 min-h-0"
            style={{
              overflowY: 'auto',
              overscrollBehavior: 'contain',
            }}
          >
            {/* Cover Image */}
            <ImageUpload
              label="Cover Image"
              value={formData.images}
              onChange={(urls) => updateField('images', urls)}
              multiple
            />

            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Basic Information</h3>

              <FormInput
                label="Title"
                placeholder="Enter article title"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                required
              />

              <FormTextarea
                label="Excerpt"
                placeholder="Short description for previews"
                value={formData.excerpt}
                onChange={(e) => updateField('excerpt', e.target.value)}
                rows={2}
              />

              <FormTextarea
                label="Content"
                placeholder="Full article content..."
                value={formData.content}
                onChange={(e) => updateField('content', e.target.value)}
                rows={6}
              />
            </div>

            {/* Categorization */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Categorization</h3>

              <FormSelect
                label="Category"
                options={CATEGORY_OPTIONS}
                value={formData.category}
                onChange={(e) => updateField('category', e.target.value)}
                required
              />

              <FormInput
                label="Tags"
                placeholder="Separate tags with commas"
                value={formData.tags}
                onChange={(e) => updateField('tags', e.target.value)}
              />
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Settings</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Read Time (minutes)"
                  type="number"
                  value={formData.readTime.toString()}
                  onChange={(e) => updateField('readTime', parseInt(e.target.value) || 0)}
                />

                <FormInput
                  label="Publish Date"
                  type="date"
                  value={formData.publishedAt}
                  onChange={(e) => updateField('publishedAt', e.target.value)}
                />
              </div>

              {/* Featured Toggle */}
              <div className="flex items-center justify-between p-4 bg-surface rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Star size={20} className="text-amber-600" weight={formData.featured ? 'fill' : 'regular'} />
                  </div>
                  <div>
                    <p className="font-medium text-ink">Featured Article</p>
                    <p className="text-xs text-muted">Show this article prominently</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => updateField('featured', !formData.featured)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    formData.featured ? 'bg-accent-start' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      formData.featured ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Draft Toggle */}
              <div className="flex items-center justify-between p-4 bg-surface rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    {formData.isDraft ? (
                      <EyeSlash size={20} className="text-gray-600" />
                    ) : (
                      <Eye size={20} className="text-green-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-ink">{formData.isDraft ? 'Draft' : 'Published'}</p>
                    <p className="text-xs text-muted">{formData.isDraft ? 'Not visible to customers' : 'Visible to everyone'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => updateField('isDraft', !formData.isDraft)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    !formData.isDraft ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      !formData.isDraft ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-hairline flex-shrink-0">
            <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleSave} disabled={!isValid || isSaving}>
              {isSaving ? (
                <>
                  <Spinner size={16} className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JournalListPage() {
  const [articles, setArticles] = useState<JournalArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingArticle, setEditingArticle] = useState<JournalArticle | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch articles on mount
  useEffect(() => {
    async function fetchArticles() {
      setIsLoading(true);
      try {
        const data = await getAllJournalArticles();
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

  const handleSaveArticle = async (articleId: string, data: Partial<JournalArticle>) => {
    setIsSaving(true);
    try {
      if (isSupabaseConfigured()) {
        // Convert frontend format to database format
        const dbData = {
          title: data.title,
          excerpt: data.excerpt,
          content: data.content,
          category: data.category,
          cover_image: data.coverImage,
          images: data.images,
          tags: data.tags,
          featured: data.featured,
          read_time: data.readTime,
          published_at: data.publishedAt,
          is_draft: data.isDraft,
        };

        const { error } = await supabase
          .from('journal_articles')
          .update(dbData as never)
          .eq('id', articleId);

        if (error) throw error;

        // Refetch articles
        const updatedArticles = await getAllJournalArticles();
        setArticles(updatedArticles);
      } else {
        // Mock update for local development
        setArticles(prev => prev.map(a => 
          a.id === articleId ? { ...a, ...data } : a
        ));
      }
      setEditingArticle(null);
    } catch (error) {
      console.error('Error saving article:', error);
      alert('Failed to save article. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      return;
    }

    setDeletingId(articleId);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('journal_articles')
          .delete()
          .eq('id', articleId);

        if (error) throw error;
      }

      // Remove from local state
      setArticles(prev => prev.filter(a => a.id !== articleId));
    } catch (error) {
      console.error('Error deleting article:', error);
      alert('Failed to delete article. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const publishedCount = articles.filter(a => !a.isDraft).length;
  const draftCount = articles.filter(a => a.isDraft).length;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Journal Entries</h1>
          <p className="text-muted mt-1">
            {publishedCount} published{draftCount > 0 && `, ${draftCount} drafts`}
          </p>
        </div>
        <Link href="/admin/journal/new">
          <Button className="gap-2">
            <Plus size={16} weight="bold" />
            New Entry
          </Button>
        </Link>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-hairline overflow-hidden animate-pulse">
              <div className="aspect-[16/10] bg-surface" />
              <div className="p-5 space-y-3">
                <div className="h-3 bg-surface rounded w-1/3" />
                <div className="h-5 bg-surface rounded w-3/4" />
                <div className="h-4 bg-surface rounded w-full" />
                <div className="h-4 bg-surface rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={32} className="text-muted" />
          </div>
          <h2 className="text-xl font-display font-bold text-ink mb-2">No journal entries yet</h2>
          <p className="text-muted mb-6">Create your first journal entry to share with your customers.</p>
          <Link href="/admin/journal/new">
            <Button className="gap-2">
              <Plus size={16} weight="bold" />
              Create Entry
            </Button>
          </Link>
        </div>
      ) : (
        /* Entries Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <article 
              key={article.id}
              className={`bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow group ${
                article.isDraft ? 'border-amber-200' : 'border-hairline'
              }`}
            >
              {/* Image */}
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={article.coverImage}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                  <span className="inline-block px-2.5 py-1 bg-white/90 backdrop-blur-sm text-xs font-bold uppercase tracking-wider text-ink rounded-md">
                    {article.category}
                  </span>
                </div>
                {/* Status Badges */}
                <div className="absolute top-3 right-3 flex gap-2">
                  {article.isDraft && (
                    <span className="inline-block px-2.5 py-1 bg-amber-100 text-xs font-bold uppercase tracking-wider text-amber-700 rounded-md">
                      Draft
                    </span>
                  )}
                  {article.featured && !article.isDraft && (
                    <span className="inline-block px-2.5 py-1 bg-gradient-to-r from-accent-start to-accent-end text-xs font-bold uppercase tracking-wider text-white rounded-md">
                      Featured
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-muted mb-2">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {article.readTime} min read
                  </span>
                  <span>•</span>
                  <span>{new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>

                {/* Title */}
                <h2 className="font-display font-bold text-lg text-ink mb-2 line-clamp-2">
                  {article.title}
                </h2>

                {/* Excerpt */}
                <p className="text-sm text-muted line-clamp-2 mb-4">
                  {article.excerpt}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {article.tags.slice(0, 3).map(tag => (
                    <span 
                      key={tag}
                      className="text-xs px-2 py-0.5 bg-surface rounded-full text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-hairline">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1 gap-2"
                    onClick={() => setEditingArticle(article)}
                  >
                    <PencilSimple size={14} weight="bold" />
                    Edit
                  </Button>
                  <button 
                    className="p-2 text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    onClick={() => handleDeleteArticle(article.id)}
                    disabled={deletingId === article.id}
                  >
                    {deletingId === article.id ? (
                      <Spinner size={16} className="animate-spin" />
                    ) : (
                      <Trash size={16} weight="bold" />
                    )}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingArticle && (
        <EditJournalModal
          article={editingArticle}
          onClose={() => setEditingArticle(null)}
          onSave={handleSaveArticle}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
