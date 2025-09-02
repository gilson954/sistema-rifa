import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  url?: string;
  uploading: boolean;
  error?: string;
}

export interface UseImageUploadReturn {
  images: UploadedImage[];
  uploading: boolean;
  uploadProgress: number;
  addImages: (files: File[]) => void;
  removeImage: (id: string) => void;
  reorderImages: (fromIndex: number, toIndex: number) => void;
  uploadImages: (userId: string) => Promise<string[]>;
  clearImages: () => void;
  setExistingImages: (urls: string[]) => void;
}

/**
 * Custom hook for managing image uploads with Supabase Storage
 * Handles file validation, preview generation, upload progress, and error states
 */
export const useImageUpload = (): UseImageUploadReturn => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /**
   * Validates image file type and size
   */
  const validateFile = (file: File): string | null => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      return 'Tipo de arquivo não suportado. Use JPG, PNG ou WebP.';
    }

    if (file.size > maxSize) {
      return 'Arquivo muito grande. Máximo 5MB por imagem.';
    }

    return null;
  };

  /**
   * Adds new images to the upload queue
   */
  const addImages = useCallback((files: File[]) => {
    const newImages: UploadedImage[] = [];

    files.forEach((file) => {
      const error = validateFile(file);
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const preview = URL.createObjectURL(file);

      newImages.push({
        id,
        file,
        preview,
        uploading: false,
        error: error || undefined,
      });
    });

    setImages(prev => [...prev, ...newImages]);
  }, []);

  /**
   * Removes an image from the upload queue
   */
  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove?.preview) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  }, []);

  /**
   * Reorders images in the upload queue
   */
  const reorderImages = useCallback((fromIndex: number, toIndex: number) => {
    setImages(prev => {
      const newImages = [...prev];
      const [movedImage] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, movedImage);
      return newImages;
    });
  }, []);

  /**
   * Uploads all images to Supabase Storage
   */
  const uploadImages = useCallback(async (userId: string): Promise<string[]> => {
    const validImages = images.filter(img => !img.error && !img.url);
    
    if (validImages.length === 0) {
      return images.filter(img => img.url).map(img => img.url!);
    }

    setUploading(true);
    setUploadProgress(0);

    const uploadedUrls: string[] = [];
    const existingUrls = images.filter(img => img.url).map(img => img.url!);

    try {
      for (let i = 0; i < validImages.length; i++) {
        const image = validImages[i];
      const filePath = `logos/${user.id}/${fileName}`;
        // Update image state to show uploading
        setImages(prev => prev.map(img => 
          img.id === image.id ? { ...img, uploading: true } : img
        ));

        // Generate unique filename
        const fileExt = image.file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('prize-images')
          .upload(fileName, image.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          throw error;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('prize-images')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);

        // Update image state with URL
        setImages(prev => prev.map(img => 
          img.id === image.id 
            ? { ...img, uploading: false, url: publicUrl }
            : img
        ));

        // Update progress
        setUploadProgress(((i + 1) / validImages.length) * 100);
      }

      return [...existingUrls, ...uploadedUrls];
    } catch (error) {
      console.error('Error uploading images:', error);
      
      // Update failed images with error state
      setImages(prev => prev.map(img => 
        validImages.some(validImg => validImg.id === img.id) && img.uploading
          ? { ...img, uploading: false, error: 'Erro no upload' }
          : img
      ));

      throw error;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [images]);

  /**
   * Clears all images from the upload queue
   */
  const clearImages = useCallback(() => {
    images.forEach(img => {
      if (img.preview) {
        URL.revokeObjectURL(img.preview);
      }
    });
    setImages([]);
  }, [images]);

  /**
   * Sets existing images from URLs (for editing existing campaigns)
   */
  const setExistingImages = useCallback((urls: string[]) => {
    const existingImages: UploadedImage[] = urls.map((url, index) => ({
      id: `existing-${index}`,
      file: new File([], 'existing-image'),
      preview: url,
      url,
      uploading: false,
    }));
    
    setImages(existingImages);
  }, []);

  return {
    images,
    uploading,
    uploadProgress,
    addImages,
    removeImage,
    reorderImages,
    uploadImages,
    clearImages,
    setExistingImages,
  };
};