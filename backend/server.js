import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import dotenv from 'dotenv';
import db, { initDatabase } from './database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'superlight_ultra_secure_jwt_secret_key_2026';
const PORT = process.env.PORT || 5000;

const app = express();

// Initialize SQL database
await initDatabase();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage for product uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `upload_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Serve static assets:
// 1. Backend public folder (contains admin & shared assets)
const backendPublic = path.join(__dirname, 'public');
if (fs.existsSync(backendPublic)) {
  app.use(express.static(backendPublic));
}
// 1b. Root public folder (for existing product images if deployed together)
const rootPublic = path.join(__dirname, '..', 'public');
if (fs.existsSync(rootPublic)) {
  app.use(express.static(rootPublic));
}

// 2. Uploaded images (Persistent Cloud Storage Layer for Render / Ephemeral hosts)
app.get('/uploads/:filename', async (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(uploadsDir, filename);

    // 1. If cached on local container disk, serve directly
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }

    // 2. If missing on disk (Render container restarted/wiped), fetch from MySQL database
    const fileRow = await db.prepare('SELECT mime_type, file_data FROM uploaded_files WHERE filename = ?').get(filename);
    if (fileRow && fileRow.file_data) {
      // Re-hydrate on local disk for subsequent fast access
      try {
        fs.writeFileSync(filePath, fileRow.file_data);
      } catch (e) {}

      res.setHeader('Content-Type', fileRow.mime_type || 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.send(fileRow.file_data);
    }

    // 3. Graceful fallback if image is not in DB: serve default product image with 200 OK
    const backendFallback = path.join(backendPublic, 'prod_downlight_1791451418016.png');
    if (fs.existsSync(backendFallback)) {
      res.setHeader('Content-Type', 'image/png');
      return res.sendFile(backendFallback);
    }
    const defaultFallback = path.join(rootPublic, 'prod_downlight_1791451418016.png');
    if (fs.existsSync(defaultFallback)) {
      res.setHeader('Content-Type', 'image/png');
      return res.sendFile(defaultFallback);
    }

    res.status(404).send('Image not found');
  } catch (err) {
    console.error('[Serve Upload Error]:', err);
    res.status(500).send('Error loading image');
  }
});
app.use('/uploads', express.static(uploadsDir));
// 3. Admin Dashboard UI
const adminStaticDir = path.join(__dirname, 'public', 'admin');
app.use('/admin', express.static(adminStaticDir));

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. Token missing.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
};

// Helper: Log Admin Activity
const logActivity = async (adminId, action, details) => {
  try {
    await db.prepare(`
      INSERT INTO activity_logs (admin_id, action, details)
      VALUES (?, ?, ?)
    `).run(adminId || 1, action, details || '');
  } catch (err) {
    console.error('[Activity Log Error]:', err);
  }
};

/* ==========================================================================
   AUTH ROUTES
   ========================================================================== */

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const admin = await db.prepare('SELECT * FROM admins WHERE email = ?').get(email.trim().toLowerCase());

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = bcrypt.compareSync(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await logActivity(admin.id, 'Admin Login', `Admin ${admin.email} logged in successfully.`);

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const admin = await db.prepare('SELECT id, name, email, role, created_at FROM admins WHERE id = ?').get(req.user.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found.' });
    }
    res.json({ success: true, user: admin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   DASHBOARD STATS
   ========================================================================== */

// GET /api/stats
app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    const totalProducts = (await db.prepare('SELECT count(*) AS count FROM products').get()).count;
    const totalCategories = (await db.prepare('SELECT count(*) AS count FROM categories').get()).count;
    const totalBrands = (await db.prepare('SELECT count(*) AS count FROM brands').get()).count;
    const totalOrders = (await db.prepare('SELECT count(*) AS count FROM orders').get()).count;
    const revenueRow = await db.prepare("SELECT sum(total_amount) AS revenue FROM orders WHERE status != 'Cancelled'").get();
    const totalRevenue = revenueRow && revenueRow.revenue ? Number(revenueRow.revenue) : 0.0;
    const unreadInquiries = (await db.prepare("SELECT count(*) AS count FROM inquiries WHERE status = 'Unread'").get()).count;

    // Category distribution (Main categories only)
    const categoryBreakdown = await db.prepare(`
      SELECT c.id, c.name, count(DISTINCT p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON (p.category_id = c.id OR p.subcategory_id IN (SELECT id FROM categories WHERE parent_id = c.id))
      WHERE c.parent_id IS NULL
      GROUP BY c.id
      ORDER BY product_count DESC, c.name ASC
    `).all();

    // Recent orders
    const recentOrders = await db.prepare(`
      SELECT id, order_number, customer_name, customer_email, total_amount, status, created_at
      FROM orders
      ORDER BY id DESC
      LIMIT 5
    `).all();

    const formattedRecentOrders = recentOrders.map(ord => ({
      ...ord,
      total_amount: Number(ord.total_amount || 0)
    }));

    // Low stock products alert
    const lowStock = await db.prepare(`
      SELECT id, name, brand, stock, price
      FROM products
      WHERE stock <= 30
      ORDER BY stock ASC
      LIMIT 5
    `).all();

    const formattedLowStock = lowStock.map(p => ({
      ...p,
      price: Number(p.price || 0),
      stock: Number(p.stock || 0)
    }));

    const formattedCategoryBreakdown = categoryBreakdown.map(c => ({
      ...c,
      product_count: Number(c.product_count || 0)
    }));

    res.json({
      success: true,
      stats: {
        totalProducts: Number(totalProducts),
        totalCategories: Number(totalCategories),
        totalBrands: Number(totalBrands),
        totalOrders: Number(totalOrders),
        totalRevenue: Number(totalRevenue.toFixed(2)),
        unreadInquiries: Number(unreadInquiries),
        categoryBreakdown: formattedCategoryBreakdown,
        recentOrders: formattedRecentOrders,
        lowStock: formattedLowStock
      }
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   PRODUCTS CRUD
   ========================================================================== */

// GET /api/products
app.get('/api/products', async (req, res) => {
  try {
    const { category_id, category, search } = req.query;
    let query = `
      SELECT p.*, 
             c.name AS category_name, c.slug AS category_slug,
             sc.name AS subcategory_name, sc.slug AS subcategory_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN categories sc ON p.subcategory_id = sc.id
      WHERE 1=1
    `;
    const params = [];

    if (category_id) {
      query += ` AND (p.category_id = ? OR p.subcategory_id = ?)`;
      params.push(category_id, category_id);
    }

    if (category) {
      query += ` AND (LOWER(c.slug) = ? OR LOWER(c.name) = ? OR LOWER(sc.slug) = ? OR LOWER(sc.name) = ?)`;
      const catLower = category.toLowerCase().trim();
      params.push(catLower, catLower, catLower, catLower);
    }

    if (search) {
      query += ` AND (p.name LIKE ? OR p.brand LIKE ? OR p.description LIKE ? OR p.model LIKE ? OR p.sku LIKE ? OR c.name LIKE ? OR sc.name LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s, s, s, s);
    }

    query += ` ORDER BY p.id DESC`;

    const products = await db.prepare(query).all(...params);
    
    // Parse images array if present
    const formattedProducts = products.map(p => {
      let imagesArr = [];
      if (p.images) {
        try {
          imagesArr = JSON.parse(p.images);
        } catch (e) {
          imagesArr = [p.images];
        }
      } else if (p.image) {
        imagesArr = [p.image];
      }
      return {
        ...p,
        price: Number(p.price || 0),
        old_price: p.old_price !== null && p.old_price !== undefined ? Number(p.old_price) : null,
        stock: Number(p.stock || 0),
        images: imagesArr
      };
    });

    res.json({ success: true, count: formattedProducts.length, products: formattedProducts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/search
app.get('/api/search', async (req, res) => {
  try {
    const q = (req.query.q || req.query.query || '').trim();
    if (!q) {
      return res.json({ success: true, query: '', products: [], categories: [], brands: [], total: 0 });
    }

    const likeTerm = `%${q}%`;
    const startTerm = `${q}%`;

    // 1. Search Categories (both main and subcategories)
    const matchedCategories = await db.prepare(`
      SELECT c.*, parent.name AS parent_name, parent.slug AS parent_slug
      FROM categories c
      LEFT JOIN categories parent ON c.parent_id = parent.id
      WHERE c.name LIKE ? OR c.slug LIKE ?
      ORDER BY 
        CASE 
          WHEN LOWER(c.name) LIKE ? THEN 1
          WHEN LOWER(c.name) LIKE ? THEN 2
          ELSE 3
        END,
        c.name ASC
      LIMIT 8
    `).all(likeTerm, likeTerm, startTerm.toLowerCase(), likeTerm.toLowerCase());

    // 2. Search Brands
    const matchedBrands = await db.prepare(`
      SELECT *
      FROM brands
      WHERE name LIKE ? OR slug LIKE ?
      ORDER BY 
        CASE 
          WHEN LOWER(name) LIKE ? THEN 1
          WHEN LOWER(name) LIKE ? THEN 2
          ELSE 3
        END,
        name ASC
      LIMIT 8
    `).all(likeTerm, likeTerm, startTerm.toLowerCase(), likeTerm.toLowerCase());

    // 3. Search Products
    const matchedProducts = await db.prepare(`
      SELECT p.*, 
             c.name AS category_name, c.slug AS category_slug,
             sc.name AS subcategory_name, sc.slug AS subcategory_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN categories sc ON p.subcategory_id = sc.id
      WHERE p.name LIKE ? 
         OR p.brand LIKE ? 
         OR p.description LIKE ? 
         OR p.model LIKE ? 
         OR p.sku LIKE ? 
         OR c.name LIKE ? 
         OR sc.name LIKE ?
      ORDER BY 
        CASE 
          WHEN LOWER(p.name) LIKE ? THEN 1
          WHEN LOWER(p.brand) LIKE ? THEN 2
          ELSE 3
        END,
        p.id DESC
      LIMIT 12
    `).all(
      likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm,
      startTerm.toLowerCase(), startTerm.toLowerCase()
    );

    // Format products images
    const formattedProducts = matchedProducts.map(p => {
      let imagesArr = [];
      if (p.images) {
        try {
          imagesArr = JSON.parse(p.images);
        } catch (e) {
          imagesArr = [p.images];
        }
      } else if (p.image) {
        imagesArr = [p.image];
      }
      return {
        ...p,
        price: Number(p.price || 0),
        old_price: p.old_price !== null && p.old_price !== undefined ? Number(p.old_price) : null,
        stock: Number(p.stock || 0),
        images: imagesArr
      };
    });

    res.json({
      success: true,
      query: q,
      products: formattedProducts,
      categories: matchedCategories,
      brands: matchedBrands,
      total: formattedProducts.length + matchedCategories.length + matchedBrands.length
    });
  } catch (err) {
    console.error('[Search API Error]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products
app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    const { 
      name, 
      category_id, 
      subcategory_id, 
      brand, 
      price, 
      old_price, 
      image, 
      images, 
      warranty, 
      wattage, 
      model, 
      description, 
      is_featured, 
      is_bestseller 
    } = req.body;

    if (!name || price === undefined || price === null || !brand) {
      return res.status(400).json({ success: false, message: 'Name, brand, and price are required.' });
    }

    // Determine primary image and images json
    let primaryImage = image || '';
    let imagesJson = '';

    if (Array.isArray(images) && images.length > 0) {
      primaryImage = images[0];
      imagesJson = JSON.stringify(images);
    } else if (typeof images === 'string' && images.trim()) {
      imagesJson = images;
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed) && parsed.length > 0) primaryImage = parsed[0];
      } catch (e) {
        primaryImage = images;
      }
    } else if (image) {
      imagesJson = JSON.stringify([image]);
    }

    if (!primaryImage) {
      primaryImage = '/prod_downlight_1791451418016.png';
      imagesJson = JSON.stringify([primaryImage]);
    }

    let validCatId = null;
    if (category_id) {
      const catCheck = await db.prepare('SELECT id FROM categories WHERE id = ?').get(parseInt(category_id));
      if (catCheck) validCatId = catCheck.id;
    }

    let validSubCatId = null;
    if (subcategory_id) {
      const subCheck = await db.prepare('SELECT id FROM categories WHERE id = ?').get(parseInt(subcategory_id));
      if (subCheck) validSubCatId = subCheck.id;
    }

    const stmt = db.prepare(`
      INSERT INTO products (
        name, category_id, subcategory_id, brand, price, old_price, 
        image, images, warranty, wattage, model, description, stock, 
        is_featured, is_bestseller
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = await stmt.run(
      name.trim(),
      validCatId,
      validSubCatId,
      brand.trim(),
      parseFloat(price),
      old_price ? parseFloat(old_price) : null,
      primaryImage,
      imagesJson,
      warranty ? warranty.trim() : '',
      wattage ? wattage.trim() : '',
      model ? model.trim() : '',
      description ? description.trim() : '',
      50,
      is_featured ? 1 : 0,
      is_bestseller ? 1 : 0
    );

    const productId = Number(result.lastInsertRowid);
    await logActivity(req.user.id, 'Created Product', `Added product: ${name} (ID: ${productId})`);

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      productId
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/products/:id
app.put('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      category_id, 
      subcategory_id, 
      brand, 
      price, 
      old_price, 
      image, 
      images, 
      warranty, 
      wattage, 
      model, 
      description, 
      is_featured, 
      is_bestseller 
    } = req.body;

    const existing = await db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    let primaryImage = image ?? existing.image;
    let imagesJson = existing.images || '';

    if (Array.isArray(images)) {
      if (images.length > 0) primaryImage = images[0];
      imagesJson = JSON.stringify(images);
    } else if (images !== undefined) {
      imagesJson = images;
    }

    let targetCatId = existing.category_id;
    if (category_id !== undefined) {
      if (category_id) {
        const cCheck = await db.prepare('SELECT id FROM categories WHERE id = ?').get(parseInt(category_id));
        targetCatId = cCheck ? cCheck.id : null;
      } else {
        targetCatId = null;
      }
    }

    let targetSubCatId = existing.subcategory_id;
    if (subcategory_id !== undefined) {
      if (subcategory_id) {
        const scCheck = await db.prepare('SELECT id FROM categories WHERE id = ?').get(parseInt(subcategory_id));
        targetSubCatId = scCheck ? scCheck.id : null;
      } else {
        targetSubCatId = null;
      }
    }

    await db.prepare(`
      UPDATE products 
      SET name = ?, category_id = ?, subcategory_id = ?, brand = ?, price = ?, old_price = ?, 
          image = ?, images = ?, warranty = ?, wattage = ?, model = ?, description = ?, 
          is_featured = ?, is_bestseller = ?
      WHERE id = ?
    `).run(
      name ? name.trim() : existing.name,
      targetCatId,
      targetSubCatId,
      brand ? brand.trim() : existing.brand,
      price !== undefined ? parseFloat(price) : existing.price,
      old_price !== undefined ? (old_price ? parseFloat(old_price) : null) : existing.old_price,
      primaryImage,
      imagesJson,
      warranty !== undefined ? warranty.trim() : existing.warranty,
      wattage !== undefined ? wattage.trim() : existing.wattage,
      model !== undefined ? model.trim() : existing.model,
      description !== undefined ? description.trim() : existing.description,
      is_featured !== undefined ? (is_featured ? 1 : 0) : existing.is_featured,
      is_bestseller !== undefined ? (is_bestseller ? 1 : 0) : existing.is_bestseller,
      id
    );

    await logActivity(req.user.id, 'Updated Product', `Updated product ID: ${id} (${name || existing.name})`);

    res.json({ success: true, message: 'Product updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/products/:id
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await db.prepare('SELECT name FROM products WHERE id = ?').get(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    await db.prepare('DELETE FROM products WHERE id = ?').run(id);
    await logActivity(req.user.id, 'Deleted Product', `Deleted product: ${product.name} (ID: ${id})`);

    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   CATEGORIES CRUD (WITH SUBCATEGORIES SUPPORT)
   ========================================================================== */

// GET /api/categories
app.get('/api/categories', async (req, res) => {
  try {
    const rawCategories = await db.prepare(`
      SELECT c.*, count(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.id ASC
    `).all();

    const mainCategories = rawCategories.filter(c => !c.parent_id);
    const subCategories = rawCategories.filter(c => c.parent_id);

    const categories = mainCategories.map(main => {
      const subs = subCategories.filter(s => s.parent_id === main.id);
      return {
        ...main,
        subcategories: subs,
        total_products: (main.product_count || 0) + subs.reduce((sum, s) => sum + (s.product_count || 0), 0)
      };
    });

    res.json({
      success: true,
      categories,
      flatCategories: rawCategories
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/categories
app.post('/api/categories', authenticateToken, async (req, res) => {
  try {
    const { name, slug, icon, description, parent_id, subcategories } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ success: false, message: 'Category name and slug are required.' });
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/\s+/g, '-');
    const existingSlug = await db.prepare('SELECT id FROM categories WHERE slug = ?').get(cleanSlug);
    if (existingSlug) {
      return res.status(400).json({ success: false, message: `Category with slug '${cleanSlug}' already exists.` });
    }

    const result = await db.prepare(`
      INSERT INTO categories (name, slug, icon, description, parent_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(name.trim(), cleanSlug, icon || 'Box', description || '', parent_id ? parseInt(parent_id) : null);

    const categoryId = Number(result.lastInsertRowid);

    // If subcategories were passed, insert them under this parent
    if (Array.isArray(subcategories) && subcategories.length > 0) {
      const insertSub = db.prepare(`
        INSERT INTO categories (name, slug, icon, description, parent_id)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const sub of subcategories) {
        const subName = (typeof sub === 'string' ? sub : (sub.name || '')).trim();
        if (!subName) continue;
        let subSlug = (typeof sub === 'object' && sub.slug)
          ? sub.slug.toLowerCase().trim().replace(/\s+/g, '-')
          : subName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (!subSlug) subSlug = `${cleanSlug}-sub-${Date.now()}`;

        let finalSubSlug = subSlug;
        let counter = 1;
        while (await db.prepare('SELECT id FROM categories WHERE slug = ?').get(finalSubSlug)) {
          finalSubSlug = `${subSlug}-${counter++}`;
        }

        await insertSub.run(subName, finalSubSlug, 'Layers', typeof sub === 'object' ? (sub.description || '') : '', categoryId);
      }
    }

    await logActivity(req.user.id, 'Created Category', `Created category: ${name} (ID: ${categoryId})`);
    res.status(201).json({ success: true, message: 'Category created successfully.', categoryId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/categories/:id
app.put('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, icon, description, parent_id, subcategories } = req.body;

    const existing = await db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const newName = name ? name.trim() : existing.name;
    const cleanSlug = slug ? slug.toLowerCase().trim().replace(/\s+/g, '-') : existing.slug;

    if (cleanSlug !== existing.slug) {
      const checkSlug = await db.prepare('SELECT id FROM categories WHERE slug = ? AND id != ?').get(cleanSlug, id);
      if (checkSlug) {
        return res.status(400).json({ success: false, message: `Slug '${cleanSlug}' is already taken.` });
      }
    }

    await db.prepare(`
      UPDATE categories
      SET name = ?, slug = ?, icon = ?, description = ?, parent_id = ?
      WHERE id = ?
    `).run(
      newName,
      cleanSlug,
      icon || existing.icon || 'Box',
      description !== undefined ? description : existing.description,
      parent_id !== undefined ? (parent_id ? parseInt(parent_id) : null) : existing.parent_id,
      id
    );

    // Sync subcategories if provided for a main category
    if (Array.isArray(subcategories)) {
      const currentSubs = await db.prepare('SELECT * FROM categories WHERE parent_id = ?').all(id);
      const incomingIds = subcategories.filter(s => s.id).map(s => parseInt(s.id));

      // 1. Delete removed subcategories
      for (const curSub of currentSubs) {
        if (!incomingIds.includes(curSub.id)) {
          await db.prepare('DELETE FROM categories WHERE id = ?').run(curSub.id);
        }
      }

      // 2. Update or insert subcategories
      for (const sub of subcategories) {
        const subName = (sub.name || '').trim();
        if (!subName) continue;
        let subSlug = sub.slug
          ? sub.slug.toLowerCase().trim().replace(/\s+/g, '-')
          : subName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        if (sub.id) {
          let checkSlug = await db.prepare('SELECT id FROM categories WHERE slug = ? AND id != ?').get(subSlug, sub.id);
          if (checkSlug) subSlug = `${subSlug}-${sub.id}`;
          await db.prepare(`
            UPDATE categories
            SET name = ?, slug = ?, description = ?
            WHERE id = ? AND parent_id = ?
          `).run(subName, subSlug, sub.description || '', sub.id, id);
        } else {
          let finalSubSlug = subSlug;
          let counter = 1;
          while (await db.prepare('SELECT id FROM categories WHERE slug = ?').get(finalSubSlug)) {
            finalSubSlug = `${subSlug}-${counter++}`;
          }
          await db.prepare(`
            INSERT INTO categories (name, slug, icon, description, parent_id)
            VALUES (?, ?, ?, ?, ?)
          `).run(subName, finalSubSlug, 'Layers', sub.description || '', id);
        }
      }
    }

    await logActivity(req.user.id, 'Updated Category', `Updated category: ${newName} (ID: ${id})`);
    res.json({ success: true, message: 'Category updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/categories/:id
app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const cat = await db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!cat) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    // Delete subcategories if this is a parent category
    await db.prepare('DELETE FROM categories WHERE parent_id = ?').run(id);

    // Delete the category itself
    await db.prepare('DELETE FROM categories WHERE id = ?').run(id);

    await logActivity(req.user.id, 'Deleted Category', `Deleted category: ${cat.name} (ID: ${id})`);
    res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   BRANDS MANAGEMENT
   ========================================================================== */

// GET /api/brands
app.get('/api/brands', async (req, res) => {
  try {
    const brands = await db.prepare(`
      SELECT b.*, count(p.id) as product_count
      FROM brands b
      LEFT JOIN products p ON LOWER(p.brand) = LOWER(b.name)
      GROUP BY b.id
      ORDER BY b.is_featured DESC, b.name ASC
    `).all();

    res.json({
      success: true,
      brands
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/brands
app.post('/api/brands', authenticateToken, async (req, res) => {
  try {
    const { name, slug, image, website, description, is_featured } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Brand name is required.' });
    }

    const cleanName = name.trim();
    let cleanSlug = (slug || cleanName)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!cleanSlug) cleanSlug = `brand-${Date.now()}`;

    const existing = await db.prepare('SELECT id FROM brands WHERE LOWER(name) = ? OR slug = ?').get(cleanName.toLowerCase(), cleanSlug);
    if (existing) {
      return res.status(400).json({ success: false, message: `Brand with name '${cleanName}' or slug '${cleanSlug}' already exists.` });
    }

    const result = await db.prepare(`
      INSERT INTO brands (name, slug, image, website, description, is_featured)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      cleanName,
      cleanSlug,
      image || '',
      website || '',
      description || '',
      is_featured ? 1 : 0
    );

    const brandId = Number(result.lastInsertRowid);
    await logActivity(req.user.id, 'Created Brand', `Created brand: ${cleanName} (ID: ${brandId})`);

    res.status(201).json({
      success: true,
      message: 'Brand created successfully.',
      brandId
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/brands/:id
app.put('/api/brands/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, image, website, description, is_featured } = req.body;

    const existing = await db.prepare('SELECT * FROM brands WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Brand not found.' });
    }

    const cleanName = name ? name.trim() : existing.name;
    const cleanSlug = slug
      ? slug.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9\-]+/g, '')
      : existing.slug;

    // Check duplicate name or slug on other brands
    const duplicate = await db.prepare('SELECT id FROM brands WHERE (LOWER(name) = ? OR slug = ?) AND id != ?').get(cleanName.toLowerCase(), cleanSlug, id);
    if (duplicate) {
      return res.status(400).json({ success: false, message: `Another brand with name '${cleanName}' or slug '${cleanSlug}' already exists.` });
    }

    await db.prepare(`
      UPDATE brands
      SET name = ?, slug = ?, image = ?, website = ?, description = ?, is_featured = ?
      WHERE id = ?
    `).run(
      cleanName,
      cleanSlug,
      image !== undefined ? image : existing.image,
      website !== undefined ? website : existing.website,
      description !== undefined ? description : existing.description,
      is_featured !== undefined ? (is_featured ? 1 : 0) : existing.is_featured,
      id
    );

    await logActivity(req.user.id, 'Updated Brand', `Updated brand: ${cleanName} (ID: ${id})`);

    res.json({
      success: true,
      message: 'Brand updated successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/brands/:id
app.delete('/api/brands/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await db.prepare('SELECT * FROM brands WHERE id = ?').get(id);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found.' });
    }

    await db.prepare('DELETE FROM brands WHERE id = ?').run(id);

    await logActivity(req.user.id, 'Deleted Brand', `Deleted brand: ${brand.name} (ID: ${id})`);

    res.json({
      success: true,
      message: 'Brand deleted successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   ORDERS MANAGEMENT
   ========================================================================== */

// POST /api/orders (Public endpoint for placing orders via WhatsApp / Web store)
app.post('/api/orders', async (req, res) => {
  try {
    const {
      order_number,
      customer_name,
      customer_email,
      customer_phone,
      delivery_location,
      notes,
      total_amount,
      items,
      status = 'Pending',
      order_source = 'WhatsApp'
    } = req.body;

    const cleanName = (customer_name && customer_name.trim()) ? customer_name.trim() : 'Customer';
    const cleanPhone = (customer_phone && customer_phone.trim()) ? customer_phone.trim() : '';
    const cleanEmail = (customer_email && customer_email.trim())
      ? customer_email.trim()
      : (cleanPhone ? `${cleanPhone.replace(/[^0-9]/g, '')}@whatsapp.customer` : 'whatsapp-order@superlight.ae');
    const cleanLocation = (delivery_location && delivery_location.trim()) ? delivery_location.trim() : '';
    const cleanNotes = (notes && notes.trim()) ? notes.trim() : '';
    const numTotal = typeof total_amount === 'number'
      ? total_amount
      : parseFloat(String(total_amount).replace(/[^0-9.]/g, '')) || 0.0;

    // Generate unique order number if not supplied
    let finalOrderNumber = (order_number && order_number.trim())
      ? order_number.trim()
      : `SL-${Math.floor(100000 + Math.random() * 900000)}`;

    let checkExisting = await db.prepare('SELECT id FROM orders WHERE order_number = ?').get(finalOrderNumber);
    let counter = 1;
    while (checkExisting) {
      finalOrderNumber = `SL-${Math.floor(100000 + Math.random() * 900000)}-${counter++}`;
      checkExisting = await db.prepare('SELECT id FROM orders WHERE order_number = ?').get(finalOrderNumber);
    }

    const itemsArray = Array.isArray(items) ? items : [];
    const itemsJson = JSON.stringify(itemsArray);

    const result = await db.prepare(`
      INSERT INTO orders (
        order_number, customer_name, customer_email, customer_phone,
        total_amount, status, items_json, delivery_location, notes, order_source
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      finalOrderNumber,
      cleanName,
      cleanEmail,
      cleanPhone,
      numTotal,
      status,
      itemsJson,
      cleanLocation,
      cleanNotes,
      order_source
    );

    const orderId = Number(result.lastInsertRowid);

    try {
      await db.prepare(`
        INSERT INTO activity_logs (admin_id, action, details)
        VALUES (NULL, 'New Order Placed', ?)
      `).run(`Order #${finalOrderNumber} placed by ${cleanName} via ${order_source} (AED ${numTotal.toFixed(2)})`);
    } catch (_) {}

    const savedOrder = {
      id: orderId,
      order_number: finalOrderNumber,
      customer_name: cleanName,
      customer_email: cleanEmail,
      customer_phone: cleanPhone,
      delivery_location: cleanLocation,
      notes: cleanNotes,
      total_amount: numTotal,
      status,
      items: itemsArray,
      order_source,
      created_at: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'Order created successfully.',
      order: savedOrder
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/orders/lookup (Public endpoint for user to query and sync their orders)
app.post('/api/orders/lookup', async (req, res) => {
  try {
    const { order_numbers, phone } = req.body;
    let orders = [];

    if (Array.isArray(order_numbers) && order_numbers.length > 0) {
      const placeholders = order_numbers.map(() => '?').join(',');
      orders = await db.prepare(`SELECT * FROM orders WHERE order_number IN (${placeholders}) ORDER BY id DESC`).all(...order_numbers);
    } else if (phone && phone.trim()) {
      const cleanPhone = phone.trim();
      orders = await db.prepare(`SELECT * FROM orders WHERE customer_phone LIKE ? ORDER BY id DESC`).all(`%${cleanPhone}%`);
    }

    const formatted = orders.map(o => ({
      ...o,
      total_amount: Number(o.total_amount || 0),
      items: o.items_json ? JSON.parse(o.items_json) : []
    }));

    res.json({ success: true, count: formatted.length, orders: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await db.prepare('SELECT * FROM orders ORDER BY id DESC').all();
    const formattedOrders = orders.map(ord => ({
      ...ord,
      total_amount: Number(ord.total_amount || 0),
      items: ord.items_json ? JSON.parse(ord.items_json) : []
    }));
    res.json({ success: true, count: formattedOrders.length, orders: formattedOrders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/orders/:id/status
app.put('/api/orders/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Processing', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status.' });
    }

    await db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
    await logActivity(req.user.id, 'Updated Order Status', `Order ID ${id} marked as ${status}`);

    res.json({ success: true, message: `Order status updated to ${status}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   INQUIRIES / CONTACT MESSAGES
   ========================================================================== */

// POST /api/inquiries (Public endpoint for Send Us a Message contact form)
app.post('/api/inquiries', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Your name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Your email address is required.' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Your message content is required.' });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone ? phone.trim() : null;
    const cleanSubject = subject && subject.trim() ? subject.trim() : 'General Inquiry';
    const cleanMessage = message.trim();

    const result = await db.prepare(`
      INSERT INTO inquiries (name, email, phone, subject, message, status)
      VALUES (?, ?, ?, ?, ?, 'Unread')
    `).run(cleanName, cleanEmail, cleanPhone, cleanSubject, cleanMessage);

    const insertedId = Number(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Thank you for contacting Superlight! Your message has been sent successfully.',
      inquiryId: insertedId
    });
  } catch (err) {
    console.error('Error submitting inquiry:', err);
    res.status(500).json({ success: false, message: 'Failed to send message. Please try again later.' });
  }
});

// GET /api/inquiries
app.get('/api/inquiries', authenticateToken, async (req, res) => {
  try {
    const inquiries = await db.prepare('SELECT * FROM inquiries ORDER BY id DESC').all();
    res.json({ success: true, count: inquiries.length, inquiries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/inquiries/:id/status
app.put('/api/inquiries/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run(status, id);
    res.json({ success: true, message: 'Inquiry status updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/inquiries/:id
app.delete('/api/inquiries/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.prepare('DELETE FROM inquiries WHERE id = ?').run(id);
    res.json({ success: true, message: 'Inquiry deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   ACTIVITY LOGS & SQL CONSOLE
   ========================================================================== */

// GET /api/logs
app.get('/api/logs', authenticateToken, async (req, res) => {
  try {
    const logs = await db.prepare(`
      SELECT l.*, a.name as admin_name, a.email as admin_email
      FROM activity_logs l
      LEFT JOIN admins a ON l.admin_id = a.id
      ORDER BY l.id DESC
      LIMIT 50
    `).all();
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/database/tables
app.get('/api/database/tables', authenticateToken, async (req, res) => {
  try {
    const tableData = {};
    if (db.isMySQL) {
      const [rows] = await db.pool.query('SHOW TABLES');
      const tableNames = rows.map(r => Object.values(r)[0]);
      for (const t of tableNames) {
        const [cRows] = await db.pool.query(`SELECT count(*) as count FROM \`${t}\``);
        const [cols] = await db.pool.query(`SHOW COLUMNS FROM \`${t}\``);
        const formattedCols = cols.map(c => ({
          name: c.Field,
          type: c.Type,
          notnull: c.Null === 'NO' ? 1 : 0,
          dflt_value: c.Default,
          pk: c.Key === 'PRI' ? 1 : 0
        }));
        tableData[t] = { count: Number(cRows[0].count), columns: formattedCols };
      }
    } else {
      const tables = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
      for (const t of tables) {
        const count = (await db.prepare(`SELECT count(*) as count FROM "${t.name}"`).get()).count;
        const columns = await db.prepare(`PRAGMA table_info("${t.name}")`).all();
        tableData[t.name] = { count: Number(count), columns };
      }
    }
    res.json({ success: true, tables: tableData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/database/query (Read-only SQL Query runner for Admin SQL Console)
app.post('/api/database/query', authenticateToken, async (req, res) => {
  try {
    const { sql } = req.body;
    if (!sql || !sql.trim().toUpperCase().startsWith('SELECT')) {
      return res.status(400).json({ success: false, message: 'Only SELECT SQL queries are allowed in the console.' });
    }

    const rows = await db.prepare(sql).all();
    res.json({ success: true, count: rows.length, rows });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/upload
app.post('/api/upload', authenticateToken, upload.any(), async (req, res) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No file provided.' });
    }

    const urls = [];
    for (const f of files) {
      urls.push(`/uploads/${f.filename}`);
      try {
        const fileBuffer = fs.readFileSync(f.path);
        await db.prepare(`
          INSERT INTO uploaded_files (filename, mime_type, file_data, size)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE file_data = VALUES(file_data), size = VALUES(size)
        `).run(f.filename, f.mimetype || 'image/png', fileBuffer, f.size);
      } catch (dbErr) {
        console.error(`[Upload DB Persistence Error for ${f.filename}]:`, dbErr.message);
      }
    }

    res.json({ 
      success: true, 
      imageUrl: urls[0],
      url: urls[0],
      urls
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Root route redirects to admin dashboard
app.get('/', (req, res) => {
  res.redirect('/admin');
});

// Catch-all for Admin SPA
app.get('/admin', (req, res) => {
  res.sendFile(path.join(adminStaticDir, 'index.html'));
});

app.get(/^\/admin(\/.*)?$/, (req, res) => {
  res.sendFile(path.join(adminStaticDir, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`==================================================================`);
  console.log(`🚀 Superlight Admin Backend & SQL Database Server running!`);
  console.log(`📍 Admin Dashboard URL: http://localhost:${PORT}/admin`);
  console.log(`📍 API Base URL:       http://localhost:${PORT}/api`);
  console.log(`👤 Default Admin User: admin@superlight.ae`);
  console.log(`🔑 Default Admin Pass: Admin@123`);
  console.log(`==================================================================`);
});
