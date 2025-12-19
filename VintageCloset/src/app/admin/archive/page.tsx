'use client';

import { useState, useEffect } from 'react';
import { 
  Sparkles,
  PencilSimple, 
  Trash,
  Plus,
  X,
  MagnifyingGlass,
  Eye,
  Heart,
  Star,
  SpinnerGap
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { FormInput, ImageUpload } from '@/components/admin';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Icon mapping
const ICON_OPTIONS = [
  { value: 'MagnifyingGlass', label: 'Magnifying Glass', icon: MagnifyingGlass },
  { value: 'Eye', label: 'Eye', icon: Eye },
  { value: 'Heart', label: 'Heart', icon: Heart },
  { value: 'Star', label: 'Star', icon: Star },
];

interface ArchiveStory {
  id: string;
  image_url: string;
  title: string;
  location: string;
  tags: string[];
  story_text: string;
  highlight_1_icon: string;
  highlight_1_title: string;
  highlight_1_description: string;
  highlight_2_icon: string;
  highlight_2_title: string;
  highlight_2_description: string;
  highlight_3_icon: string;
  highlight_3_title: string;
  highlight_3_description: string;
  section_header: string;
  section_header_highlight: string;
  sort_order: number;
  is_active: boolean;
}

interface StoryFormData {
  image_url: string;
  title: string;
  location: string;
  tags: string;
  story_text: string;
  highlight_1_icon: string;
  highlight_1_title: string;
  highlight_1_description: string;
  highlight_2_icon: string;
  highlight_2_title: string;
  highlight_2_description: string;
  highlight_3_icon: string;
  highlight_3_title: string;
  highlight_3_description: string;
  section_header: string;
  section_header_highlight: string;
}

export default function ArchiveStoriesPage() {
  const [stories, setStories] = useState<ArchiveStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingStory, setEditingStory] = useState<ArchiveStory | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [sectionSettings, setSectionSettings] = useState({
    header: 'Born from the',
    highlight: 'Archive.'
  });

  // Fetch stories
  const fetchStories = async () => {
    setIsLoading(true);
    
    if (!isSupabaseConfigured()) {
      setStories([]);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('archive_stories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching stories:', error);
      setStories([]);
    } else {
      setStories(data || []);
      if (data && data.length > 0) {
        setSectionSettings({
          header: data[0].section_header,
          highlight: data[0].section_header_highlight,
        });
      }
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleEdit = (story: ArchiveStory) => {
    setEditingStory(story);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this story?')) return;

    if (!isSupabaseConfigured()) return;

    const { error } = await supabase
      .from('archive_stories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting story:', error);
      alert('Failed to delete story');
    } else {
      fetchStories();
    }
  };

  const getIconComponent = (iconName: string) => {
    const icon = ICON_OPTIONS.find(i => i.value === iconName);
    return icon ? icon.icon : MagnifyingGlass;
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink flex items-center gap-2">
            <Sparkles size={28} weight="fill" className="text-accent-start" />
            Born from the Archive
          </h1>
          <p className="text-muted mt-1">Manage slideshow stories and section content</p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreating(true)}>
          <Plus size={16} weight="bold" />
          Add Story
        </Button>
      </div>

      {/* Section Header Settings */}
      <div className="bg-white rounded-xl border border-hairline p-6 mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">Section Header</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Header Line 1"
            value={sectionSettings.header}
            onChange={(e) => setSectionSettings({ ...sectionSettings, header: e.target.value })}
            placeholder="Born from the"
          />
          <FormInput
            label="Header Line 2 (Gradient)"
            value={sectionSettings.highlight}
            onChange={(e) => setSectionSettings({ ...sectionSettings, highlight: e.target.value })}
            placeholder="Archive."
          />
        </div>
        <p className="text-xs text-muted mt-3">
          Preview: <span className="font-bold">{sectionSettings.header}</span>{' '}
          <span className="font-bold text-gradient">{sectionSettings.highlight}</span>
        </p>
      </div>

      {/* Stories Grid */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-hairline p-12 text-center">
          <SpinnerGap size={32} className="animate-spin text-accent-start mx-auto mb-4" />
          <p className="text-muted">Loading stories...</p>
        </div>
      ) : stories.length === 0 ? (
        <div className="bg-white rounded-xl border border-hairline p-12 text-center">
          <Sparkles size={48} weight="thin" className="text-muted mx-auto mb-4" />
          <p className="text-muted">No stories yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => {
            const Icon1 = getIconComponent(story.highlight_1_icon);
            const Icon2 = getIconComponent(story.highlight_2_icon);
            const Icon3 = getIconComponent(story.highlight_3_icon);

            return (
              <div key={story.id} className="bg-white rounded-xl border border-hairline overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative aspect-[3/4] overflow-hidden bg-surface">
                  {story.image_url && (
                    <img 
                      src={story.image_url} 
                      alt={story.title} 
                      className="w-full h-full object-cover"
                    />
                  )}
                  {!story.is_active && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                      INACTIVE
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-display font-bold text-ink mb-1">{story.title}</h3>
                  <p className="text-xs text-muted uppercase tracking-wide mb-2">{story.location}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {story.tags.map((tag, i) => (
                      <span key={i} className="text-[9px] px-2 py-0.5 bg-surface rounded-full text-muted font-bold uppercase">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-muted line-clamp-2 mb-3">{story.story_text}</p>
                  
                  {/* Highlights Preview */}
                  <div className="space-y-2 mb-4 pt-3 border-t border-hairline">
                    <div className="flex items-start gap-2">
                      <Icon1 size={14} className="text-accent-start mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-ink">{story.highlight_1_title}</p>
                        <p className="text-[10px] text-muted line-clamp-1">{story.highlight_1_description}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Icon2 size={14} className="text-accent-start mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-ink">{story.highlight_2_title}</p>
                        <p className="text-[10px] text-muted line-clamp-1">{story.highlight_2_description}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Icon3 size={14} className="text-accent-start mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-ink">{story.highlight_3_title}</p>
                        <p className="text-[10px] text-muted line-clamp-1">{story.highlight_3_description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="flex-1 gap-2" onClick={() => handleEdit(story)}>
                      <PencilSimple size={14} weight="bold" />
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500 hover:bg-red-50"
                      onClick={() => handleDelete(story.id)}
                    >
                      <Trash size={14} weight="bold" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit/Create Modal */}
      {(editingStory || isCreating) && (
        <StoryModal
          story={editingStory}
          onClose={() => {
            setEditingStory(null);
            setIsCreating(false);
          }}
          onSave={fetchStories}
          sectionSettings={sectionSettings}
        />
      )}
    </div>
  );
}

// Story Edit/Create Modal Component
function StoryModal({ 
  story, 
  onClose, 
  onSave,
  sectionSettings 
}: { 
  story: ArchiveStory | null; 
  onClose: () => void; 
  onSave: () => void;
  sectionSettings: { header: string; highlight: string };
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<StoryFormData>({
    image_url: story?.image_url || '',
    title: story?.title || '',
    location: story?.location || '',
    tags: story?.tags.join(', ') || '',
    story_text: story?.story_text || '',
    highlight_1_icon: story?.highlight_1_icon || 'MagnifyingGlass',
    highlight_1_title: story?.highlight_1_title || '',
    highlight_1_description: story?.highlight_1_description || '',
    highlight_2_icon: story?.highlight_2_icon || 'Eye',
    highlight_2_title: story?.highlight_2_title || '',
    highlight_2_description: story?.highlight_2_description || '',
    highlight_3_icon: story?.highlight_3_icon || 'Heart',
    highlight_3_title: story?.highlight_3_title || '',
    highlight_3_description: story?.highlight_3_description || '',
    section_header: story?.section_header || sectionSettings.header,
    section_header_highlight: story?.section_header_highlight || sectionSettings.highlight,
  });

  const handleSave = async () => {
    setIsSaving(true);

    if (!isSupabaseConfigured()) {
      alert('Supabase not configured');
      setIsSaving(false);
      return;
    }

    const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);

    const dbData = {
      image_url: formData.image_url,
      title: formData.title,
      location: formData.location,
      tags: tagsArray,
      story_text: formData.story_text,
      highlight_1_icon: formData.highlight_1_icon,
      highlight_1_title: formData.highlight_1_title,
      highlight_1_description: formData.highlight_1_description,
      highlight_2_icon: formData.highlight_2_icon,
      highlight_2_title: formData.highlight_2_title,
      highlight_2_description: formData.highlight_2_description,
      highlight_3_icon: formData.highlight_3_icon,
      highlight_3_title: formData.highlight_3_title,
      highlight_3_description: formData.highlight_3_description,
      section_header: formData.section_header,
      section_header_highlight: formData.section_header_highlight,
    };

    if (story) {
      // Update existing
      const { error } = await supabase
        .from('archive_stories')
        .update(dbData as never)
        .eq('id', story.id);

      if (error) {
        console.error('Error updating story:', error);
        alert('Failed to update story');
        setIsSaving(false);
        return;
      }
    } else {
      // Create new
      const { error } = await supabase
        .from('archive_stories')
        .insert({ ...dbData, sort_order: 999 } as never);

      if (error) {
        console.error('Error creating story:', error);
        alert('Failed to create story');
        setIsSaving(false);
        return;
      }
    }

    setIsSaving(false);
    onSave();
    onClose();
  };

  const updateField = (field: keyof StoryFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-hairline flex-shrink-0">
          <div>
            <h2 className="font-display font-bold text-xl text-ink">
              {story ? 'Edit Story' : 'Create New Story'}
            </h2>
            <p className="text-sm text-muted mt-1">Customize the "Born from the Archive" slideshow</p>
          </div>
          <button onClick={onClose} className="p-2 text-muted hover:text-ink transition-colors" disabled={isSaving}>
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 space-y-8 overflow-y-auto flex-1 overscroll-contain">
          {/* Image */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">Image</h3>
            <ImageUpload
              label="Story Image"
              value={formData.image_url ? [formData.image_url] : []}
              onChange={(urls) => updateField('image_url', urls[0] || '')}
              multiple={false}
            />
          </div>

          {/* Card Overlay Info */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">Card Overlay</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Title"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Vintage Pattern Shirt"
                required
              />
              <FormInput
                label="Location"
                value={formData.location}
                onChange={(e) => updateField('location', e.target.value)}
                placeholder="Personal Archive"
                required
              />
            </div>
            <div className="mt-4">
              <FormInput
                label="Tags (comma-separated)"
                value={formData.tags}
                onChange={(e) => updateField('tags', e.target.value)}
                placeholder="90s, Pattern, Cotton, Rare"
              />
              <p className="text-xs text-muted mt-1">Separate tags with commas</p>
            </div>
          </div>

          {/* Story Text */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">Story</h3>
            <div className="mb-2">
              <label className="text-sm font-medium text-ink">Story Text</label>
            </div>
            <textarea
              value={formData.story_text}
              onChange={(e) => updateField('story_text', e.target.value)}
              rows={4}
              placeholder="This isn't just a shirt—it's the very first piece that made me fall in love with vintage..."
              className="w-full px-4 py-3 rounded-lg border border-hairline bg-white text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent-start focus:ring-2 focus:ring-accent-start/20 transition-all resize-none"
              required
            />
          </div>

          {/* Highlights */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">Highlights (3 Points)</h3>
            
            {[1, 2, 3].map((num) => {
              const iconField = `highlight_${num}_icon` as keyof StoryFormData;
              const titleField = `highlight_${num}_title` as keyof StoryFormData;
              const descField = `highlight_${num}_description` as keyof StoryFormData;

              return (
                <div key={num} className="p-4 bg-surface rounded-xl mb-4">
                  <p className="text-xs font-bold text-muted mb-3">Highlight {num}</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-ink mb-2 block">Icon</label>
                      <div className="grid grid-cols-4 gap-2">
                        {ICON_OPTIONS.map(({ value, label, icon: Icon }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => updateField(iconField, value)}
                            className={`p-3 rounded-lg border transition-all ${
                              formData[iconField] === value
                                ? 'border-accent-start bg-accent-start/10 text-accent-start'
                                : 'border-hairline hover:border-accent-start/50'
                            }`}
                          >
                            <Icon size={20} weight="duotone" className="mx-auto" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <FormInput
                      label="Title"
                      value={formData[titleField] as string}
                      onChange={(e) => updateField(titleField, e.target.value)}
                      placeholder="The Dig"
                      required
                    />
                    <div>
                      <label className="text-sm font-medium text-ink mb-2 block">Description</label>
                      <textarea
                        value={formData[descField] as string}
                        onChange={(e) => updateField(descField, e.target.value)}
                        rows={2}
                        placeholder="Unearthed in Kreuzberg, preserved with cedar blocks for years."
                        className="w-full px-4 py-3 rounded-lg border border-hairline bg-white text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent-start focus:ring-2 focus:ring-accent-start/20 transition-all resize-none"
                        required
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-hairline flex-shrink-0">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving} isLoading={isSaving}>
            {story ? 'Save Changes' : 'Create Story'}
          </Button>
        </div>
      </div>
    </div>
  );
}

