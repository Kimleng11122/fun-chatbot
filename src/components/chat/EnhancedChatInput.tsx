'use client';

import { useState } from 'react';
import { Send, Image as ImageIcon, Loader2 } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import { cn } from '@/lib/utils';

interface EnhancedChatInputProps {
  onSendMessage: (message: string, images?: File[]) => void;
  disabled?: boolean;
}

export function EnhancedChatInput({ onSendMessage, disabled = false }: EnhancedChatInputProps) {
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [showImageUpload, setShowImageUpload] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || images.length > 0) && !disabled) {
      onSendMessage(message.trim(), images);
      setMessage('');
      setImages([]);
      setShowImageUpload(false);
    }
  };

  const handleImageUpload = (file: File) => {
    setImages(prev => [...prev, file]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-4 border-t bg-white">
      {showImageUpload && (
        <ImageUpload onImageUpload={handleImageUpload} disabled={disabled} />
      )}
      
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => setShowImageUpload(!showImageUpload)}
          disabled={disabled}
          className={cn(
            'p-3 text-gray-500 hover:text-blue-500 rounded-lg',
            'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors duration-200'
          )}
        >
          <ImageIcon size={20} />
        </button>
        
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message or upload an image (you can upload images without text)..."
            disabled={disabled}
            className={cn(
              'w-full p-3 border border-gray-300 rounded-lg resize-none',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'min-h-[44px] max-h-32',
              'text-black'
            )}
            rows={1}
          />
        </div>
        
        <button
          type="submit"
          disabled={(!message.trim() && images.length === 0) || disabled}
          className={cn(
            'p-3 bg-blue-500 text-white rounded-lg',
            'hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors duration-200',
            'flex items-center justify-center'
          )}
        >
          {disabled ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Send size={20} />
          )}
        </button>
      </div>
      
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((image, index) => (
            <div key={index} className="relative">
              <img
                src={URL.createObjectURL(image)}
                alt={image.name}
                className="w-16 h-16 object-cover rounded border"
              />
              <button
                type="button"
                onClick={() => setImages(prev => prev.filter((_, i) => i !== index))}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </form>
  );
} 