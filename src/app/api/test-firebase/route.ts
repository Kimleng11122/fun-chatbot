import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';

export async function GET() {
  try {
    // Test Firestore connection by trying to read from a test collection
    const testDoc = await db.collection('test').doc('connection').get();
    
    return NextResponse.json({
      success: true,
      message: 'Firebase connection successful!',
      projectId: process.env.FIREBASE_PROJECT_ID,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Firebase connection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Firebase connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
} 