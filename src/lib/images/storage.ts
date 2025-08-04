import { storage } from '@/lib/firebase';
import { ImageAttachment } from '@/types/chat';

export class ImageStorageService {
  /**
   * Upload an image to Firebase Storage
   */
  async uploadImage(
    file: File, 
    userId: string, 
    conversationId: string
  ): Promise<{ url: string; filename: string }> {
    if (!storage) {
      throw new Error('Firebase Storage not initialized');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 10MB.');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const imageId = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storagePath = `images/${userId}/${conversationId}/${imageId}`;
    
    // Get bucket name from environment variable or use default
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'nubiq-docs-2024.firebasestorage.app';
    const bucket = storage.bucket(bucketName);
    const fileRef = bucket.file(storagePath);
    
    try {
      // Convert File to Buffer for upload
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Upload file
      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type,
        }
      });
      
      // Get download URL
      const [url] = await fileRef.getSignedUrl({
        action: 'read',
        expires: '03-01-2500' // Far future expiration
      });
      
      return {
        url: url,
        filename: imageId
      };
    } catch (error) {
      console.error('Image upload failed:', error);
      throw new Error('Failed to upload image');
    }
  }

  /**
   * Delete an image from Firebase Storage
   */
  async deleteImage(imageUrl: string): Promise<void> {
    if (!storage) {
      throw new Error('Firebase Storage not initialized');
    }

    try {
      // Extract the path from the URL
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+?)\?/);
      
      if (!pathMatch) {
        throw new Error('Invalid image URL format');
      }
      
      const storagePath = decodeURIComponent(pathMatch[1]);
      const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'nubiq-docs-2024.firebasestorage.app';
      const bucket = storage.bucket(bucketName);
      const fileRef = bucket.file(storagePath);
      
      await fileRef.delete();
    } catch (error) {
      console.error('Image deletion failed:', error);
      throw new Error('Failed to delete image');
    }
  }

  /**
   * Get image metadata from URL
   */
  async getImageMetadata(imageUrl: string): Promise<{ width: number; height: number; size: number }> {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // For server-side, we'll use a simpler approach since we can't use the Image constructor
      // We'll return the file size and default dimensions
      return {
        width: 0, // We'll get this from the file itself if needed
        height: 0, // We'll get this from the file itself if needed
        size: blob.size
      };
    } catch (error) {
      console.error('Failed to get image metadata:', error);
      return { width: 0, height: 0, size: 0 };
    }
  }

  /**
   * Create a complete ImageAttachment object
   */
  async createImageAttachment(
    file: File,
    userId: string,
    conversationId: string
  ): Promise<ImageAttachment> {
    const { url, filename } = await this.uploadImage(file, userId, conversationId);
    
    return {
      id: filename,
      url,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
      width: 0, // We'll get this from client-side if needed
      height: 0, // We'll get this from client-side if needed
      uploadTimestamp: new Date(),
    };
  }

  /**
   * Clean up orphaned images (optional maintenance function)
   */
  async cleanupOrphanedImages(userId: string, conversationId: string): Promise<void> {
    // This would be implemented to clean up images that are no longer referenced
    // in the database but still exist in storage
    console.log(`Cleanup not implemented for user ${userId}, conversation ${conversationId}`);
  }
} 