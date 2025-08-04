import { NextRequest, NextResponse } from 'next/server';
import { ImageStorageService } from '@/lib/images/storage';
import { ImageAnalysisService } from '@/lib/images/analysis';
import { ImageUploadResponse } from '@/types/chat';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const userId = formData.get('userId') as string;
    const conversationId = formData.get('conversationId') as string;

    if (!file || !userId || !conversationId) {
      return NextResponse.json(
        { error: 'Missing required fields: image, userId, conversationId' }, 
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` }, 
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' }, 
        { status: 400 }
      );
    }

    // Upload image to Firebase Storage
    const storageService = new ImageStorageService();
    const imageAttachment = await storageService.createImageAttachment(
      file, 
      userId, 
      conversationId
    );

    // Analyze image content using Vision API
    const analysisService = new ImageAnalysisService();
    const imageBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(imageBuffer).toString('base64');
    const analysis = await analysisService.analyzeImage(base64);

    // Add analysis to image attachment
    imageAttachment.analysis = analysis;

    const response: ImageUploadResponse = {
      image: imageAttachment,
      analysis: analysis
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Image upload failed:', error);
    return NextResponse.json(
      { error: 'Failed to upload and analyze image' }, 
      { status: 500 }
    );
  }
} 