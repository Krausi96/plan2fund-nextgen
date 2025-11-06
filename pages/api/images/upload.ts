/**
 * API endpoint for image uploads
 * Stores images and returns URLs for insertion into business plans
 */

import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Type definitions for formidable
declare module 'formidable' {
  interface File {
    filepath: string;
    originalFilename: string | null;
    mimetype: string | null;
    size: number;
  }
}

// Disable default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form data
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image as formidable.File | undefined;

    if (!imageFile) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!imageFile.mimetype || !allowedTypes.includes(imageFile.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    // Generate unique filename
    const fileExtension = path.extname(imageFile.originalFilename || 'image.jpg');
    const filename = `${uuidv4()}${fileExtension}`;
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'images');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Move file to uploads directory
    const filePath = path.join(uploadsDir, filename);
    fs.renameSync(imageFile.filepath, filePath);

    // Return URL (relative to public directory)
    const imageUrl = `/uploads/images/${filename}`;

    return res.status(200).json({
      url: imageUrl,
      filename,
      size: imageFile.size,
      type: imageFile.mimetype,
    });
  } catch (error: any) {
    console.error('Image upload error:', error);
    return res.status(500).json({
      error: 'Upload failed',
      message: error?.message || 'Unknown error',
    });
  }
}

