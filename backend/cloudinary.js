import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import streamifier from 'stream';

dotenv.config();

// Initialize Cloudinary credentials from environment variables
function initCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY || process.env.API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.API_SECRET;
  const cloudinaryUrl = process.env.CLOUDINARY_URL;

  if (cloudinaryUrl) {
    cloudinary.config({
      cloudinary_url: cloudinaryUrl,
      secure: true
    });
  } else if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName.trim(),
      api_key: apiKey.trim(),
      api_secret: apiSecret.trim(),
      secure: true
    });
  }
}

// Call on module load
initCloudinary();

/**
 * Returns true if valid Cloudinary credentials have been provided.
 */
export function isCloudinaryConfigured() {
  const config = cloudinary.config();
  if (config.cloud_name && config.api_key && config.api_secret) {
    // Check they are not default placeholder strings
    const isPlaceholder = ['your_cloud_name', 'your_api_key', 'your_api_secret'].some(p => 
      String(config.cloud_name).includes(p) || 
      String(config.api_key).includes(p)
    );
    return !isPlaceholder;
  }
  return false;
}

/**
 * Returns configuration details for status reporting (hiding secrets)
 */
export function getCloudinaryStatus() {
  const configured = isCloudinaryConfigured();
  const config = cloudinary.config();
  return {
    configured,
    cloud_name: configured ? config.cloud_name : null,
    api_key_last4: configured && config.api_key ? String(config.api_key).slice(-4) : null
  };
}

/**
 * Upload a file (by local file path or buffer) to Cloudinary.
 * @param {string|Buffer} fileInput - Path to local file, or raw file Buffer
 * @param {Object} options - Custom options (e.g., folder, public_id, transformation)
 * @returns {Promise<Object>} Cloudinary upload result including `secure_url` and `public_id`
 */
export async function uploadToCloudinary(fileInput, options = {}) {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env');
  }

  const uploadOptions = {
    folder: options.folder || 'superlight/uploads',
    resource_type: options.resource_type || 'auto',
    transformation: options.transformation || [
      { quality: 'auto', fetch_format: 'auto' }
    ],
    ...options
  };

  // If input is a Buffer, upload via stream
  if (Buffer.isBuffer(fileInput)) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) {
          console.error('[Cloudinary Stream Upload Error]:', error);
          return reject(error);
        }
        resolve(result);
      });

      const readable = new streamifier.Readable();
      readable._read = () => {};
      readable.push(fileInput);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }

  // If input is a file path
  if (typeof fileInput === 'string') {
    if (!fs.existsSync(fileInput)) {
      throw new Error(`File does not exist at path: ${fileInput}`);
    }
    const result = await cloudinary.uploader.upload(fileInput, uploadOptions);
    return result;
  }

  throw new Error('Invalid fileInput provided to uploadToCloudinary. Must be a file path string or Buffer.');
}

/**
 * Delete an asset from Cloudinary by its public_id
 * @param {string} publicId
 * @returns {Promise<Object>}
 */
export async function deleteFromCloudinary(publicId) {
  if (!isCloudinaryConfigured() || !publicId) return null;
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error(`[Cloudinary Delete Error for ${publicId}]:`, err.message);
    return null;
  }
}

/**
 * Helper to extract public_id from a Cloudinary secure_url
 * e.g., https://res.cloudinary.com/cloudname/image/upload/v12345/superlight/uploads/abc.jpg -> superlight/uploads/abc
 */
export function extractPublicId(url) {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return null;
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    const afterUpload = parts[1]; // e.g. v12345/superlight/uploads/abc.jpg or superlight/uploads/abc.jpg
    const withoutVersion = afterUpload.replace(/^v\d+\//, '');
    const withoutExt = withoutVersion.replace(/\.[^/.]+$/, '');
    return withoutExt;
  } catch (e) {
    return null;
  }
}

export default {
  cloudinary,
  isCloudinaryConfigured,
  getCloudinaryStatus,
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicId
};

