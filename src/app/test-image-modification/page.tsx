'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ImageModificationResult {
  modifiedImage: {
    url: string;
  };
  prompt: string;
  originalImageName: string;
}

export default function TestImageModification() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [modificationPrompt, setModificationPrompt] = useState('Add mountains before the sunset');
  const [result, setResult] = useState<ImageModificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  const testImageModification = async () => {
    if (!imageFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('prompt', modificationPrompt);

      const response = await fetch('/api/images/modify', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to modify image');
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
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Test Image Modification</h1>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Original Image</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Upload Image:</label>
                <input
                  type="file"
                  accept="image/png"
                  onChange={handleImageUpload}
                  className="w-full p-2 border border-gray-300 rounded"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Only PNG images are supported for modification (max 4MB)
                </p>
              </div>
              
              {imageFile && (
                <div>
                  <img 
                    src={URL.createObjectURL(imageFile)} 
                    alt="Original"
                    className="w-full rounded border"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    File: {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-4">Modification</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Modification Prompt:</label>
                <input
                  type="text"
                  value={modificationPrompt}
                  onChange={(e) => setModificationPrompt(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="e.g., Add mountains before the sunset"
                />
              </div>
              
              <Button 
                onClick={testImageModification} 
                disabled={loading || !imageFile}
                className="w-full"
              >
                {loading ? 'Modifying...' : 'Modify Image'}
              </Button>
              
              {error && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  Error: {error}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {result && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Modified Image:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Original</h3>
                <img 
                  src={URL.createObjectURL(imageFile!)} 
                  alt="Original"
                  className="w-full rounded border"
                />
              </div>
              <div>
                <h3 className="font-medium mb-2">Modified</h3>
                <img 
                  src={result.modifiedImage.url} 
                  alt="Modified"
                  className="w-full rounded border"
                />
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p><strong>Modification Prompt:</strong> {result.prompt}</p>
              <p><strong>Original Image:</strong> {result.originalImageName}</p>
            </div>
          </div>
        )}
        
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-medium mb-2">💡 Modification Examples:</h3>
          <ul className="space-y-1 text-sm">
            <li>• &ldquo;Add mountains before the sunset&rdquo;</li>
            <li>• &ldquo;Remove the person from the background&rdquo;</li>
            <li>• &ldquo;Change the sky to blue&rdquo;</li>
            <li>• &ldquo;Make the cat orange instead of black&rdquo;</li>
            <li>• &ldquo;Add a hat to the person&rdquo;</li>
            <li>• &ldquo;Replace the car with a bicycle&rdquo;</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 