'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ImageGenerationResult {
  generatedImage: {
    url: string;
  };
  prompt: string;
  size: string;
  quality: string;
  estimatedCost: number;
}

export default function TestImageGeneration() {
  const [prompt, setPrompt] = useState('a beautiful sunset over mountains');
  const [result, setResult] = useState<ImageGenerationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testImageGeneration = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          size: '1024x1024',
          quality: 'medium',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Test Image Generation</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Prompt:</label>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Enter image prompt..."
          />
        </div>
        
        <Button 
          onClick={testImageGeneration} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Generating...' : 'Generate Image'}
        </Button>
        
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {error}
          </div>
        )}
        
        {result && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Generated Image:</h2>
            <img 
              src={result.generatedImage.url} 
              alt={result.prompt}
              className="w-full rounded border"
            />
            <div className="text-sm text-gray-600">
              <p><strong>Prompt:</strong> {result.prompt}</p>
              <p><strong>Size:</strong> {result.size}</p>
              <p><strong>Quality:</strong> {result.quality}</p>
              <p><strong>Estimated Cost:</strong> ${result.estimatedCost}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 