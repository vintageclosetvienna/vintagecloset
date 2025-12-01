'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { CloudArrowUp, X, Image as ImageIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  label?: string;
  value: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  className?: string;
}

export function ImageUpload({ 
  label, 
  value = [], 
  onChange, 
  multiple = false,
  className 
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

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
      // For now, create object URLs (in production, upload to Supabase Storage)
      const urls = files.map(file => URL.createObjectURL(file));
      if (multiple) {
        onChange([...value, ...urls]);
      } else {
        onChange([urls[0]]);
      }
    }
  }, [value, onChange, multiple]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const urls = files.map(file => URL.createObjectURL(file));
      if (multiple) {
        onChange([...value, ...urls]);
      } else {
        onChange([urls[0]]);
      }
    }
  }, [value, onChange, multiple]);

  const removeImage = useCallback((index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  }, [value, onChange]);

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

      {/* Upload Zone */}
      {(multiple || value.length === 0) && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
            isDragging 
              ? "border-accent-start bg-accent-start/5" 
              : "border-hairline hover:border-muted bg-white"
          )}
        >
          <input
            type="file"
            accept="image/*"
            multiple={multiple}
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center">
              {isDragging ? (
                <CloudArrowUp size={24} className="text-accent-start" weight="duotone" />
              ) : (
                <ImageIcon size={24} className="text-muted" weight="duotone" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-ink">
                {isDragging ? 'Drop images here' : 'Drag & drop images'}
              </p>
              <p className="text-xs text-muted mt-1">
                or click to browse
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

