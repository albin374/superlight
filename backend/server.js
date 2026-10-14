import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import db, { initDatabase } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'superlight_ultra_secure_jwt_secret_key_2026';
const PORT = process.env.PORT || 5000;

const app = express();

// Initialize SQL database and tables
initDatabase();

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
// 1. Root public folder (for existing product images if deployed together)
const rootPublic = path.join(__dirname, '..', 'public');
if (fs.existsSync(rootPublic)) {
  app.use(express.static(rootPublic));
}
// 2. Uploaded images
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
const logActivity = (adminId, action, details) => {
  try {
    db.prepare(`
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
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email.trim().toLowerCase());

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

    logActivity(admin.id, 'Admin Login', `Admin ${admin.email} logged in successfully.`);

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
app.get('/api/auth/me', authenticateToken, (req, res) => {
  try {
    const admin = db.prepare('SELECT id, name, email, role, created_at FROM admins WHERE id = ?').get(req.user.id);
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
app.get('/api/stats', authenticateToken, (req, res) => {
  try {
    const totalProducts = db.prepare('SELECT count(*) AS count FROM products').get().count;
    const totalCategories = db.prepare('SELECT count(*) AS count FROM categories').get().count;
    const totalBrands = db.prepare('SELECT count(*) AS count FROM brands').get().count;
    const totalOrders = db.prepare('SELECT count(*) AS count FROM orders').get().count;
    const revenueRow = db.prepare("SELECT sum(total_amount) AS revenue FROM orders WHERE status != 'Cancelled'").get();
    const totalRevenue = revenueRow.revenue || 0.0;
    const unreadInquiries = db.prepare("SELECT count(*) AS count FROM inquiries WHERE status = 'Unread'").get().count;

    // Category distribution (Main categories only)
    const categoryBreakdown = db.prepare(`
      SELECT c.id, c.name, count(DISTINCT p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON (p.category_id = c.id OR p.subcategory_id IN (SELECT id FROM categories WHERE parent_id = c.id))
      WHERE c.parent_id IS NULL
      GROUP BY c.id
      ORDER BY product_count DESC, c.name ASC
    `).all();

    // Recent orders
    const recentOrders = db.prepare(`
      SELECT id, order_number, customer_name, customer_email, total_amount, status, created_at
      FROM orders
      ORDER BY id DESC
      LIMIT 5
    `).all();

    // Low stock products alert
    const lowStock = db.prepare(`
      SELECT id, name, brand, stock, price
      FROM products
      WHERE stock <= 30
      ORDER BY stock ASC
      LIMIT 5
    `).all();

    res.json({
      success: true,
      stats: {
        totalProducts,
        totalCategories,
        totalBrands,
        totalOrders,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        unreadInquiries,
        categoryBreakdown,
        recentOrders,
        lowStock
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
app.get('/api/products', (req, res) => {
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
      query += ` AND (p.name LIKE ? OR p.brand LIKE ? OR p.description LIKE ? OR p.model LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY p.id DESC`;

    const products = db.prepare(query).all(...params);
    
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
        images: imagesArr
      };
    });

    res.json({ success: true, count: formattedProducts.length, products: formattedProducts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products
app.post('/api/products', authenticateToken, (req, res) => {
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

    const stmt = db.prepare(`
      INSERT INTO products (
        name, category_id, subcategory_id, brand, price, old_price, 
        image, images, warranty, wattage, model, description, stock, 
        is_featured, is_bestseller
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name.trim(),
      category_id ? parseInt(category_id) : null,
      subcategory_id ? parseInt(subcategory_id) : null,
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
    logActivity(req.user.id, 'Created Product', `Added product: ${name} (ID: ${productId})`);

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
app.put('/api/products/:id', authenticateToken, (req, res) => {
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

    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
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

    db.prepare(`
      UPDATE products 
      SET name = ?, category_id = ?, subcategory_id = ?, brand = ?, price = ?, old_price = ?, 
          image = ?, images = ?, warranty = ?, wattage = ?, model = ?, description = ?, 
          is_featured = ?, is_bestseller = ?
      WHERE id = ?
    `).run(
      name ? name.trim() : existing.name,
      category_id !== undefined ? (category_id ? parseInt(category_id) : null) : existing.category_id,
      subcategory_id !== undefined ? (subcategory_id ? parseInt(subcategory_id) : null) : existing.subcategory_id,
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

    logActivity(req.user.id, 'Updated Product', `Updated product ID: ${id} (${name || existing.name})`);

    res.json({ success: true, message: 'Product updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/products/:id
app.delete('/api/products/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const product = db.prepare('SELECT name FROM products WHERE id = ?').get(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    logActivity(req.user.id, 'Deleted Product', `Deleted product: ${product.name} (ID: ${id})`);

    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   CATEGORIES CRUD (WITH SUBCATEGORIES SUPPORT)
   ========================================================================== */

// GET /api/categories
app.get('/api/categories', (req, res) => {
  try {
    const rawCategories = db.prepare(`
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
app.post('/api/categories', authenticateToken, (req, res) => {
  try {
    const { name, slug, icon, description, parent_id, subcategories } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ success: false, message: 'Category name and slug are required.' });
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/\s+/g, '-');
    const existingSlug = db.prepare('SELECT id FROM categories WHERE slug = ?').get(cleanSlug);
    if (existingSlug) {
      return res.status(400).json({ success: false, message: `Category with slug '${cleanSlug}' already exists.` });
    }

    const result = db.prepare(`
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
        while (db.prepare('SELECT id FROM categories WHERE slug = ?').get(finalSubSlug)) {
          finalSubSlug = `${subSlug}-${counter++}`;
        }

        insertSub.run(subName, finalSubSlug, 'Layers', typeof sub === 'object' ? (sub.description || '') : '', categoryId);
      }
    }

    logActivity(req.user.id, 'Created Category', `Created category: ${name} (ID: ${categoryId})`);
    res.status(201).json({ success: true, message: 'Category created successfully.', categoryId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/categories/:id
app.put('/api/categories/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, icon, description, parent_id, subcategories } = req.body;

    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const newName = name ? name.trim() : existing.name;
    const cleanSlug = slug ? slug.toLowerCase().trim().replace(/\s+/g, '-') : existing.slug;

    if (cleanSlug !== existing.slug) {
      const checkSlug = db.prepare('SELECT id FROM categories WHERE slug = ? AND id != ?').get(cleanSlug, id);
      if (checkSlug) {
        return res.status(400).json({ success: false, message: `Slug '${cleanSlug}' is already taken.` });
      }
    }

    db.prepare(`
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
      const currentSubs = db.prepare('SELECT * FROM categories WHERE parent_id = ?').all(id);
      const incomingIds = subcategories.filter(s => s.id).map(s => parseInt(s.id));

      // 1. Delete removed subcategories
      for (const curSub of currentSubs) {
        if (!incomingIds.includes(curSub.id)) {
          db.prepare('DELETE FROM categories WHERE id = ?').run(curSub.id);
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
          let checkSlug = db.prepare('SELECT id FROM categories WHERE slug = ? AND id != ?').get(subSlug, sub.id);
          if (checkSlug) subSlug = `${subSlug}-${sub.id}`;
          db.prepare(`
            UPDATE categories
            SET name = ?, slug = ?, description = ?
            WHERE id = ? AND parent_id = ?
          `).run(subName, subSlug, sub.description || '', sub.id, id);
        } else {
          let finalSubSlug = subSlug;
          let counter = 1;
          while (db.prepare('SELECT id FROM categories WHERE slug = ?').get(finalSubSlug)) {
            finalSubSlug = `${subSlug}-${counter++}`;
          }
          db.prepare(`
            INSERT INTO categories (name, slug, icon, description, parent_id)
            VALUES (?, ?, ?, ?, ?)
          `).run(subName, finalSubSlug, 'Layers', sub.description || '', id);
        }
      }
    }

    logActivity(req.user.id, 'Updated Category', `Updated category: ${newName} (ID: ${id})`);
    res.json({ success: true, message: 'Category updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/categories/:id
app.delete('/api/categories/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!cat) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    // Delete subcategories if this is a parent category
    db.prepare('DELETE FROM categories WHERE parent_id = ?').run(id);

    // Delete the category itself
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);

    logActivity(req.user.id, 'Deleted Category', `Deleted category: ${cat.name} (ID: ${id})`);
    res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   BRANDS MANAGEMENT
   ========================================================================== */

// GET /api/brands
app.get('/api/brands', (req, res) => {
  try {
    const brands = db.prepare(`
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
app.post('/api/brands', authenticateToken, (req, res) => {
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

    const existing = db.prepare('SELECT id FROM brands WHERE LOWER(name) = ? OR slug = ?').get(cleanName.toLowerCase(), cleanSlug);
    if (existing) {
      return res.status(400).json({ success: false, message: `Brand with name '${cleanName}' or slug '${cleanSlug}' already exists.` });
    }

    const result = db.prepare(`
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
    logActivity(req.user.id, 'Created Brand', `Created brand: ${cleanName} (ID: ${brandId})`);

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
app.put('/api/brands/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, image, website, description, is_featured } = req.body;

    const existing = db.prepare('SELECT * FROM brands WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Brand not found.' });
    }

    const cleanName = name ? name.trim() : existing.name;
    const cleanSlug = slug
      ? slug.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9\-]+/g, '')
      : existing.slug;

    // Check duplicate name or slug on other brands
    const duplicate = db.prepare('SELECT id FROM brands WHERE (LOWER(name) = ? OR slug = ?) AND id != ?').get(cleanName.toLowerCase(), cleanSlug, id);
    if (duplicate) {
      return res.status(400).json({ success: false, message: `Another brand with name '${cleanName}' or slug '${cleanSlug}' already exists.` });
    }

    db.prepare(`
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

    logActivity(req.user.id, 'Updated Brand', `Updated brand: ${cleanName} (ID: ${id})`);

    res.json({
      success: true,
      message: 'Brand updated successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/brands/:id
app.delete('/api/brands/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const brand = db.prepare('SELECT * FROM brands WHERE id = ?').get(id);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found.' });
    }

    db.prepare('DELETE FROM brands WHERE id = ?').run(id);

    logActivity(req.user.id, 'Deleted Brand', `Deleted brand: ${brand.name} (ID: ${id})`);

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
app.post('/api/orders', (req, res) => {
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

    let checkExisting = db.prepare('SELECT id FROM orders WHERE order_number = ?').get(finalOrderNumber);
    let counter = 1;
    while (checkExisting) {
      finalOrderNumber = `SL-${Math.floor(100000 + Math.random() * 900000)}-${counter++}`;
      checkExisting = db.prepare('SELECT id FROM orders WHERE order_number = ?').get(finalOrderNumber);
    }

    const itemsArray = Array.isArray(items) ? items : [];
    const itemsJson = JSON.stringify(itemsArray);

    const result = db.prepare(`
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
      db.prepare(`
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
app.post('/api/orders/lookup', (req, res) => {
  try {
    const { order_numbers, phone } = req.body;
    let orders = [];

    if (Array.isArray(order_numbers) && order_numbers.length > 0) {
      const placeholders = order_numbers.map(() => '?').join(',');
      orders = db.prepare(`SELECT * FROM orders WHERE order_number IN (${placeholders}) ORDER BY id DESC`).all(...order_numbers);
    } else if (phone && phone.trim()) {
      const cleanPhone = phone.trim();
      orders = db.prepare(`SELECT * FROM orders WHERE customer_phone LIKE ? ORDER BY id DESC`).all(`%${cleanPhone}%`);
    }

    const formatted = orders.map(o => ({
      ...o,
      items: o.items_json ? JSON.parse(o.items_json) : []
    }));

    res.json({ success: true, count: formatted.length, orders: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders
app.get('/api/orders', authenticateToken, (req, res) => {
  try {
    const orders = db.prepare('SELECT * FROM orders ORDER BY id DESC').all();
    const formattedOrders = orders.map(ord => ({
      ...ord,
      items: ord.items_json ? JSON.parse(ord.items_json) : []
    }));
    res.json({ success: true, count: formattedOrders.length, orders: formattedOrders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/orders/:id/status
app.put('/api/orders/:id/status', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Processing', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status.' });
    }

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
    logActivity(req.user.id, 'Updated Order Status', `Order ID ${id} marked as ${status}`);

    res.json({ success: true, message: `Order status updated to ${status}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   INQUIRIES / CONTACT MESSAGES
   ========================================================================== */

// POST /api/inquiries (Public endpoint for Send Us a Message contact form)
app.post('/api/inquiries', (req, res) => {
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

    const result = db.prepare(`
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
app.get('/api/inquiries', authenticateToken, (req, res) => {
  try {
    const inquiries = db.prepare('SELECT * FROM inquiries ORDER BY id DESC').all();
    res.json({ success: true, count: inquiries.length, inquiries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/inquiries/:id/status
app.put('/api/inquiries/:id/status', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run(status, id);
    res.json({ success: true, message: 'Inquiry status updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/inquiries/:id
app.delete('/api/inquiries/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM inquiries WHERE id = ?').run(id);
    res.json({ success: true, message: 'Inquiry deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   ACTIVITY LOGS & SQL CONSOLE
   ========================================================================== */

// GET /api/logs
app.get('/api/logs', authenticateToken, (req, res) => {
  try {
    const logs = db.prepare(`
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
app.get('/api/database/tables', authenticateToken, (req, res) => {
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    const tableData = {};
    for (const t of tables) {
      const count = db.prepare(`SELECT count(*) as count FROM ${t.name}`).get().count;
      const columns = db.prepare(`PRAGMA table_info(${t.name})`).all();
      tableData[t.name] = { count, columns };
    }
    res.json({ success: true, tables: tableData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/database/query (Read-only SQL Query runner for Admin SQL Console)
app.post('/api/database/query', authenticateToken, (req, res) => {
  try {
    const { sql } = req.body;
    if (!sql || !sql.trim().toUpperCase().startsWith('SELECT')) {
      return res.status(400).json({ success: false, message: 'Only SELECT SQL queries are allowed in the console.' });
    }

    const rows = db.prepare(sql).all();
    res.json({ success: true, count: rows.length, rows });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/upload
app.post('/api/upload', authenticateToken, upload.any(), (req, res) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No file provided.' });
    }
    const urls = files.map(f => `/uploads/${f.filename}`);
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
