import { NextResponse } from 'next/server';
import { llm } from '@/lib/langchain';
import { OPENAI_MODEL } from '@/lib/openai';
import { memoryService } from '@/lib/memory';

export async function GET() {
  try {
    // Get OpenAI status from memory service
    const openaiStatus = memoryService.getOpenAIStatus();
    
    // Check if LLM is available
    if (!llm) {
      return NextResponse.json(
        { 
          error: 'OpenAI API key not configured',
          model: OPENAI_MODEL,
          hasApiKey: !!process.env.OPENAI_API_KEY,
          openaiStatus,
          recommendations: [
            'Check if OPENAI_API_KEY environment variable is set',
            'Verify the API key is valid and not expired',
            'Ensure the API key has sufficient permissions'
          ]
        },
        { status: 500 }
      );
    }

    // Test with a simple prompt
    const testPrompt = 'Hello! Please respond with "OpenAI is working correctly."';
    
    try {
      const response = await llm.invoke(testPrompt);
      const content = response.content as string;
      
      return NextResponse.json({
        success: true,
        model: OPENAI_MODEL,
        response: content,
        timestamp: new Date().toISOString(),
        openaiStatus,
        summaryGenerationEnabled: memoryService.shouldGenerateSummary(),
        diagnostics: {
          apiKeyConfigured: !!process.env.OPENAI_API_KEY,
          modelConfigured: !!OPENAI_MODEL,
          llmInitialized: !!llm,
          memoryServiceAvailable: !!memoryService
        }
      });
    } catch (error: unknown) {
      console.error('OpenAI test error:', error);
      
      // Enhanced error analysis
      let errorDetails = {
        message: 'Unknown error',
        type: 'Unknown',
        status: null as number | null,
        recommendations: [] as string[]
      };
      
      if (error && typeof error === 'object' && 'name' in error && 'message' in error) {
        const errorObj = error as { name?: string; message?: string; status?: number };
        
        errorDetails = {
          message: errorObj.message || 'Unknown error',
          type: errorObj.name || 'Unknown',
          status: errorObj.status || null,
          recommendations: []
        };
        
        // Provide specific recommendations based on error type
        if (errorObj.name === 'InsufficientQuotaError' || errorObj.status === 429) {
          errorDetails.recommendations = [
            'Check your OpenAI billing and payment method',
            'Verify your usage limits in OpenAI dashboard',
            'Consider upgrading your OpenAI plan',
            'Check if you have any pending payments',
            'Wait a few minutes and try again (rate limiting)'
          ];
        } else if (errorObj.name === 'AuthenticationError' || errorObj.status === 401) {
          errorDetails.recommendations = [
            'Verify your OpenAI API key is correct',
            'Check if your API key has expired',
            'Ensure your API key has the necessary permissions',
            'Try regenerating your API key'
          ];
        } else if (errorObj.name === 'RateLimitError') {
          errorDetails.recommendations = [
            'Wait a few minutes before trying again',
            'Check your rate limits in OpenAI dashboard',
            'Consider implementing exponential backoff',
            'Monitor your API usage patterns'
          ];
        } else {
          errorDetails.recommendations = [
            'Check OpenAI service status',
            'Verify your internet connection',
            'Try again in a few minutes',
            'Contact OpenAI support if the issue persists'
          ];
        }
      }
      
      return NextResponse.json({
        success: false,
        model: OPENAI_MODEL,
        error: errorDetails.message,
        errorType: errorDetails.type,
        status: errorDetails.status,
        recommendations: errorDetails.recommendations,
        timestamp: new Date().toISOString(),
        openaiStatus,
        diagnostics: {
          apiKeyConfigured: !!process.env.OPENAI_API_KEY,
          modelConfigured: !!OPENAI_MODEL,
          llmInitialized: !!llm,
          memoryServiceAvailable: !!memoryService
        }
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test OpenAI configuration',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 