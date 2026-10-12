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
// 1. Root public folder (for existing product images)
app.use(express.static(path.join(__dirname, '..', 'public')));
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
    const totalOrders = db.prepare('SELECT count(*) AS count FROM orders').get().count;
    const revenueRow = db.prepare("SELECT sum(total_amount) AS revenue FROM orders WHERE status != 'Cancelled'").get();
    const totalRevenue = revenueRow.revenue || 0.0;
    const unreadInquiries = db.prepare("SELECT count(*) AS count FROM inquiries WHERE status = 'Unread'").get().count;

    // Category distribution
    const categoryBreakdown = db.prepare(`
      SELECT c.name, count(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY product_count DESC
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
    const { category_id, search } = req.query;
    let query = `
      SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (category_id) {
      query += ` AND p.category_id = ?`;
      params.push(category_id);
    }

    if (search) {
      query += ` AND (p.name LIKE ? OR p.brand LIKE ? OR p.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY p.id DESC`;

    const products = db.prepare(query).all(...params);
    res.json({ success: true, count: products.length, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products
app.post('/api/products', authenticateToken, (req, res) => {
  try {
    const { name, category_id, brand, price, old_price, image, description, stock, is_featured } = req.body;

    if (!name || !price || !brand) {
      return res.status(400).json({ success: false, message: 'Name, brand, and price are required.' });
    }

    const stmt = db.prepare(`
      INSERT INTO products (name, category_id, brand, price, old_price, image, description, stock, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name,
      category_id || null,
      brand,
      parseFloat(price),
      old_price ? parseFloat(old_price) : null,
      image || '/prod_downlight_1791451418016.png',
      description || '',
      stock ? parseInt(stock) : 50,
      is_featured ? 1 : 0
    );

    logActivity(req.user.id, 'Created Product', `Added product: ${name} (ID: ${result.lastInsertRowid})`);

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      productId: result.lastInsertRowid
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/products/:id
app.put('/api/products/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { name, category_id, brand, price, old_price, image, description, stock, is_featured } = req.body;

    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    db.prepare(`
      UPDATE products 
      SET name = ?, category_id = ?, brand = ?, price = ?, old_price = ?, image = ?, description = ?, stock = ?, is_featured = ?
      WHERE id = ?
    `).run(
      name ?? existing.name,
      category_id ?? existing.category_id,
      brand ?? existing.brand,
      price ? parseFloat(price) : existing.price,
      old_price !== undefined ? (old_price ? parseFloat(old_price) : null) : existing.old_price,
      image ?? existing.image,
      description ?? existing.description,
      stock !== undefined ? parseInt(stock) : existing.stock,
      is_featured !== undefined ? (is_featured ? 1 : 0) : existing.is_featured,
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
   CATEGORIES CRUD
   ========================================================================== */

// GET /api/categories
app.get('/api/categories', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT c.*, count(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all();
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/categories
app.post('/api/categories', authenticateToken, (req, res) => {
  try {
    const { name, slug, icon, description } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ success: false, message: 'Category name and slug are required.' });
    }

    const result = db.prepare(`
      INSERT INTO categories (name, slug, icon, description)
      VALUES (?, ?, ?, ?)
    `).run(name, slug.toLowerCase().trim().replace(/\s+/g, '-'), icon || 'Box', description || '');

    logActivity(req.user.id, 'Created Category', `Created category: ${name}`);

    res.status(201).json({ success: true, message: 'Category created.', categoryId: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/categories/:id
app.delete('/api/categories/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    logActivity(req.user.id, 'Deleted Category', `Deleted category ID: ${id}`);
    res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   ORDERS MANAGEMENT
   ========================================================================== */

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
app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided.' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, imageUrl });
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
