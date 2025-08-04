import { NextRequest, NextResponse } from 'next/server';
import { OPENAI_MODEL, countTokens, calculateCost } from '@/lib/openai';
import { ChatRequest, ChatResponse, Message, ImageAttachment } from '@/types/chat';
import { 
  saveMessage, 
  createConversation, 
  updateConversation, 
  getConversationMessages,
  saveUsageRecord
} from '@/lib/database';
import { memoryService } from '@/lib/memory';
import { llm } from '@/lib/langchain';
import { ImageStorageService } from '@/lib/images/storage';
import { ImageAnalysisService } from '@/lib/images/analysis';
import { ImageGenerationService } from '@/lib/images/generation';
import { generateId } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    console.log('Chat API - Request received');
    console.log('Chat API - Headers:', Object.fromEntries(request.headers.entries()));
    
    // Check if LLM is available
    if (!llm) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

        // Parse request body based on content type
    let body: ChatRequest;
    const contentType = request.headers.get('content-type') || '';
    
    console.log('Chat API - Content-Type:', contentType);
    
    if (contentType.includes('application/json')) {
      // Handle JSON request
      try {
        body = await request.json();
        console.log('Chat API - Parsed JSON body:', body);
      } catch (parseError) {
        console.error('Chat API - JSON parse error:', parseError);
        return NextResponse.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 }
        );
      }
    } else if (contentType.includes('multipart/form-data') || contentType === '') {
      // Handle FormData request (for image uploads)
      try {
        const formData = await request.formData();
        
        const message = formData.get('message') as string;
        const userId = formData.get('userId') as string;
        const conversationId = formData.get('conversationId') as string;
        const messageType = formData.get('messageType') as string;
        
        // Get image files
        const imageFiles: File[] = [];
        const images = formData.getAll('images');
        for (const image of images) {
          if (image instanceof File) {
            imageFiles.push(image);
          }
        }
        
        body = {
          message,
          userId,
          conversationId: conversationId || undefined,
          images: imageFiles.length > 0 ? imageFiles : undefined,
          messageType: messageType as 'text' | 'image-upload' | 'image-generation' | 'image-modification' | undefined,
        };
      } catch (formDataError) {
        console.error('Chat API - FormData parse error:', formDataError);
        return NextResponse.json(
          { error: 'Invalid FormData in request body' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Unsupported content type. Use application/json or multipart/form-data' },
        { status: 400 }
      );
    }

    const { userId, conversationId } = body;
    let { message } = body;

    // Allow empty message if images are present
    const hasImages = body.images && body.images.length > 0;
    
    if ((!message || message.trim() === '') && !hasImages) {
      return NextResponse.json(
        { error: 'Message or images are required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId is required' },
        { status: 400 }
      );
    }

    let currentConversationId = conversationId;
    let isNewConversation = false;

    // If no conversation ID, create a new conversation
    if (!currentConversationId) {
      const newConversation = await createConversation({
        userId,
        title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
        createdAt: new Date(),
        updatedAt: new Date(),
        messageCount: 0,
      });
      currentConversationId = newConversation.id;
      isNewConversation = true;
    }

    // Handle image uploads if present
    const imageAttachments: ImageAttachment[] = [];
    let messageType: 'text' | 'image-upload' | 'image-analysis' | 'image-generation' | 'image-modification' = 'text';
    
    if (body.images && body.images.length > 0) {
      console.log('Processing images:', body.images.length);
      messageType = 'image-upload';
      const storageService = new ImageStorageService();
      const analysisService = new ImageAnalysisService();
      
      // Process each uploaded image
      for (const imageFile of body.images) {
        try {
          console.log('Processing image:', imageFile.name, 'Size:', imageFile.size);
          
          // Upload image to storage
          const imageAttachment = await storageService.createImageAttachment(
            imageFile,
            userId,
            currentConversationId
          );
          
          console.log('Image uploaded, analyzing content...');
          
          // Analyze image content
          const imageBuffer = await imageFile.arrayBuffer();
          const base64 = Buffer.from(imageBuffer).toString('base64');
          const analysis = await analysisService.analyzeImage(base64);
          
          console.log('Image analysis completed:', {
            descriptionLength: analysis.description.length,
            descriptionPreview: analysis.description.substring(0, 100) + '...'
          });
          
          // Add analysis to attachment
          imageAttachment.analysis = analysis;
          imageAttachments.push(imageAttachment);
          
          console.log('Image attachment created:', {
            id: imageAttachment.id,
            url: imageAttachment.url,
            filename: imageAttachment.filename
          });
          
          // Store analysis in attachment (don't add to message content)
          // The AI will generate a user-friendly response based on the analysis
        } catch (error) {
          console.error('Failed to process image:', error);
          
          // Add error information to message for debugging
          const errorMessage = error instanceof Error ? error.message : String(error);
          message += `\n\n[Image Processing Error: ${errorMessage}]`;
          
          // Continue with other images even if one fails
        }
      }
      
      console.log('Total image attachments created:', imageAttachments.length);
    }
    
    // Set message type if specified
    if (body.messageType) {
      messageType = body.messageType;
    }

    // Create user message
    const userMessage: Omit<Message, 'id'> = {
      role: 'user',
      content: message,
      timestamp: new Date(),
      conversationId: currentConversationId,
      userId,
      ...(imageAttachments.length > 0 && { images: imageAttachments }),
      ...(messageType && { messageType }),
    };

    // Save user message to database
    const savedUserMessage = await saveMessage(userMessage);

    // Get conversation history for context
    const conversationMessages = await getConversationMessages(currentConversationId);
    
    // Build memory context with error handling
    let memoryContext;
    try {
      memoryContext = await memoryService.buildMemoryContext(
        userId,
        message,
        conversationMessages.map(msg => ({ role: msg.role, content: msg.content }))
      );
    } catch (error) {
      console.error('Error building memory context:', error);
      // Fallback to basic context if memory fails
      memoryContext = {
        recentMessages: conversationMessages.map(msg => `${msg.role}: ${msg.content}`),
        conversationSummary: '',
        relevantMemories: [],
        userContext: '',
      };
    }

    // Create enhanced prompt with memory context and image analysis
    let enhancedPrompt = `
You are a helpful AI assistant with access to conversation history and memory. 
Your goal is to provide helpful, accurate, and contextually relevant responses.

${memoryContext.userContext ? `Previous relevant conversations:\n${memoryContext.userContext}\n` : ''}
${memoryContext.conversationSummary ? `Current conversation summary:\n${memoryContext.conversationSummary}\n` : ''}

Recent conversation:
${memoryContext.recentMessages.slice(-6).join('\n')}

Human: ${message}`;

    // Add image analysis context if images are present
    if (imageAttachments.length > 0) {
      enhancedPrompt += `\n\nThe user has uploaded an image. Here's what I can see in the image:`;
      
      imageAttachments.forEach((attachment) => {
        if (attachment.analysis) {
          enhancedPrompt += `\n\n${attachment.analysis.description}`;
        }
      });
      
      enhancedPrompt += `\n\nPlease respond naturally to the user's request about the image. Describe what you see in a conversational way, as if you're talking to a friend. Do not mention that you analyzed the image or that you're an AI. Just describe what you observe in the image naturally.`;
    }

    enhancedPrompt += `\n\nAI Assistant:`;

    // Check if this is an image generation request
    const imageGenerationKeywords = [
      'generate', 'create', 'make', 'draw', 'design', 'produce', 'generate an image', 
      'create an image', 'make an image', 'draw an image', 'design an image',
      'generate a picture', 'create a picture', 'make a picture', 'draw a picture',
      'generate a photo', 'create a photo', 'make a photo'
    ];
    
    // Check if this is an image modification request
    const imageModificationKeywords = [
      'add', 'remove', 'change', 'modify', 'edit', 'replace', 'adjust',
      'make', 'turn', 'transform', 'alter', 'update', 'fix', 'correct',
      'put', 'insert', 'delete', 'erase', 'modify the image', 'edit the image',
      'change the image', 'add to the image', 'remove from the image'
    ];
    
    const lowerMessage = message.toLowerCase();
    const isImageGenerationRequest = imageGenerationKeywords.some(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );
    
    const isImageModificationRequest = imageModificationKeywords.some(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );

    // Check if there are images in the conversation for modification
    const conversationHasImages = conversationMessages.some(msg => 
      msg.images && msg.images.length > 0
    );
    
    const canModifyImage = isImageModificationRequest && conversationHasImages;

    // If it's an image generation request, update message type
    if (isImageGenerationRequest) {
      messageType = 'image-generation';
    }
    
    // If it's an image modification request, update message type
    if (canModifyImage) {
      messageType = 'image-modification';
    }

    // Get AI response using LangChain with error handling
    let aiContent: string;
    try {
      const aiResponse = await llm.invoke(enhancedPrompt);
      aiContent = aiResponse.content as string;
    } catch (error: unknown) {
      console.error('OpenAI API error:', error);
      
      // Handle specific OpenAI errors
      if (error && typeof error === 'object' && 'name' in error && error.name === 'InsufficientQuotaError' || 
          error && typeof error === 'object' && 'status' in error && error.status === 429) {
        return NextResponse.json(
          { 
            error: 'OpenAI quota exceeded. Please check your billing or try again later.',
            details: 'Your OpenAI account has reached its usage limit or rate limit.'
          },
          { status: 429 }
        );
      }
      
      if (error && typeof error === 'object' && 'name' in error && error.name === 'RateLimitError') {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded. Please wait a moment and try again.',
            details: 'Too many requests to OpenAI API.'
          },
          { status: 429 }
        );
      }
      
      if (error && typeof error === 'object' && 'name' in error && error.name === 'AuthenticationError' || 
          error && typeof error === 'object' && 'status' in error && error.status === 401) {
        return NextResponse.json(
          { 
            error: 'OpenAI authentication failed. Please check your API key.',
            details: 'Invalid or expired OpenAI API key.'
          },
          { status: 401 }
        );
      }
      
      // Generic error fallback
      return NextResponse.json(
        { 
          error: 'Failed to get AI response. Please try again.',
          details: (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') ? error.message : 'Unknown error occurred'
        },
        { status: 500 }
      );
    }

    // Handle image generation if requested
    if (isImageGenerationRequest) {
      try {
        const generationService = new ImageGenerationService();
        
        // Extract the prompt from the message (remove generation keywords)
        let prompt = message;
        for (const keyword of imageGenerationKeywords) {
          prompt = prompt.replace(new RegExp(keyword, 'gi'), '').trim();
        }
        
        // Clean up the prompt
        prompt = prompt.replace(/^(of|a|an)\s+/i, '').trim();
        
        if (!prompt) {
          prompt = 'a beautiful landscape'; // fallback prompt
        }
        
        // Generate the image
        const result = await generationService.generateFromText({
          prompt,
          size: '1024x1024',
          quality: 'standard',
          conversationContext: memoryContext?.conversationSummary || ''
        });
        
        // Create image attachment for the generated image
        const generatedImageAttachment: ImageAttachment = {
          id: generateId(),
          url: result.url,
          filename: `generated_${Date.now()}.png`,
          size: 0, // We don't know the actual size
          mimeType: 'image/png',
          width: 1024,
          height: 1024,
          uploadTimestamp: new Date(),
        };
        
        imageAttachments.push(generatedImageAttachment);
        
        // Update the AI content to acknowledge the generation
        aiContent = `I've generated an image based on your request: "${prompt}". Here's what I created for you:`;
        
      } catch (error: unknown) {
        console.error('Image generation failed:', error);
        
        // Provide more specific error messages based on the error type
        const errorMessage = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' 
          ? error.message 
          : '';
          
        if (errorMessage.includes('safety guidelines') || errorMessage.includes('inappropriate content')) {
          aiContent = `I couldn't generate that image because: ${errorMessage}. Please try describing something more appropriate and family-friendly.`;
        } else if (errorMessage.includes('Invalid request')) {
          aiContent = `I couldn't generate that image because: ${errorMessage}. Please be more specific about what you'd like to see.`;
        } else if (errorMessage.includes('Rate limit')) {
          aiContent = "I'm experiencing high demand right now. Please wait a moment and try again.";
        } else {
          aiContent = "I'm sorry, I wasn't able to generate an image for you. Please try again with a different description. Make sure your request is clear and appropriate.";
        }
      }
    }

    // Handle image modification if requested
    if (canModifyImage) {
      try {
        const generationService = new ImageGenerationService();
        
        // Find the most recent image in the conversation
        const recentImageMessage = conversationMessages
          .filter(msg => msg.images && msg.images.length > 0)
          .pop();
        
        if (!recentImageMessage || !recentImageMessage.images || recentImageMessage.images.length === 0) {
          aiContent = "I couldn't find an image to modify. Please upload an image first, then ask me to modify it.";
        } else {
          const imageToModify = recentImageMessage.images[0]; // Use the first image
          
          // Extract the modification prompt from the message
          let modificationPrompt = message;
          for (const keyword of imageModificationKeywords) {
            modificationPrompt = modificationPrompt.replace(new RegExp(keyword, 'gi'), '').trim();
          }
          
          // Clean up the prompt
          modificationPrompt = modificationPrompt.replace(/^(the|this|that)\s+/i, '').trim();
          
          if (!modificationPrompt) {
            modificationPrompt = 'modify the image as requested';
          }
          
          // Download the image from storage
          const response = await fetch(imageToModify.url);
          const imageBuffer = await response.arrayBuffer();
          const imageBase64 = Buffer.from(imageBuffer).toString('base64');
          
          // Modify the image
          const result = await generationService.editImage(imageBase64, modificationPrompt);
          
          // Create image attachment for the modified image
          const modifiedImageAttachment: ImageAttachment = {
            id: generateId(),
            url: result.url,
            filename: `modified_${Date.now()}.png`,
            size: 0, // We don't know the actual size
            mimeType: 'image/png',
            width: 1024,
            height: 1024,
            uploadTimestamp: new Date(),
          };
          
          imageAttachments.push(modifiedImageAttachment);
          
          // Update the AI content to acknowledge the modification
          aiContent = `I've modified the image based on your request: "${modificationPrompt}". Here's the modified version:`;
        }
        
      } catch (error: unknown) {
        console.error('Image modification failed:', error);
        
        // Provide more specific error messages based on the error type
        const errorMessage = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' 
          ? error.message 
          : '';
          
        if (errorMessage.includes('safety guidelines') || errorMessage.includes('inappropriate content')) {
          aiContent = `I couldn't modify that image because: ${errorMessage}. Please try describing a more appropriate modification.`;
        } else if (errorMessage.includes('Invalid request')) {
          aiContent = `I couldn't modify that image because: ${errorMessage}. Please be more specific about what you'd like to change.`;
        } else if (errorMessage.includes('Rate limit')) {
          aiContent = "I'm experiencing high demand right now. Please wait a moment and try again.";
        } else {
          aiContent = "I'm sorry, I wasn't able to modify the image. Please try again with a different description. Make sure your request is clear and appropriate.";
        }
      }
    }

    // Calculate token usage
    const promptTokens = countTokens(enhancedPrompt);
    const completionTokens = countTokens(aiContent);
    const totalTokens = promptTokens + completionTokens;
    const cost = calculateCost(promptTokens, completionTokens, OPENAI_MODEL);

    // Calculate image-related costs
    let imageAnalysisCost = 0;
    let imageGenerationCost = 0;
    let imageModificationCost = 0;
    let storageCost = 0;
    
    if (imageAttachments.length > 0) {
      // Estimate Vision API costs (rough calculation)
      imageAnalysisCost = imageAttachments.length * 0.01; // ~$0.01 per image analysis
      
      // Estimate storage costs (rough calculation)
      const totalImageSize = imageAttachments.reduce((sum, img) => sum + img.size, 0);
      storageCost = (totalImageSize / (1024 * 1024 * 1024)) * 0.02; // ~$0.02 per GB
    }
    
    // Calculate image generation costs if applicable
    if (isImageGenerationRequest) {
      imageGenerationCost = 0.04; // ~$0.04 per DALL-E 3 generation
    }
    
    // Calculate image modification costs if applicable
    if (canModifyImage) {
      imageModificationCost = 0.04; // ~$0.04 per DALL-E 3 modification
    }

    // Save usage record
    await saveUsageRecord({
      userId,
      conversationId: currentConversationId,
      messageId: savedUserMessage.id,
      model: OPENAI_MODEL,
      promptTokens,
      completionTokens,
      totalTokens,
      cost,
      timestamp: new Date(),
      imageAnalysisCost,
      imageGenerationCost,
      imageModificationCost,
      storageCost,
    });

    // Create AI message with image attachments if present
    const aiMessage: Omit<Message, 'id'> = {
      role: 'assistant',
      content: aiContent,
      timestamp: new Date(),
      conversationId: currentConversationId,
      userId,
      ...(imageAttachments.length > 0 && { images: imageAttachments }),
      messageType: isImageGenerationRequest ? 'image-generation' : 
                   canModifyImage ? 'image-modification' :
                   imageAttachments.length > 0 ? 'image-analysis' : 'text',
    };

    // Save AI message to database
    const savedAiMessage = await saveMessage(aiMessage);

    // Update conversation metadata
    await updateConversation(currentConversationId, {
      messageCount: conversationMessages.length + 2, // +2 for user and AI messages
      title: isNewConversation ? message.slice(0, 50) + (message.length > 50 ? '...' : '') : undefined,
    });

    // Create conversation summary if we have enough messages
    if (conversationMessages.length >= 8) {
      try {
        await memoryService.createConversationSummary(
          userId,
          currentConversationId,
          conversationMessages.map(msg => ({ role: msg.role, content: msg.content }))
        );
      } catch (error) {
        console.error('Error creating conversation summary:', error);
        // Don't fail the entire request if summary creation fails
      }
    }

    const response: ChatResponse = {
      message: savedAiMessage,
      conversationId: currentConversationId,
      isNewConversation,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API error:', error);
    
    // Provide more specific error information
    let errorMessage = 'Failed to process chat request';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message);
    }
    
    console.error('Detailed error information:', {
      message: errorMessage,
      details: errorDetails,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 