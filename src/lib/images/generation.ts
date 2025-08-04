import OpenAI from 'openai';
import { ImageGenerationRequest, ImageGenerationResponse } from '@/types/chat';
import sharp from 'sharp';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class ImageGenerationService {
  /**
   * Validate and sanitize prompt for safety
   * 
   * This method checks for potentially problematic content and sanitizes the prompt
   * to ensure it complies with OpenAI's content policy. It also adds safety modifiers
   * to make the prompt more likely to be accepted.
   * 
   * @param prompt - The original user prompt
   * @returns Object containing validation result, sanitized prompt, and any error message
   */
  private validateAndSanitizePrompt(prompt: string): { valid: boolean; sanitizedPrompt: string; error?: string } {
    const lowerPrompt = prompt.toLowerCase();
    
    // List of potentially problematic terms that might trigger safety filters
    const problematicTerms = [
      'nude', 'naked', 'explicit', 'sexual', 'violence', 'blood', 'gore', 'weapon', 'gun',
      'knife', 'sword', 'bomb', 'explosion', 'death', 'kill', 'murder', 'suicide',
      'hate', 'racist', 'discriminatory', 'offensive', 'inappropriate'
    ];
    
    // Check for problematic terms
    for (const term of problematicTerms) {
      if (lowerPrompt.includes(term)) {
        return {
          valid: false,
          sanitizedPrompt: '',
          error: `Prompt contains potentially inappropriate content: "${term}". Please try a different description.`
        };
      }
    }
    
    // Check if prompt is too short or vague
    if (prompt.trim().length < 3) {
      return {
        valid: false,
        sanitizedPrompt: '',
        error: 'Prompt is too short. Please provide a more detailed description.'
      };
    }
    
    // Sanitize the prompt
    let sanitizedPrompt = prompt
      .trim()
      .replace(/[^\w\s\-.,!?()]/g, '') // Remove special characters except basic punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 1000); // Limit length
    
    // Add safety modifiers for better results
    if (!sanitizedPrompt.includes('safe') && !sanitizedPrompt.includes('appropriate')) {
      sanitizedPrompt = `A safe, appropriate, and family-friendly ${sanitizedPrompt}`;
    }
    
    return {
      valid: true,
      sanitizedPrompt
    };
  }

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

      // Validate and sanitize the prompt
      const validation = this.validateAndSanitizePrompt(prompt);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Enhance prompt with conversation context if available
      let enhancedPrompt = validation.sanitizedPrompt;
      if (conversationContext) {
        // Only add context if it's safe and relevant
        const contextValidation = this.validateAndSanitizePrompt(conversationContext);
        if (contextValidation.valid) {
          enhancedPrompt = `${validation.sanitizedPrompt}. Context: ${contextValidation.sanitizedPrompt}`;
        }
      }

      // Ensure the final prompt is safe and appropriate
      if (!enhancedPrompt.toLowerCase().includes('safe') && !enhancedPrompt.toLowerCase().includes('appropriate')) {
        enhancedPrompt = `A safe, appropriate, and family-friendly image of ${enhancedPrompt}`;
      }

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
    } catch (error: unknown) {
      console.error('Image generation failed:', error);
      
      // Handle specific OpenAI errors
      if (error && typeof error === 'object' && 'code' in error && error.code === 'content_policy_violation') {
        throw new Error('The image description contains content that violates our safety guidelines. Please try a different, more appropriate description.');
      }
      
      if (error && typeof error === 'object' && 'status' in error && error.status === 400) {
        throw new Error('Invalid request. Please provide a clearer, more specific description of the image you want.');
      }
      
      if (error && typeof error === 'object' && 'status' in error && error.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      
      if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
        throw new Error('Authentication failed. Please check your API configuration.');
      }
      
      // Generic error
      throw new Error('Failed to generate image. Please try again with a different description.');
    }
  }

  /**
   * Convert image to RGBA format using Sharp (for server-side)
   * This ensures the image is in the correct format for OpenAI's image editing API
   */
  private async convertToRGBA_Server(imageBase64: string): Promise<string> {
    try {
      const buffer = Buffer.from(imageBase64, 'base64');
      
      // Use sharp to convert the image to PNG with RGBA format
      const processedBuffer = await sharp(buffer)
        .png() // Ensure PNG format
        .ensureAlpha() // Ensure alpha channel exists (RGBA)
        .toBuffer();
      
      // Convert back to base64
      return processedBuffer.toString('base64');
    } catch (error) {
      console.error('Error converting image to RGBA:', error);
      // If conversion fails, return the original base64
      // This might still work if the image is already in the correct format
      return imageBase64;
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
      // Convert image to RGBA format for OpenAI API compatibility
      let processedImageBase64: string;
      try {
        processedImageBase64 = await this.convertToRGBA_Server(imageBase64);
      } catch (conversionError) {
        console.warn('Image format conversion failed, using original:', conversionError);
        processedImageBase64 = imageBase64;
      }

      // Convert base64 to File object for OpenAI API
      const imageBlob = new Blob([Buffer.from(processedImageBase64, 'base64')], { type: 'image/png' });
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
        // Also convert mask to RGBA format
        let processedMaskBase64: string;
        try {
          processedMaskBase64 = await this.convertToRGBA_Server(maskBase64);
        } catch (conversionError) {
          console.warn('Mask format conversion failed, using original:', conversionError);
          processedMaskBase64 = maskBase64;
        }
        
        const maskBlob = new Blob([Buffer.from(processedMaskBase64, 'base64')], { type: 'image/png' });
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
      
      // Provide more specific error messages
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = error.message as string;
        if (errorMessage.includes('Invalid input image - format must be in')) {
          throw new Error('Image format not supported. Please try uploading a different image or ensure it\'s in PNG format.');
        } else if (errorMessage.includes('safety guidelines')) {
          throw new Error('The image modification request violates safety guidelines. Please try a different modification.');
        }
      }
      
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
      // Convert image to RGBA format for OpenAI API compatibility
      let processedImageBase64: string;
      try {
        processedImageBase64 = await this.convertToRGBA_Server(imageBase64);
      } catch (conversionError) {
        console.warn('Image format conversion failed, using original:', conversionError);
        processedImageBase64 = imageBase64;
      }

      // Convert base64 to File object for OpenAI API
      const imageBlob = new Blob([Buffer.from(processedImageBase64, 'base64')], { type: 'image/png' });
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
      
      // Provide more specific error messages
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = error.message as string;
        if (errorMessage.includes('Invalid input image - format must be in')) {
          throw new Error('Image format not supported. Please try uploading a different image or ensure it\'s in PNG format.');
        } else if (errorMessage.includes('safety guidelines')) {
          throw new Error('The image variation request violates safety guidelines. Please try a different image.');
        }
      }
      
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
   * Get safe prompt suggestions for users
   */
  getSafePromptSuggestions(): string[] {
    return [
      "A peaceful mountain landscape at sunset",
      "A cute cartoon cat playing with a ball",
      "A modern office workspace with plants",
      "A colorful abstract painting with geometric shapes",
      "A cozy coffee shop interior",
      "A beautiful garden with flowers and butterflies",
      "A futuristic city skyline at night",
      "A vintage car parked on a scenic road",
      "A magical forest with glowing mushrooms",
      "A professional portrait of a business person"
    ];
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