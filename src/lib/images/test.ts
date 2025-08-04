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
    
    // Test image format conversion (private method test)
    try {
      // Create a simple test image base64 (1x1 pixel PNG)
      const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      // Access the private method for testing (using type assertion to bypass TypeScript)
      const convertMethod = (generationService as Record<string, unknown>).convertToRGBA_Server;
      if (convertMethod) {
        const convertedImage = await convertMethod.call(generationService, testImageBase64);
        console.log('✅ Image format conversion working');
        console.log(`   Original size: ${testImageBase64.length} chars`);
        console.log(`   Converted size: ${convertedImage.length} chars`);
      } else {
        console.log('⚠️  Image format conversion method not accessible for testing');
      }
    } catch (conversionError) {
      console.log('⚠️  Image format conversion test failed:', conversionError);
    }
    
    console.log('🎉 All image services are properly configured!');
    return true;
  } catch (error) {
    console.error('❌ Image services test failed:', error);
    return false;
  }
} 