/**
 * ImageBlock component for editor
 * Displays and manages images
 */

import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ImageBlockProps {
  src?: string;
  alt?: string;
  caption?: string;
  title?: string;
  onEdit?: (imageData: ImageData) => void;
}

interface ImageData {
  src: string;
  alt: string;
  caption: string;
}

export default function ImageBlock({ 
  src, 
  alt = '', 
  caption = '', 
  title = "Image",
  onEdit 
}: ImageBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [imageData, setImageData] = useState<ImageData>({
    src: src || '',
    alt: alt,
    caption: caption
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (field: keyof ImageData, value: string) => {
    setImageData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      // In a real app, you'd upload to a cloud service
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImageData(prev => ({ ...prev, src: result }));
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    if (onEdit) {
      onEdit(imageData);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setImageData({
      src: src || '',
      alt: alt,
      caption: caption
    });
  };


  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {onEdit && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Image URL</label>
            <Input
              value={imageData.src}
              onChange={(e) => handleImageChange('src', e.target.value)}
              placeholder="Enter image URL"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Upload Image</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Choose File'}
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Alt Text</label>
            <Input
              value={imageData.alt}
              onChange={(e) => handleImageChange('alt', e.target.value)}
              placeholder="Describe the image for accessibility"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Caption</label>
            <Input
              value={imageData.caption}
              onChange={(e) => handleImageChange('caption', e.target.value)}
              placeholder="Image caption"
            />
          </div>

          {imageData.src && (
            <div>
              <label className="block text-sm font-medium mb-2">Preview</label>
              <div className="border border-gray-200 rounded p-2">
                <img
                  src={imageData.src}
                  alt={imageData.alt}
                  className="max-w-full h-auto max-h-64 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {imageData.src ? (
            <div className="text-center">
              <img
                src={imageData.src}
                alt={imageData.alt}
                className="max-w-full h-auto max-h-96 mx-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              {imageData.caption && (
                <p className="text-sm text-gray-600 mt-2 italic">{imageData.caption}</p>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-300 rounded">
              <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>No image selected</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
