'use client';

import { useState } from 'react';
import { Brain, X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MemoryIndicatorProps {
  memoryCount: number;
  hasSummary: boolean;
  onToggleDetails: () => void;
  showDetails: boolean;
}

export function MemoryIndicator({ 
  memoryCount, 
  hasSummary, 
  onToggleDetails, 
  showDetails 
}: MemoryIndicatorProps) {
  if (memoryCount === 0 && !hasSummary) {
    return null;
  }

  return (
    <div className="mb-4">
      <button
        onClick={onToggleDetails}
        className={cn(
          'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors',
          'bg-blue-50 text-blue-700 hover:bg-blue-100',
          showDetails && 'bg-blue-100'
        )}
      >
        <Brain size={16} />
        <span>
          {memoryCount > 0 && `${memoryCount} relevant memory${memoryCount > 1 ? 'ies' : 'y'}`}
          {memoryCount > 0 && hasSummary && ' • '}
          {hasSummary && 'Conversation summarized'}
        </span>
        <Info size={14} />
      </button>
    </div>
  );
}

interface MemoryDetailsProps {
  memories: string[];
  summary: string;
  onClose: () => void;
}

export function MemoryDetails({ memories, summary, onClose }: MemoryDetailsProps) {
  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-gray-900">Memory Context</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={16} />
        </button>
      </div>
      
      {summary && (
        <div className="mb-3">
          <h4 className="text-xs font-medium text-gray-700 mb-1">Current Summary</h4>
          <p className="text-sm text-gray-600">{summary}</p>
        </div>
      )}
      
      {memories.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-700 mb-1">
            Relevant Memories ({memories.length})
          </h4>
          <div className="space-y-2">
            {memories.map((memory, index) => (
              <div key={index} className="text-sm text-gray-600 bg-white p-2 rounded border">
                {memory}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 