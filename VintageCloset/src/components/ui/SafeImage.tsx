'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { ImageSquare } from '@phosphor-icons/react';

interface SafeImageProps extends Omit<ImageProps, 'onError'> {
  fallbackClassName?: string;
}

/**
 * SafeImage component that gracefully handles broken/missing images
 * Shows a placeholder icon when image fails to load
 */
export function SafeImage({ 
  src, 
  alt, 
  fallbackClassName,
  className,
  ...props 
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if src is valid
  const isValidSrc = src && typeof src === 'string' && src.length > 0 && src !== 'null' && src !== 'undefined';

  if (!isValidSrc || hasError) {
    return (
      <div 
        className={`flex items-center justify-center bg-surface ${fallbackClassName || className || ''}`}
        style={props.fill ? { position: 'absolute', inset: 0 } : undefined}
      >
        <div className="text-center p-4">
          <ImageSquare size={48} weight="thin" className="text-muted/30 mx-auto" />
          <p className="text-xs text-muted/50 mt-2">No image</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div 
          className={`flex items-center justify-center bg-surface animate-pulse ${fallbackClassName || className || ''}`}
          style={props.fill ? { position: 'absolute', inset: 0 } : undefined}
        >
          <ImageSquare size={32} weight="thin" className="text-muted/20" />
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        className={`${className || ''} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        {...props}
      />
    </>
  );
}





