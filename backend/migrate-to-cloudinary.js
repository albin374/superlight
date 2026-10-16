import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { initDatabase } from './database.js';
import { isCloudinaryConfigured, uploadToCloudinary } from './cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, 'uploads');
const backendPublic = path.join(__dirname, 'public');
const rootPublic = path.join(__dirname, '..', 'public');

async function findImageBufferOrPath(imgRef) {
  if (!imgRef || typeof imgRef !== 'string') return null;

  // Clean the reference
  const filename = path.basename(imgRef);

  // 1. Check local backend/uploads
  const uploadPath = path.join(uploadsDir, filename);
  if (fs.existsSync(uploadPath)) return uploadPath;

  // 2. Check backend/public
  const backendPubPath = path.join(backendPublic, filename);
  if (fs.existsSync(backendPubPath)) return backendPubPath;

  // 3. Check root public
  const rootPubPath = path.join(rootPublic, filename);
  if (fs.existsSync(rootPubPath)) return rootPubPath;

  // 4. Check MySQL uploaded_files table
  try {
    const row = await db.prepare('SELECT file_data FROM uploaded_files WHERE filename = ?').get(filename);
    if (row && row.file_data) {
      return Buffer.from(row.file_data);
    }
  } catch (e) {}

  return null;
}

export async function runCloudinaryMigration() {
  await initDatabase();

  console.log('==================================================================');
  console.log('🚀 Superlight -> Cloudinary Image Migration');
  console.log('==================================================================');

  if (!isCloudinaryConfigured()) {
    console.error('❌ Cloudinary is NOT configured in .env!');
    console.error('Please configure the following in backend/.env:');
    console.error('  CLOUDINARY_CLOUD_NAME=your_cloud_name');
    console.error('  CLOUDINARY_API_KEY=your_api_key');
    console.error('  CLOUDINARY_API_SECRET=your_api_secret');
    return { success: false, message: 'Cloudinary not configured' };
  }

  console.log('✅ Cloudinary credentials verified.');
  console.log('🔍 Scanning database for products and brands with local/relative images...');

  let productsMigrated = 0;
  let brandsMigrated = 0;
  let filesMigrated = 0;

  // Cache of already uploaded filenames to avoid re-uploading duplicates
  const uploadedUrlMap = new Map();

  async function getOrUploadToCloudinary(imgRef, folder = 'superlight/products') {
    if (!imgRef || typeof imgRef !== 'string') return imgRef;
    if (imgRef.startsWith('http://') || imgRef.startsWith('https://')) {
      return imgRef; // Already an absolute remote URL (e.g. already Cloudinary)
    }

    const filename = path.basename(imgRef);
    if (uploadedUrlMap.has(filename)) {
      return uploadedUrlMap.get(filename);
    }

    const source = await findImageBufferOrPath(imgRef);
    if (!source) {
      console.warn(`  ⚠️ Could not find source file for: ${imgRef}`);
      return imgRef;
    }

    try {
      console.log(`  ☁️ Uploading to Cloudinary: ${filename}...`);
      const res = await uploadToCloudinary(source, {
        folder,
        public_id: path.parse(filename).name
      });
      console.log(`  ✅ Uploaded: ${res.secure_url}`);
      uploadedUrlMap.set(filename, res.secure_url);
      filesMigrated++;
      return res.secure_url;
    } catch (err) {
      console.error(`  ❌ Failed uploading ${filename} to Cloudinary:`, err.message);
      return imgRef;
    }
  }

  // 1. Migrate Products
  const products = await db.prepare('SELECT id, name, image, images FROM products').all();
  console.log(`📦 Found ${products.length} products to check...`);

  for (const prod of products) {
    let changed = false;
    let newPrimaryImage = prod.image;
    let newImages = [];

    // Parse images array
    let imagesArr = [];
    try {
      imagesArr = typeof prod.images === 'string' ? JSON.parse(prod.images || '[]') : (prod.images || []);
    } catch (e) {
      imagesArr = [];
    }

    if (prod.image && !prod.image.startsWith('http')) {
      const cUrl = await getOrUploadToCloudinary(prod.image, 'superlight/products');
      if (cUrl !== prod.image) {
        newPrimaryImage = cUrl;
        changed = true;
      }
    }

    if (Array.isArray(imagesArr) && imagesArr.length > 0) {
      for (const img of imagesArr) {
        if (img && !img.startsWith('http')) {
          const cUrl = await getOrUploadToCloudinary(img, 'superlight/products');
          newImages.push(cUrl);
          if (cUrl !== img) changed = true;
        } else {
          newImages.push(img);
        }
      }
    } else if (newPrimaryImage) {
      newImages = [newPrimaryImage];
    }

    if (changed) {
      await db.prepare('UPDATE products SET image = ?, images = ? WHERE id = ?').run(
        newPrimaryImage,
        JSON.stringify(newImages),
        prod.id
      );
      productsMigrated++;
      console.log(`  ✨ Updated product #${prod.id} (${prod.name}) with Cloudinary URLs.`);
    }
  }

  // 2. Migrate Brands
  const brands = await db.prepare('SELECT id, name, image FROM brands').all();
  console.log(`🏷️ Found ${brands.length} brands to check...`);

  for (const brand of brands) {
    if (brand.image && !brand.image.startsWith('http')) {
      const cUrl = await getOrUploadToCloudinary(brand.image, 'superlight/brands');
      if (cUrl !== brand.image) {
        await db.prepare('UPDATE brands SET image = ? WHERE id = ?').run(cUrl, brand.id);
        brandsMigrated++;
        console.log(`  ✨ Updated brand #${brand.id} (${brand.name}) with Cloudinary logo: ${cUrl}`);
      }
    }
  }

  console.log('==================================================================');
  console.log(`🎉 Migration Completed Successfully!`);
  console.log(`   - Uploaded files to Cloudinary: ${filesMigrated}`);
  console.log(`   - Products updated: ${productsMigrated}`);
  console.log(`   - Brands updated: ${brandsMigrated}`);
  console.log('==================================================================');

  return {
    success: true,
    filesMigrated,
    productsMigrated,
    brandsMigrated
  };
}

// Run directly if invoked from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCloudinaryMigration()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

