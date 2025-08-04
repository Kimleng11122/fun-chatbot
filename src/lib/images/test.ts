import { ImageStorageService, ImageGenerationService, ImageAnalysisService } from './index';

export async function testImageServices() {
  console.log('Testing image services...');
  
  try {
    // Test storage service
    new ImageStorageService();
    console.log('✅ ImageStorageService initialized');
    
    // Test generation service
    const generationService = new ImageGenerationService();
    console.log('✅ ImageGenerationService initialized');
    
    // Test analysis service
    new ImageAnalysisService();
    console.log('✅ ImageAnalysisService initialized');
    
    // Test cost estimation
    const cost = generationService.estimateCost('1024x1024', 'standard');
    console.log(`✅ Cost estimation working: $${cost}`);
    
    console.log('🎉 All image services are properly configured!');
    return true;
  } catch (error) {
    console.error('❌ Image services test failed:', error);
    return false;
  }
} 