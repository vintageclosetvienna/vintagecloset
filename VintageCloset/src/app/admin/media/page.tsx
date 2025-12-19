'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { 
  Image as ImageIcon, 
  PencilSimple, 
  X,
  Check,
  House,
  Storefront,
  Images,
  CloudArrowUp,
  SpinnerGap,
  ImageSquare
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { 
  getAllSiteImagesAdmin, 
  updateSiteImage, 
  uploadSiteImage,
  type SiteImage 
} from '@/lib/site-images';

type Section = 'landing-hero' | 'carousel' | 'collection-highlights' | 'story-slides' | 'collection-heroes';

const SECTIONS: { id: Section; dbSection: string; label: string; icon: typeof House; description: string }[] = [
  { id: 'landing-hero', dbSection: 'landing-hero', label: 'Landing Hero', icon: House, description: '3 stacked images on the homepage hero' },
  { id: 'carousel', dbSection: 'media-carousel', label: 'Media Carousel', icon: Images, description: 'Scrolling images below the hero' },
  { id: 'collection-highlights', dbSection: 'collection-highlights', label: 'Collection Cards', icon: Storefront, description: 'Women, Men, Unisex cards on landing' },
  { id: 'story-slides', dbSection: 'story-slides', label: 'Archive Stories', icon: ImageIcon, description: '"Born from the Archive" slideshow' },
  { id: 'collection-heroes', dbSection: 'collection-heroes', label: 'Collection Heroes', icon: Storefront, description: 'Hero images for shop pages' },
];

// Map section IDs to database section names
const sectionToDbSection: Record<Section, string> = {
  'landing-hero': 'landing-hero',
  'carousel': 'media-carousel',
  'collection-highlights': 'collection-highlights',
  'story-slides': 'story-slides',
  'collection-heroes': 'collection-heroes',
};

interface ImageCardProps {
  image: SiteImage;
  position?: string;
  onEdit: () => void;
  isLoading?: boolean;
}

function ImageCard({ image, position, onEdit, isLoading }: ImageCardProps) {
  const [hasError, setHasError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  
  const isValidUrl = image.url && image.url.length > 0 && !image.url.includes('blob:');
  
  return (
    <div className="bg-white rounded-xl border border-hairline overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="relative aspect-video overflow-hidden bg-surface">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-surface">
            <SpinnerGap size={32} className="animate-spin text-accent-start" />
          </div>
        ) : !isValidUrl || hasError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <ImageSquare size={40} weight="thin" className="text-gray-300 mx-auto" />
              <p className="text-xs text-gray-400 mt-2">No image uploaded</p>
            </div>
          </div>
        ) : (
          <>
            {isImageLoading && (
              <div className="absolute inset-0 bg-gray-100 animate-pulse" />
            )}
            <Image 
              src={image.url} 
              alt={image.label} 
              fill 
              className={`object-cover group-hover:scale-105 transition-transform duration-500 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setIsImageLoading(false)}
              onError={() => {
                setHasError(true);
                setIsImageLoading(false);
              }}
            />
          </>
        )}
        {position && (
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-block px-2.5 py-1 bg-ink/80 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider rounded-md">
              {position}
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-ink mb-1">{image.label}</h3>
        <p className="text-xs text-muted mb-3">{image.description}</p>
        <Button variant="ghost" size="sm" className="w-full gap-2" onClick={onEdit}>
          <PencilSimple size={14} weight="bold" />
          {hasError || !isValidUrl ? 'Upload Image' : 'Change Image'}
        </Button>
      </div>
    </div>
  );
}

function ImageCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-hairline overflow-hidden animate-pulse">
      <div className="aspect-video bg-gray-200" />
      <div className="p-4">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-full mb-3" />
        <div className="h-9 bg-gray-100 rounded w-full" />
      </div>
    </div>
  );
}

interface EditModalProps {
  image: SiteImage;
  position?: string;
  isCarousel?: boolean;
  onClose: () => void;
  onSave: (data: { url: string; description?: string; file?: File; objectPosition?: string }) => Promise<void>;
  isSaving: boolean;
}

function EditModal({ image, position, isCarousel, onClose, onSave, isSaving }: EditModalProps) {
  const [newUrl, setNewUrl] = useState(image.url);
  const [category, setCategory] = useState(image.description);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [objectPosition, setObjectPosition] = useState(image.object_position || 'center center');
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 });

  // Parse initial position
  useEffect(() => {
    if (image.object_position) {
      const parts = image.object_position.split(' ');
      const x = parseFloat(parts[0]) || 50;
      const y = parseFloat(parts[1]) || 50;
      setImagePosition({ x, y });
    }
  }, [image.object_position]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setNewUrl(objectUrl);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setNewUrl(objectUrl);
    }
  }, []);

  const handleSave = async () => {
    const finalObjectPosition = `${imagePosition.x}% ${imagePosition.y}%`;
    await onSave({ 
      url: newUrl, 
      description: isCarousel ? category : undefined,
      file: selectedFile || undefined,
      objectPosition: finalObjectPosition
    });
  };

  // Handle dragging the image to reposition
  const handleImageDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(true);
  }, []);

  const handleImageDragMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingImage) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setImagePosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    });
  }, [isDraggingImage]);

  const handleImageDragEnd = useCallback(() => {
    setIsDraggingImage(false);
  }, []);

  // Global mouse up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDraggingImage(false);
    if (isDraggingImage) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isDraggingImage]);

  return (
    <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-hairline flex-shrink-0">
          <div>
            <h2 className="font-display font-bold text-xl text-ink">Edit Image</h2>
            <p className="text-sm text-muted mt-1">
              {image.label} {position && <span className="text-accent-start">({position})</span>}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-muted hover:text-ink transition-colors" disabled={isSaving}>
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div 
          className="p-6 space-y-6 overflow-y-auto flex-1"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(0, 0, 0, 0.2) transparent',
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              width: 6px;
            }
            div::-webkit-scrollbar-track {
              background: transparent;
            }
            div::-webkit-scrollbar-thumb {
              background-color: rgba(0, 0, 0, 0.2);
              border-radius: 3px;
            }
            div::-webkit-scrollbar-thumb:hover {
              background-color: rgba(0, 0, 0, 0.3);
            }
          `}</style>
          {/* Category Name - Only for carousel */}
          {isCarousel && (
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Category Name</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Spring Collection"
                className="w-full h-11 px-4 rounded-lg border border-hairline bg-white text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent-start focus:ring-2 focus:ring-accent-start/20 transition-all"
                disabled={isSaving}
              />
              <p className="text-xs text-muted mt-2">
                This label appears on the image in the carousel
              </p>
            </div>
          )}

          {/* Drag & Drop Upload */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Image</label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-xl overflow-hidden border-2 border-dashed transition-all cursor-pointer ${
                isDragging 
                  ? 'border-accent-start bg-accent-start/10' 
                  : 'border-hairline bg-surface/50 hover:border-accent-start/50 hover:bg-accent-start/5'
              } ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={isSaving}
              />
              
              {newUrl && newUrl.length > 0 ? (
                <div className="relative aspect-video">
                  <div 
                    className="relative w-full h-full overflow-hidden bg-gray-100 cursor-move"
                    onMouseDown={handleImageDragStart}
                    onMouseMove={handleImageDragMove}
                    onMouseUp={handleImageDragEnd}
                    onMouseLeave={handleImageDragEnd}
                  >
                    <Image 
                      src={newUrl} 
                      alt="Preview" 
                      fill 
                      className="object-cover pointer-events-none select-none"
                      style={{ 
                        objectPosition: `${imagePosition.x}% ${imagePosition.y}%`,
                        transition: isDraggingImage ? 'none' : 'object-position 0.1s ease-out'
                      }}
                      unoptimized={newUrl.startsWith('blob:')}
                    />
                    {/* Crosshair indicator */}
                    <div 
                      className="absolute pointer-events-none transition-all"
                      style={{
                        left: `${imagePosition.x}%`,
                        top: `${imagePosition.y}%`,
                        transform: 'translate(-50%, -50%)',
                        opacity: isDraggingImage ? 1 : 0
                      }}
                    >
                      <div className="relative">
                        <div className="absolute w-8 h-0.5 bg-white shadow-lg" style={{ left: '-16px', top: '0' }} />
                        <div className="absolute w-0.5 h-8 bg-white shadow-lg" style={{ left: '0', top: '-16px' }} />
                        <div className="w-3 h-3 border-2 border-white rounded-full bg-accent-start shadow-lg" />
                      </div>
                    </div>
                    {/* Drag instruction overlay */}
                    <div className="absolute inset-0 bg-ink/0 hover:bg-ink/20 transition-colors flex items-center justify-center">
                      {!isDraggingImage && (
                        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <p className="text-sm font-medium text-ink">Drag to reposition</p>
                          <p className="text-xs text-muted mt-0.5">Position: {imagePosition.x.toFixed(0)}%, {imagePosition.y.toFixed(0)}%</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedFile && (
                    <div className="absolute bottom-3 left-3 right-3 z-10">
                      <div className="bg-green-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg inline-flex items-center gap-2">
                        <Check size={12} weight="bold" />
                        New image selected - click Save to upload
                      </div>
                    </div>
                  )}
                  {!selectedFile && (
                    <div className="absolute top-3 left-3 right-3 z-10">
                      <div className="bg-accent-start/90 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-lg inline-flex items-center gap-2">
                        <CloudArrowUp size={14} weight="bold" />
                        Drag image to adjust focal point • Click to replace
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-surface via-surface to-accent-start/5">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                      <CloudArrowUp size={32} weight="duotone" className="text-accent-start" />
                    </div>
                    <p className="text-sm font-medium text-ink">Drag & drop an image here</p>
                    <p className="text-xs text-muted mt-1">or click to browse files</p>
                    <p className="text-[10px] text-muted/60 mt-3">PNG, JPG, WEBP up to 10MB</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="bg-surface rounded-lg p-4">
            <p className="text-xs text-muted">
              <strong className="text-ink">Where this appears:</strong> {image.section}
            </p>
            <p className="text-xs text-muted mt-1">
              <strong className="text-ink">Image key:</strong> {image.key}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-hairline flex-shrink-0">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button 
            onClick={handleSave}
            disabled={!newUrl || isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <SpinnerGap size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check size={16} weight="bold" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MediaPage() {
  const [activeSection, setActiveSection] = useState<Section>('landing-hero');
  const [editingImage, setEditingImage] = useState<{ image: SiteImage; position?: string; isCarousel?: boolean } | null>(null);
  const [images, setImages] = useState<SiteImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savingImageKey, setSavingImageKey] = useState<string | null>(null);

  // Fetch images on mount
  useEffect(() => {
    async function fetchImages() {
      setIsLoading(true);
      try {
        const data = await getAllSiteImagesAdmin();
        setImages(data);
      } catch (error) {
        console.error('Error fetching site images:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchImages();
  }, []);

  const handleSave = async (data: { url: string; description?: string; file?: File; objectPosition?: string }) => {
    if (!editingImage) return;
    
    setIsSaving(true);
    setSavingImageKey(editingImage.image.key);
    
    try {
      let newUrl = data.url;
      
      // If a file was uploaded, upload to storage
      if (data.file) {
        const uploadedUrl = await uploadSiteImage(
          editingImage.image.key,
          sectionToDbSection[activeSection],
          data.file
        );
        if (uploadedUrl) {
          newUrl = uploadedUrl;
        }
      }
      
      // Update the database
      const updateData: { url?: string; description?: string; objectPosition?: string } = {};
      if (newUrl !== editingImage.image.url) {
        updateData.url = newUrl;
      }
      if (data.description !== undefined && data.description !== editingImage.image.description) {
        updateData.description = data.description;
      }
      if (data.objectPosition !== undefined && data.objectPosition !== editingImage.image.object_position) {
        updateData.objectPosition = data.objectPosition;
      }
      
      if (Object.keys(updateData).length > 0) {
        await updateSiteImage(editingImage.image.key, updateData);
        
        // Update local state
        setImages(prev => prev.map(img => 
          img.key === editingImage.image.key 
            ? { ...img, ...updateData, object_position: data.objectPosition }
            : img
        ));
      }
      
      setEditingImage(null);
    } catch (error) {
      console.error('Error saving image:', error);
    } finally {
      setIsSaving(false);
      setSavingImageKey(null);
    }
  };

  // Filter images by section
  const getImagesForSection = (dbSection: string) => {
    return images.filter(img => img.section === dbSection).sort((a, b) => a.sortOrder - b.sortOrder);
  };

  const renderSectionContent = () => {
    const dbSection = sectionToDbSection[activeSection];
    const sectionImages = getImagesForSection(dbSection);

    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <ImageCardSkeleton key={i} />)}
        </div>
      );
    }

    switch (activeSection) {
      case 'landing-hero':
        return (
          <div className="space-y-6">
            <div className="bg-surface/50 rounded-xl p-4 border border-hairline">
              <p className="text-sm text-muted">
                <strong className="text-ink">Layout:</strong> Three images stacked with the center image in front. 
                Left and right images are tilted and slightly behind.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sectionImages.map(image => {
                const positionMap: Record<string, string> = {
                  'hero-left': 'Left (Back)',
                  'hero-center': 'Center (Front)',
                  'hero-right': 'Right (Back)',
                };
                return (
                  <ImageCard 
                    key={image.key}
                    image={image} 
                    position={positionMap[image.key]}
                    onEdit={() => setEditingImage({ image, position: positionMap[image.key] })}
                    isLoading={savingImageKey === image.key}
                  />
                );
              })}
            </div>
          </div>
        );

      case 'carousel':
        return (
          <div className="space-y-6">
            <div className="bg-surface/50 rounded-xl p-4 border border-hairline">
              <p className="text-sm text-muted">
                <strong className="text-ink">Layout:</strong> Horizontally scrolling carousel. Images loop infinitely from left to right.
                Each image has a category label overlay.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {sectionImages.map((image, idx) => (
                <ImageCard 
                  key={image.key}
                  image={image} 
                  position={`Slide ${idx + 1}`}
                  onEdit={() => setEditingImage({ image, position: `Slide ${idx + 1}`, isCarousel: true })}
                  isLoading={savingImageKey === image.key}
                />
              ))}
            </div>
          </div>
        );

      case 'collection-highlights':
        return (
          <div className="space-y-6">
            <div className="bg-surface/50 rounded-xl p-4 border border-hairline">
              <p className="text-sm text-muted">
                <strong className="text-ink">Layout:</strong> Three collection cards displayed side by side on the landing page. 
                Each links to its respective shop category.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sectionImages.map(image => {
                const positionMap: Record<string, string> = {
                  'highlight-women': 'Women',
                  'highlight-men': 'Men',
                  'highlight-unisex': 'Unisex',
                };
                return (
                  <ImageCard 
                    key={image.key}
                    image={image} 
                    position={positionMap[image.key]}
                    onEdit={() => setEditingImage({ image, position: `${positionMap[image.key]} Collection` })}
                    isLoading={savingImageKey === image.key}
                  />
                );
              })}
            </div>
          </div>
        );

      case 'story-slides':
        return (
          <div className="space-y-6">
            <div className="bg-surface/50 rounded-xl p-4 border border-hairline">
              <p className="text-sm text-muted">
                <strong className="text-ink">Layout:</strong> "Born from the Archive" section. Images auto-rotate every 5 seconds 
                with a slide animation. Each has a title and story text.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sectionImages.map((image, idx) => (
                <ImageCard 
                  key={image.key}
                  image={image} 
                  position={`Story ${idx + 1}`}
                  onEdit={() => setEditingImage({ image, position: `Story ${idx + 1}` })}
                  isLoading={savingImageKey === image.key}
                />
              ))}
            </div>
          </div>
        );

      case 'collection-heroes':
        return (
          <div className="space-y-6">
            <div className="bg-surface/50 rounded-xl p-4 border border-hairline">
              <p className="text-sm text-muted">
                <strong className="text-ink">Layout:</strong> Full-width hero background images at the top of each collection page 
                (Women, Men, Unisex). Text overlays on top.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sectionImages.map(image => {
                const positionMap: Record<string, string> = {
                  'women-hero': '/women page',
                  'men-hero': '/men page',
                  'unisex-hero': '/unisex page',
                };
                return (
                  <ImageCard 
                    key={image.key}
                    image={image} 
                    position={positionMap[image.key]}
                    onEdit={() => setEditingImage({ image, position: `${positionMap[image.key].replace('/', '').replace(' page', '')} Page Hero` })}
                    isLoading={savingImageKey === image.key}
                  />
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-ink">Site Images</h1>
        <p className="text-muted mt-1">Manage images displayed across the website</p>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                isActive
                  ? 'bg-gradient-to-r from-accent-start to-accent-end text-white border-transparent shadow-sm'
                  : 'bg-white border-hairline text-ink hover:border-muted'
              }`}
            >
              <Icon size={16} weight={isActive ? 'fill' : 'regular'} />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Section Description */}
      <div className="mb-6">
        <h2 className="text-lg font-display font-bold text-ink">
          {SECTIONS.find(s => s.id === activeSection)?.label}
        </h2>
        <p className="text-sm text-muted">
          {SECTIONS.find(s => s.id === activeSection)?.description}
        </p>
      </div>

      {/* Content */}
      {renderSectionContent()}

      {/* Edit Modal */}
      {editingImage && (
        <EditModal
          image={editingImage.image}
          position={editingImage.position}
          isCarousel={editingImage.isCarousel}
          onClose={() => !isSaving && setEditingImage(null)}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
