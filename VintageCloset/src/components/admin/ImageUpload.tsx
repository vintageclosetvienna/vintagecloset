'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { CloudArrowUp, X, Image as ImageIcon, CircleNotch, Warning } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface ImageUploadProps {
  label?: string;
  value: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  className?: string;
  bucket?: string; // Supabase storage bucket name
}

export function ImageUpload({ 
  label, 
  value = [], 
  onChange, 
  multiple = false,
  className,
  bucket = 'product-images'
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Upload a single file to Supabase Storage
  const uploadFile = async (file: File): Promise<string | null> => {
    if (!isSupabaseConfigured()) {
      // Demo mode - use blob URL (won't persist)
      return URL.createObjectURL(file);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${timestamp}-${randomStr}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(error.message);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  // Handle multiple file uploads
  const handleFiles = async (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadPromises = imageFiles.map(file => uploadFile(file));
      const urls = await Promise.all(uploadPromises);
      const validUrls = urls.filter((url): url is string => url !== null);

      if (multiple) {
        onChange([...value, ...validUrls]);
      } else {
        onChange(validUrls.slice(0, 1));
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload images');
    } finally {
      setIsUploading(false);
    }
  };

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
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [value, multiple]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  }, [value, multiple]);

  const removeImage = useCallback(async (index: number) => {
    const urlToRemove = value[index];
    
    // Try to delete from storage if it's a Supabase URL
    if (isSupabaseConfigured() && urlToRemove.includes('supabase.co')) {
      try {
        // Extract filename from URL
        const urlParts = urlToRemove.split('/');
        const filename = urlParts[urlParts.length - 1];
        
        await supabase.storage
          .from(bucket)
          .remove([filename]);
      } catch (error) {
        console.error('Failed to delete from storage:', error);
        // Continue anyway - just remove from form
      }
    }
    
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  }, [value, onChange, bucket]);

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-ink mb-2">{label}</label>
      )}
      
      {/* Preview Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          {value.map((url, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-surface group">
              <Image 
                src={url} 
                alt={`Upload ${index + 1}`} 
                fill 
                className="object-cover"
                unoptimized={url.startsWith('blob:')}
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 w-6 h-6 bg-ink/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} weight="bold" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-2 left-2 text-[10px] font-bold uppercase bg-white/90 px-2 py-0.5 rounded">
                  Main
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <Warning size={16} className="text-red-500 flex-shrink-0 mt-0.5" weight="fill" />
          <p className="text-sm text-red-700">{uploadError}</p>
        </div>
      )}

      {/* Upload Zone */}
      {(multiple || value.length === 0) && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative border-2 border-dashed rounded-xl p-8 text-center transition-all",
            isUploading 
              ? "border-accent-start bg-accent-start/5 cursor-wait"
              : isDragging 
                ? "border-accent-start bg-accent-start/5 cursor-pointer" 
                : "border-hairline hover:border-muted bg-white cursor-pointer"
          )}
        >
          <input
            type="file"
            accept="image/*"
            multiple={multiple}
            onChange={handleFileSelect}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait"
          />
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center">
              {isUploading ? (
                <CircleNotch size={24} className="text-accent-start animate-spin" weight="bold" />
              ) : isDragging ? (
                <CloudArrowUp size={24} className="text-accent-start" weight="duotone" />
              ) : (
                <ImageIcon size={24} className="text-muted" weight="duotone" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-ink">
                {isUploading 
                  ? 'Uploading...' 
                  : isDragging 
                    ? 'Drop images here' 
                    : 'Drag & drop images'
                }
              </p>
              <p className="text-xs text-muted mt-1">
                {isUploading ? 'Please wait' : 'or click to browse'}
              </p>
            </div>
          </div>
        </div>
      )}

      {!isSupabaseConfigured() && (
        <p className="text-xs text-amber-600 mt-2">
          ⚠️ Demo mode: Images won&apos;t persist after refresh
        </p>
      )}
    </div>
  );
}
