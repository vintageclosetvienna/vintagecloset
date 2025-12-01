'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, X, Spinner } from '@phosphor-icons/react';
import { 
  ImageUpload, 
  FormInput, 
  FormTextarea, 
  FormSelect, 
  FormToggle 
} from '@/components/admin';
import { Button } from '@/components/ui/Button';
import { JOURNAL_CATEGORIES, calculateReadTime, generateSlug } from '@/lib/journal-data';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const CATEGORY_OPTIONS = JOURNAL_CATEGORIES
  .filter(cat => cat !== 'All')
  .map(cat => ({ value: cat, label: cat }));

interface JournalFormData {
  coverImage: string[];
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  featured: boolean;
}

export default function NewJournalPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [formData, setFormData] = useState<JournalFormData>({
    coverImage: [],
    title: '',
    excerpt: '',
    content: '',
    category: '',
    tags: [],
    featured: false,
  });

  const updateField = <K extends keyof JournalFormData>(
    field: K, 
    value: JournalFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      updateField('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    updateField('tags', formData.tags.filter(t => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const slug = generateSlug(formData.title);
      const readTime = calculateReadTime(formData.content);
      const coverImage = formData.coverImage[0] || '';

      if (isSupabaseConfigured()) {
        // Save to Supabase
        const { error: insertError } = await supabase
          .from('journal_articles')
          .insert({
            slug,
            title: formData.title,
            excerpt: formData.excerpt,
            content: formData.content,
            category: formData.category,
            cover_image: coverImage,
            images: formData.coverImage,
            author: 'Vintage Closet Team',
            published_at: new Date().toISOString().split('T')[0],
            read_time: readTime,
            featured: formData.featured,
            tags: formData.tags,
            is_draft: isDraft,
          });

        if (insertError) {
          // Check for duplicate slug
          if (insertError.code === '23505') {
            setError('An article with this title already exists. Please choose a different title.');
            setIsSubmitting(false);
            return;
          }
          throw insertError;
        }
      } else {
        // Mock save for local development
        console.log('Journal data (mock):', { 
          slug,
          ...formData, 
          isDraft,
          readTime,
          publishedAt: new Date().toISOString().split('T')[0],
        });
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      router.push('/admin/journal');
    } catch (err) {
      console.error('Error creating journal entry:', err);
      setError('Failed to create journal entry. Please try again.');
      setIsSubmitting(false);
    }
  };

  const isValid = formData.title && formData.excerpt && formData.content && formData.category;

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/admin/journal" 
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors mb-4"
        >
          <ArrowLeft size={16} weight="bold" />
          Back to Journal
        </Link>
        <h1 className="text-2xl font-display font-bold text-ink">New Journal Entry</h1>
        <p className="text-muted mt-1">Write a new article for your readers.</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8">
        {/* Cover Image */}
        <ImageUpload
          label="Cover Image"
          value={formData.coverImage}
          onChange={(urls) => updateField('coverImage', urls)}
          multiple={false}
        />

        {/* Title & Excerpt */}
        <div className="bg-white rounded-xl border border-hairline p-6 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Header</h2>
          
          <FormInput
            label="Title"
            placeholder="e.g. The Art of Archiving"
            value={formData.title}
            onChange={(e) => updateField('title', e.target.value)}
            required
          />

          <FormInput
            label="Excerpt / Subheader"
            placeholder="A short preview that appears on cards and in search results"
            value={formData.excerpt}
            onChange={(e) => updateField('excerpt', e.target.value)}
            required
          />
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl border border-hairline p-6 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Content</h2>
          
          <FormTextarea
            label="Article Body"
            placeholder="Write your article here. Use line breaks for paragraphs."
            value={formData.content}
            onChange={(e) => updateField('content', e.target.value)}
            rows={12}
            required
          />

          {formData.content && (
            <p className="text-xs text-muted">
              Estimated read time: {calculateReadTime(formData.content)} min
            </p>
          )}
        </div>

        {/* Categorization */}
        <div className="bg-white rounded-xl border border-hairline p-6 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Categorization</h2>
          
          <FormSelect
            label="Category"
            options={CATEGORY_OPTIONS}
            value={formData.category}
            onChange={(e) => updateField('category', e.target.value)}
            placeholder="Select a category"
            required
          />

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Tags</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.tags.map(tag => (
                <span 
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface rounded-lg text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-muted hover:text-ink transition-colors"
                  >
                    <X size={12} weight="bold" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                className="flex-1 h-11 px-4 rounded-lg border border-hairline bg-white text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent-start focus:ring-2 focus:ring-accent-start/20 transition-all"
              />
              <Button type="button" variant="secondary" onClick={addTag}>
                Add
              </Button>
            </div>
            <p className="text-xs text-muted mt-2">Press Enter or comma to add a tag</p>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-xl border border-hairline p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted mb-6">Settings</h2>
          
          <FormToggle
            label="Featured Article"
            description="Show this article prominently on the journal page"
            checked={formData.featured}
            onChange={(checked) => updateField('featured', checked)}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4">
          <Button 
            type="submit" 
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner size={16} className="animate-spin mr-2" />
                Publishing...
              </>
            ) : (
              'Publish Entry'
            )}
          </Button>
          <Button 
            type="button" 
            variant="secondary"
            onClick={(e) => handleSubmit(e, true)}
            disabled={!formData.title || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Draft'}
          </Button>
          <Link href="/admin/journal">
            <Button type="button" variant="ghost" disabled={isSubmitting}>
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
