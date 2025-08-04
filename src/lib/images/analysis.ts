import OpenAI from 'openai';
import { ImageAnalysis } from '@/types/chat';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class ImageAnalysisService {
  async analyzeImage(imageBase64: string): Promise<ImageAnalysis> {
    try {
      console.log('Starting image analysis, base64 length:', imageBase64.length);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this image and provide a detailed description of what you see. Include any text content visible, main objects and elements, and the color scheme. Respond in natural language, not JSON format."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 500
      });

      const content = response.choices[0].message.content;
      
      console.log('Image analysis response received:', {
        contentLength: content?.length || 0,
        contentPreview: content?.substring(0, 100) + '...'
      });
      
      if (!content) {
        throw new Error('No analysis content received');
      }

      // Since we're now getting natural language, just use the content directly
      const result = {
        description: content,
        textContent: '',
        objects: [],
        colors: [],
        confidence: 0.9
      };
      
      console.log('Image analysis completed successfully');
      return result;
    } catch (error) {
      console.error('Image analysis failed:', error);
      
      // Provide more specific error information
      let errorMessage = 'Failed to analyze image';
      let errorDetails = '';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = error.stack || '';
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }
      
      console.error('Image analysis error details:', {
        message: errorMessage,
        details: errorDetails,
        base64Length: imageBase64.length,
        timestamp: new Date().toISOString()
      });
      
      throw new Error(`Failed to analyze image: ${errorMessage}`);
    }
  }

  async extractText(imageBase64: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all text visible in this image."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 500
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Text extraction failed:', error);
      throw new Error('Failed to extract text from image');
    }
  }
} 