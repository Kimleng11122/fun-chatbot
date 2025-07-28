import { NextRequest, NextResponse } from 'next/server';
import { getUserUsageStats, getUserUsageRecords } from '@/lib/database';
import { getPricingInfo } from '@/lib/openai';
import { UsageResponse } from '@/types/chat';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get usage statistics
    const stats = await getUserUsageStats(userId, days);
    
    // Get recent usage records
    const recentUsage = await getUserUsageRecords(userId, 50);
    
    // Get pricing information
    const pricing = getPricingInfo();

    const response: UsageResponse = {
      stats,
      recentUsage,
      pricing,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
} 