/**
 * ImageUpload - Component for uploading and inserting images into business plans
 * Part of Area 4: Editor completion
 * Based on strategic analysis report recommendations
 */

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

interface ImageUploadProps {
  onImageInsert: (imageUrl: string, caption?: string, description?: string) => void;
  maxSizeMB?: number;
  acceptedFormats?: string[];
  sectionId?: string;
}

export default function ImageUpload({
  onImageInsert,
  maxSizeMB = 5,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  sectionId
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!acceptedFormats.includes(file.type)) {
      alert(`Invalid file type. Accepted formats: ${acceptedFormats.join(', ')}`);
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      alert(`File size exceeds ${maxSizeMB}MB limit`);
      return;
    }

    setIsUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to server (or storage service)
      const imageUrl = await uploadImage(file);
      
      if (imageUrl) {
        // Insert image with caption/description
        onImageInsert(imageUrl, caption || undefined, description || undefined);
        
        // Reset form
        setPreview(null);
        setCaption('');
        setDescription('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error: any) {
      console.error('Image upload failed:', error);
      alert(`Upload failed: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    // Create FormData
    const formData = new FormData();
    formData.append('image', file);
    if (sectionId) {
      formData.append('sectionId', sectionId);
    }

    // Upload to API endpoint
    const response = await fetch('/api/images/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    const data = await response.json();
    return data.url; // Return the uploaded image URL
  };

  const handleRemove = () => {
    setPreview(null);
    setCaption('');
    setDescription('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-5 w-5 text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-900">Insert Image</h3>
      </div>

      {/* File Input */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          id={`image-upload-${sectionId || 'default'}`}
        />
        <label
          htmlFor={`image-upload-${sectionId || 'default'}`}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
              <span className="text-sm text-gray-600">Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-700">Choose Image</span>
            </>
          )}
        </label>
        <p className="text-xs text-gray-500 mt-1">
          Max size: {maxSizeMB}MB • Formats: {acceptedFormats.map(f => f.split('/')[1]).join(', ')}
        </p>
      </div>

      {/* Preview */}
      {preview && (
        <div className="space-y-2">
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-auto rounded-md border border-gray-200"
            />
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Caption Input */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Caption (optional)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Image caption..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Image description..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Insert Button */}
          <Button
            onClick={() => {
              if (preview) {
                // Re-upload if needed, or use preview as data URL
                // For now, we'll use the preview as the URL (in production, use uploaded URL)
                onImageInsert(preview, caption || undefined, description || undefined);
                handleRemove();
              }
            }}
            className="w-full"
            size="sm"
          >
            Insert Image
          </Button>
        </div>
      )}
    </div>
  );
}

