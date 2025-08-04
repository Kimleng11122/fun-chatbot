'use client';

import { useState } from 'react';
import { ImageAttachment } from '@/types/chat';
import { cn } from '@/lib/utils';

interface ImageMessageProps {
  images: ImageAttachment[];
  role: 'user' | 'assistant';
}

export function ImageMessage({ images, role }: ImageMessageProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (imageId: string) => {
    setImageErrors(prev => new Set(prev).add(imageId));
  };

  return (
    <div className="space-y-2">
      {images.map((image, index) => (
        <div key={image.id} className="relative group">
          {imageErrors.has(image.id) ? (
            <div className={cn(
              'flex items-center justify-center rounded-lg border-2 border-dashed',
              'text-gray-500 bg-gray-100',
              role === 'user' ? 'ml-auto w-32 h-32' : 'mr-auto w-32 h-32'
            )}>
              <div className="text-center">
                <div className="text-2xl mb-1">📷</div>
                <div className="text-xs">Image unavailable</div>
              </div>
            </div>
          ) : (
            <img
              src={image.url}
              alt={image.filename}
              className={cn(
                'max-w-full rounded-lg cursor-pointer transition-transform',
                'hover:scale-105',
                role === 'user' ? 'ml-auto max-w-xs' : 'mr-auto max-w-xs'
              )}
              onClick={() => setSelectedImage(index)}
              onError={() => handleImageError(image.id)}
            />
          )}
          
          {/* Show filename */}
          <div className={cn(
            'text-xs mt-1',
            role === 'user' ? 'text-blue-100 text-right' : 'text-gray-600'
          )}>
            {image.filename}
          </div>
        </div>
      ))}
      
      {/* Full-screen modal for image viewing */}
      {selectedImage !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={images[selectedImage].url}
            alt={images[selectedImage].filename}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
} 