import React, { useRef, useState } from 'react';
import { Upload, X, ChevronUp, ChevronDown, ZoomIn, Loader2 } from 'lucide-react';
import { UploadedImage } from '../hooks/useImageUpload';

interface ImageUploadProps {
  images: UploadedImage[];
  uploading: boolean;
  uploadProgress: number;
  onAddImages: (files: File[]) => void;
  onRemoveImage: (id: string) => void;
  onReorderImage: (fromIndex: number, toIndex: number) => void;
}

/**
 * Image upload component with drag & drop, preview, and reordering functionality
 */
export const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  uploading,
  uploadProgress,
  onAddImages,
  onRemoveImage,
  onReorderImage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  /**
   * Handles file selection from input
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onAddImages(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  /**
   * Handles drag and drop events
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      onAddImages(files);
    }
  };

  /**
   * Opens file selection dialog
   */
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handles image reordering
   */
  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < images.length) {
      onReorderImage(index, newIndex);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 cursor-pointer ${
          dragOver
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleUploadClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4">
          <Upload className="h-8 w-8 text-gray-400" />
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Arraste e solte suas imagens aqui ou clique para selecionar
        </p>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p>Formatos aceitos: JPG, PNG, WebP</p>
          <p>Tamanho máximo: 5MB por imagem</p>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
            <span className="text-blue-800 dark:text-blue-200 font-medium">
              Enviando imagens... {Math.round(uploadProgress)}%
            </span>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
            <div
              className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white">
            Imagens Selecionadas ({images.length})
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="relative group bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden"
              >
                {/* Image Preview */}
                <div className="aspect-square relative">
                  <img
                    src={image.preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setEnlargedImage(image.preview)}
                  />
                  
                  {/* Loading Overlay */}
                  {image.uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                  
                  {/* Error Overlay */}
                  {image.error && (
                    <div className="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center">
                      <span className="text-white text-xs text-center p-2">
                        {image.error}
                      </span>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {/* Zoom Button */}
                  <button
                    onClick={() => setEnlargedImage(image.preview)}
                    className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-75 transition-colors duration-200"
                    title="Ampliar imagem"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => onRemoveImage(image.id)}
                    className="p-1 bg-red-500 bg-opacity-75 text-white rounded hover:bg-opacity-100 transition-colors duration-200"
                    title="Remover imagem"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Reorder Controls */}
                <div className="absolute top-2 left-2 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {index > 0 && (
                    <button
                      onClick={() => handleMoveImage(index, 'up')}
                      className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-75 transition-colors duration-200"
                      title="Mover para cima"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                  )}
                  
                  {index < images.length - 1 && (
                    <button
                      onClick={() => handleMoveImage(index, 'down')}
                      className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-75 transition-colors duration-200"
                      title="Mover para baixo"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Image Index */}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enlarged Image Modal */}
      {enlargedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={enlargedImage}
              alt="Enlarged preview"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};