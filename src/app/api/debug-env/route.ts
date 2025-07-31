import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check environment variables without exposing sensitive data
    const envCheck = {
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      openaiKeyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
      openaiKeyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 7) : 'N/A',
      openaiModel: process.env.OPENAI_MODEL || 'Not set',
      hasFirebaseConfig: {
        projectId: !!process.env.FIREBASE_PROJECT_ID,
        clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      },
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(envCheck);
  } catch (error) {
    console.error('Debug env error:', error);
    return NextResponse.json(
      { error: 'Failed to check environment variables' },
      { status: 500 }
    );
  }
} 