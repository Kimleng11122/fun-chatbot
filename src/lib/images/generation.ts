import OpenAI from 'openai';
import { ImageGenerationRequest, ImageGenerationResponse } from '@/types/chat';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class ImageGenerationService {
  /**
   * Generate an image from text prompt using DALL-E
   */
  async generateFromText(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    try {
      const {
        prompt,
        size = '1024x1024',
        quality = 'standard',
        conversationContext
      } = request;

      // Enhance prompt with conversation context if available
      const enhancedPrompt = conversationContext 
        ? `${prompt}. Context: ${conversationContext}`
        : prompt;

      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: enhancedPrompt,
        n: 1,
        size: size,
        quality: quality,
        response_format: "url"
      });
      
      if (!response.data || response.data.length === 0) {
        throw new Error('No image generated');
      }
      
      return {
        url: response.data[0].url!,
        prompt: enhancedPrompt,
        size: size,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Image generation failed:', error);
      throw new Error('Failed to generate image. Please try again.');
    }
  }

  /**
   * Edit an existing image using DALL-E
   */
  async editImage(
    imageBase64: string, 
    prompt: string, 
    maskBase64?: string
  ): Promise<ImageGenerationResponse> {
    try {
      // Convert base64 to File object for OpenAI API
      const imageBlob = new Blob([Buffer.from(imageBase64, 'base64')], { type: 'image/png' });
      const imageFile = new File([imageBlob], 'image.png', { type: 'image/png' });
      
      const editParams: {
        image: File;
        prompt: string;
        n: number;
        size: "1024x1024";
        mask?: File;
      } = {
        image: imageFile,
        prompt: prompt,
        n: 1,
        size: "1024x1024"
      };
      
      if (maskBase64) {
        const maskBlob = new Blob([Buffer.from(maskBase64, 'base64')], { type: 'image/png' });
        const maskFile = new File([maskBlob], 'mask.png', { type: 'image/png' });
        editParams.mask = maskFile;
      }
      
      const response = await openai.images.edit(editParams);
      
      if (!response.data || response.data.length === 0) {
        throw new Error('No image generated');
      }
      
      return {
        url: response.data[0].url!,
        prompt: prompt,
        size: "1024x1024",
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Image editing failed:', error);
      throw new Error('Failed to edit image. Please try again.');
    }
  }

  /**
   * Generate variations of an existing image
   */
  async generateVariations(
    imageBase64: string, 
    count: number = 3
  ): Promise<ImageGenerationResponse[]> {
    try {
      // Convert base64 to File object for OpenAI API
      const imageBlob = new Blob([Buffer.from(imageBase64, 'base64')], { type: 'image/png' });
      const imageFile = new File([imageBlob], 'image.png', { type: 'image/png' });
      
      const response = await openai.images.createVariation({
        image: imageFile,
        n: count,
        size: "1024x1024"
      });
      
      if (!response.data) {
        throw new Error('No variations generated');
      }
      
      return response.data.map(image => ({
        url: image.url!,
        prompt: "Image variation",
        size: "1024x1024",
        timestamp: new Date()
      }));
    } catch (error) {
      console.error('Image variation generation failed:', error);
      throw new Error('Failed to generate image variations. Please try again.');
    }
  }

  /**
   * Convert file to base64 for API calls
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Validate image file for DALL-E API
   */
  validateImageForAPI(file: File): { valid: boolean; error?: string } {
    // Check file size (DALL-E has a 4MB limit for edits/variations)
    const maxSize = 4 * 1024 * 1024; // 4MB
    if (file.size > maxSize) {
      return { valid: false, error: 'Image file must be smaller than 4MB for editing' };
    }

    // Check file type
    const allowedTypes = ['image/png'];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Only PNG images are supported for editing' };
    }

    return { valid: true };
  }

  /**
   * Estimate cost for image generation
   */
  estimateCost(size: string, quality: string): number {
    // DALL-E 3 pricing (as of 2024)
    const pricing = {
      '1024x1024': { standard: 0.04, hd: 0.08 },
      '1792x1024': { standard: 0.08, hd: 0.12 },
      '1024x1792': { standard: 0.08, hd: 0.12 }
    };

    const sizePricing = pricing[size as keyof typeof pricing];
    if (!sizePricing) {
      return 0.04; // Default to 1024x1024 standard
    }

    return sizePricing[quality as keyof typeof sizePricing] || sizePricing.standard;
  }
} 