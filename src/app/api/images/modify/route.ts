import { NextRequest, NextResponse } from 'next/server';
import { ImageGenerationService } from '@/lib/images/generation';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const prompt = formData.get('prompt') as string;
    const maskFile = formData.get('mask') as File | null;

    if (!imageFile || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: image, prompt' }, 
        { status: 400 }
      );
    }

    if (prompt.length > 1000) {
      return NextResponse.json(
        { error: 'Prompt too long. Maximum length is 1000 characters.' }, 
        { status: 400 }
      );
    }

    const generationService = new ImageGenerationService();
    
    // Validate image for API requirements
    const validation = generationService.validateImageForAPI(imageFile);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error }, 
        { status: 400 }
      );
    }

    // Convert files to base64
    const imageBase64 = await generationService.fileToBase64(imageFile);
    const maskBase64 = maskFile ? await generationService.fileToBase64(maskFile) : undefined;

    // Edit image
    const result = await generationService.editImage(imageBase64, prompt, maskBase64);

    return NextResponse.json({ 
      modifiedImage: result,
      prompt: result.prompt,
      originalImageName: imageFile.name
    });
  } catch (error) {
    console.error('Image modification failed:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('content_policy_violation')) {
        return NextResponse.json(
          { error: 'Image modification failed due to content policy violation. Please try a different prompt.' }, 
          { status: 400 }
        );
      }
      if (error.message.includes('billing')) {
        return NextResponse.json(
          { error: 'Image modification failed due to billing issues. Please check your OpenAI account.' }, 
          { status: 402 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to modify image. Please try again.' }, 
      { status: 500 }
    );
  }
} 