import { NextRequest, NextResponse } from 'next/server';
import { ImageGenerationService } from '@/lib/images/generation';
import { ImageGenerationRequest } from '@/types/chat';

export async function POST(request: NextRequest) {
  try {
    const body: ImageGenerationRequest = await request.json();
    const { prompt, size = '1024x1024', quality = 'standard', conversationContext } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required for image generation' }, 
        { status: 400 }
      );
    }

    if (prompt.length > 1000) {
      return NextResponse.json(
        { error: 'Prompt too long. Maximum length is 1000 characters.' }, 
        { status: 400 }
      );
    }

    // Validate size parameter
    const validSizes = ['1024x1024', '1792x1024', '1024x1792'];
    if (!validSizes.includes(size)) {
      return NextResponse.json(
        { error: `Invalid size. Valid sizes: ${validSizes.join(', ')}` }, 
        { status: 400 }
      );
    }

    // Validate quality parameter
    const validQualities = ['standard', 'hd'];
    if (!validQualities.includes(quality)) {
      return NextResponse.json(
        { error: `Invalid quality. Valid qualities: ${validQualities.join(', ')}` }, 
        { status: 400 }
      );
    }

    const generationService = new ImageGenerationService();
    
    // Estimate cost before generation
    const estimatedCost = generationService.estimateCost(size, quality);
    
    // Generate image
    const result = await generationService.generateFromText({
      prompt,
      size,
      quality,
      conversationContext
    });

    return NextResponse.json({ 
      generatedImage: result,
      prompt: result.prompt,
      estimatedCost,
      size,
      quality
    });
  } catch (error) {
    console.error('Image generation failed:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('content_policy_violation')) {
        return NextResponse.json(
          { error: 'Image generation failed due to content policy violation. Please try a different prompt.' }, 
          { status: 400 }
        );
      }
      if (error.message.includes('billing')) {
        return NextResponse.json(
          { error: 'Image generation failed due to billing issues. Please check your OpenAI account.' }, 
          { status: 402 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to generate image. Please try again.' }, 
      { status: 500 }
    );
  }
} 