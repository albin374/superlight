import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import db, { initDatabase } from './database.js';
import { isCloudinaryConfigured, getCloudinaryStatus, uploadToCloudinary } from './cloudinary.js';
import { runCloudinaryMigration } from './migrate-to-cloudinary.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'superlight_ultra_secure_jwt_secret_key_2026';
const PORT = process.env.PORT || 5000;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '993906976196-kt13920p8sb9adfdlpnglokg18is08of.apps.googleusercontent.com';
const googleOAuthClient = new OAuth2Client(GOOGLE_CLIENT_ID);

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

// Helper: Ensure an image URL or local path is uploaded to Cloudinary if Cloudinary is active
const ensureCloudinaryUrl = async (imgRef, folder = 'superlight/products') => {
  if (!imgRef || typeof imgRef !== 'string') return imgRef;
  if (imgRef.startsWith('http://') || imgRef.startsWith('https://')) return imgRef;
  if (!isCloudinaryConfigured()) return imgRef;

  try {
    const filename = path.basename(imgRef);
    let sourcePath = path.join(uploadsDir, filename);
    if (!fs.existsSync(sourcePath)) sourcePath = path.join(backendPublic, filename);
    if (!fs.existsSync(sourcePath)) sourcePath = path.join(rootPublic, filename);

    if (fs.existsSync(sourcePath)) {
      const cRes = await uploadToCloudinary(sourcePath, { folder, public_id: path.parse(filename).name });
      return cRes.secure_url;
    }

    // Check MySQL uploaded_files table
    const row = await db.prepare('SELECT file_data FROM uploaded_files WHERE filename = ?').get(filename);
    if (row && row.file_data) {
      const cRes = await uploadToCloudinary(Buffer.from(row.file_data), { folder, public_id: path.parse(filename).name });
      return cRes.secure_url;
    }
  } catch (err) {
    console.warn(`[Auto-Cloudinary Upload Warning for ${imgRef}]:`, err.message);
  }
  return imgRef;
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
   CUSTOMER AUTH ROUTES (Login & Register with username or email)
   ========================================================================== */

// Customer Registration Handler
const handleCustomerRegister = async (req, res) => {
  const { username, email, password, name, phone } = req.body;

  const cleanUsername = String(username || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPassword = String(password || '');
  const cleanName = String(name || '').trim() || cleanUsername;
  const cleanPhone = String(phone || '').trim();

  // 1. Validation
  if (!cleanUsername) {
    return res.status(400).json({ success: false, message: 'Username is required.' });
  }
  if (cleanUsername.length < 3) {
    return res.status(400).json({ success: false, message: 'Username must be at least 3 characters long.' });
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
    return res.status(400).json({ success: false, message: 'Username can only contain letters, numbers, underscores, and dashes.' });
  }
  if (!cleanEmail) {
    return res.status(400).json({ success: false, message: 'Email address is required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }
  if (!cleanPassword || cleanPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
  }

  try {
    // 2. Check duplicate username
    const existingUsername = await db.prepare('SELECT id FROM users WHERE LOWER(username) = ? AND (is_deleted = 0 OR is_deleted IS NULL)').get(cleanUsername.toLowerCase());
    if (existingUsername) {
      return res.status(409).json({ success: false, message: 'This username is already taken. Please choose another.' });
    }

    // 3. Check duplicate email
    const existingEmail = await db.prepare('SELECT id FROM users WHERE LOWER(email) = ? AND (is_deleted = 0 OR is_deleted IS NULL)').get(cleanEmail);
    if (existingEmail) {
      return res.status(409).json({ success: false, message: 'An account with this email address already exists. Please log in.' });
    }

    // 4. Hash password
    const hashedPassword = bcrypt.hashSync(cleanPassword, 10);

    // 5. Insert new user
    const result = await db.prepare(`
      INSERT INTO users (username, email, password, name, phone, role)
      VALUES (?, ?, ?, ?, ?, 'customer')
    `).run(cleanUsername, cleanEmail, hashedPassword, cleanName, cleanPhone);

    const newUserId = result.insertId || result.lastInsertRowid;

    // 6. Generate JWT token
    const token = jwt.sign(
      { id: newUserId, username: cleanUsername, email: cleanEmail, name: cleanName, role: 'customer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: newUserId,
        username: cleanUsername,
        email: cleanEmail,
        name: cleanName,
        phone: cleanPhone,
        role: 'customer'
      }
    });
  } catch (err) {
    console.error('Customer registration error:', err);
    res.status(500).json({ success: false, message: 'Failed to create account. Please try again.' });
  }
};

app.post('/api/users/register', handleCustomerRegister);
app.post('/api/auth/register', handleCustomerRegister);

// Customer Login Handler (supports username OR email)
const handleCustomerLogin = async (req, res) => {
  const { usernameOrEmail, identifier, email, username, password } = req.body;
  const loginIdentifier = String(usernameOrEmail || identifier || email || username || '').trim();
  const cleanPassword = String(password || '');

  if (!loginIdentifier) {
    return res.status(400).json({ success: false, message: 'Please enter your username or email address.' });
  }
  if (!cleanPassword) {
    return res.status(400).json({ success: false, message: 'Please enter your password.' });
  }

  try {
    // Search by username OR email (case-insensitive) - active accounts only
    const lowerIdentifier = loginIdentifier.toLowerCase();
    const user = await db.prepare(`
      SELECT * FROM users 
      WHERE (LOWER(username) = ? OR LOWER(email) = ?)
        AND (is_deleted = 0 OR is_deleted IS NULL)
    `).get(lowerIdentifier, lowerIdentifier);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username/email or password.' });
    }

    const isMatch = bcrypt.compareSync(cleanPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username/email or password.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, name: user.name, role: user.role || 'customer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: `Welcome back, ${user.name || user.username}!`,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role || 'customer'
      }
    });
  } catch (err) {
    console.error('Customer login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login. Please try again.' });
  }
};

app.post('/api/users/login', handleCustomerLogin);
app.post('/api/auth/customer-login', handleCustomerLogin);

// Google OAuth Login / Register Handler
const handleGoogleLogin = async (req, res) => {
  const { credential, id_token, token, mode } = req.body;
  const rawToken = String(credential || id_token || token || '').trim();
  const authMode = String(mode || req.query.mode || 'login').toLowerCase();

  if (!rawToken) {
    return res.status(400).json({ success: false, message: 'Google credential token is required.' });
  }

  try {
    let payload = null;

    // 1. Try local cryptographic verification via OAuth2Client
    try {
      const ticket = await googleOAuthClient.verifyIdToken({
        idToken: rawToken,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.warn('[Google Auth] OAuth2Client.verifyIdToken error, attempting tokeninfo fallback:', verifyErr.message);
      // 2. Fallback to Google's official tokeninfo HTTPS endpoint
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(rawToken)}`);
      const tokenInfo = await response.json();
      if (tokenInfo.error || !tokenInfo.email) {
        return res.status(401).json({ success: false, message: tokenInfo.error_description || 'Invalid Google credential token.' });
      }
      if (tokenInfo.aud !== GOOGLE_CLIENT_ID) {
        return res.status(401).json({ success: false, message: 'Google client ID mismatch.' });
      }
      payload = tokenInfo;
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ success: false, message: 'Unable to retrieve user information from Google.' });
    }

    const cleanEmail = String(payload.email).trim().toLowerCase();
    const googleSub = String(payload.sub || '');
    const fullName = String(payload.name || payload.given_name || '').trim() || cleanEmail.split('@')[0];
    const picture = payload.picture || null;

    // 3. Check if user exists by google_id or email
    let user = null;
    if (googleSub) {
      user = await db.prepare('SELECT * FROM users WHERE google_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)').get(googleSub);
    }
    if (!user) {
      user = await db.prepare('SELECT * FROM users WHERE LOWER(email) = ? AND (is_deleted = 0 OR is_deleted IS NULL)').get(cleanEmail);
    }

    if (user) {
      // User exists: update missing google_id or avatar
      if (!user.google_id && googleSub) {
        await db.prepare('UPDATE users SET google_id = ? WHERE id = ?').run(googleSub, user.id);
        user.google_id = googleSub;
      }
      if (!user.avatar && picture) {
        await db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(picture, user.id);
        user.avatar = picture;
      }
    } else {
      // User does NOT exist:
      // If trying to login from login page, do NOT auto-create account. Show informative error.
      if (authMode === 'login') {
        return res.status(404).json({
          success: false,
          notRegistered: true,
          email: cleanEmail,
          message: 'This Gmail has no account on this website. Please register.'
        });
      }

      // User does NOT exist and authMode !== 'login' (e.g. register mode): auto-register new customer account
      let baseUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_.-]/g, '_');
      if (baseUsername.length < 3) baseUsername = 'user_' + baseUsername;
      
      let candidateUsername = baseUsername;
      let counter = 1;
      while (await db.prepare('SELECT id FROM users WHERE LOWER(username) = ? AND (is_deleted = 0 OR is_deleted IS NULL)').get(candidateUsername.toLowerCase())) {
        candidateUsername = `${baseUsername}_${Math.floor(100 + Math.random() * 900)}`;
        counter++;
        if (counter > 10) {
          candidateUsername = `${baseUsername}_${Date.now().toString().slice(-4)}`;
          break;
        }
      }

      // Random password hash for DB integrity
      const randomPassword = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36);
      const hashedPassword = bcrypt.hashSync(randomPassword, 10);

      const insertResult = await db.prepare(`
        INSERT INTO users (username, email, password, name, avatar, google_id, role)
        VALUES (?, ?, ?, ?, ?, ?, 'customer')
      `).run(candidateUsername, cleanEmail, hashedPassword, fullName, picture, googleSub);

      const newId = insertResult.insertId || insertResult.lastInsertRowid;
      user = {
        id: newId,
        username: candidateUsername,
        email: cleanEmail,
        name: fullName,
        avatar: picture,
        google_id: googleSub,
        role: 'customer'
      };
    }

    // 4. Issue customer JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        name: user.name, 
        avatar: user.avatar,
        role: user.role || 'customer' 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: `Welcome, ${user.name || user.username}!`,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        phone: user.phone || null,
        role: user.role || 'customer'
      }
    });
  } catch (err) {
    console.error('Google login backend error:', err);
    return res.status(500).json({ success: false, message: 'Google authentication failed. Please try again.' });
  }
};

app.post('/api/users/google-login', handleGoogleLogin);
app.post('/api/auth/google', handleGoogleLogin);

// GET /api/users/me (Fetch current logged-in customer info)
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.prepare('SELECT id, username, email, name, phone, avatar, google_id, role, created_at FROM users WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)').get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   ADMIN REGISTERED USERS MANAGEMENT
   ========================================================================== */

// GET /api/admin/users (Fetch all registered users - excluding passwords and soft-deleted)
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    const users = await db.prepare(`
      SELECT id, username, email, name, phone, avatar, google_id, role, created_at, updated_at 
      FROM users 
      WHERE (is_deleted = 0 OR is_deleted IS NULL)
      ORDER BY id DESC
    `).all();

    // Safely collect order count and spend per user by customer_email without cross-collation joins
    let orderMap = {};
    try {
      const orderStats = await db.prepare(`
        SELECT customer_email, count(*) as count, sum(total_amount) as total 
        FROM orders 
        WHERE customer_email IS NOT NULL AND customer_email != ''
        GROUP BY customer_email
      `).all();

      (orderStats || []).forEach(o => {
        if (o.customer_email) {
          orderMap[o.customer_email.trim().toLowerCase()] = {
            count: Number(o.count || 0),
            total: Number(o.total || 0)
          };
        }
      });
    } catch (orderErr) {
      console.warn('Could not aggregate user order stats:', orderErr.message);
    }

    const formattedUsers = (users || []).map(u => {
      const emailKey = (u.email || '').trim().toLowerCase();
      const stats = orderMap[emailKey] || { count: 0, total: 0 };
      return {
        id: u.id,
        username: u.username,
        email: u.email,
        name: u.name || '',
        phone: u.phone || '',
        avatar: u.avatar || null,
        role: u.role || 'customer',
        google_id: u.google_id || null,
        auth_provider: u.google_id ? 'google' : 'email',
        order_count: stats.count,
        total_spent: Number(stats.total.toFixed(2)),
        created_at: u.created_at,
        updated_at: u.updated_at
      };
    });

    res.json({ success: true, count: formattedUsers.length, users: formattedUsers });
  } catch (err) {
    console.error('Error fetching registered users:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/users/:id (Fetch detailed profile of single registered user)
app.get('/api/admin/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await db.prepare(`
      SELECT id, username, email, name, phone, avatar, google_id, role, created_at, updated_at 
      FROM users 
      WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)
    `).get(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let orders = [];
    if (user.email) {
      try {
        const rawOrders = await db.prepare(`
          SELECT id, order_number, customer_name, customer_email, customer_phone, total_amount, status, items_json, delivery_location, notes, order_source, created_at 
          FROM orders 
          WHERE LOWER(customer_email) = ? 
          ORDER BY id DESC
        `).all(user.email.trim().toLowerCase());

        orders = (rawOrders || []).map(ord => ({
          ...ord,
          total_amount: Number(ord.total_amount || 0),
          items: ord.items_json ? (typeof ord.items_json === 'string' ? JSON.parse(ord.items_json) : ord.items_json) : []
        }));
      } catch (ordErr) {
        console.warn('Error fetching orders for user:', ordErr.message);
      }
    }

    const totalSpent = orders.reduce((sum, ord) => sum + (ord.status !== 'Cancelled' ? ord.total_amount : 0), 0);

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name || '',
        phone: user.phone || '',
        avatar: user.avatar || null,
        role: user.role || 'customer',
        google_id: user.google_id || null,
        auth_provider: user.google_id ? 'google' : 'email',
        created_at: user.created_at,
        updated_at: user.updated_at,
        orders,
        order_count: orders.length,
        total_spent: Number(totalSpent.toFixed(2))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/users/:id (Soft-delete user account)
app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await db.prepare('SELECT id, username, email FROM users WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)').get(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found or already deleted.' });
    }

    await db.prepare('UPDATE users SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
    await logActivity(req.user.id, 'Soft Delete User', `Admin soft deleted user @${user.username} (${user.email}, ID: ${id})`);

    res.json({ success: true, message: `User account @${user.username} deleted successfully.` });
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
    const totalProducts = (await db.prepare('SELECT count(*) AS count FROM products WHERE (is_deleted = 0 OR is_deleted IS NULL)').get()).count;
    const totalCategories = (await db.prepare('SELECT count(*) AS count FROM categories WHERE parent_id IS NULL AND (is_deleted = 0 OR is_deleted IS NULL)').get()).count;
    const totalBrands = (await db.prepare('SELECT count(*) AS count FROM brands WHERE (is_deleted = 0 OR is_deleted IS NULL)').get()).count;
    const totalOrders = (await db.prepare('SELECT count(*) AS count FROM orders').get()).count;
    const totalUsers = (await db.prepare('SELECT count(*) AS count FROM users WHERE (is_deleted = 0 OR is_deleted IS NULL)').get()).count;
    const revenueRow = await db.prepare("SELECT sum(total_amount) AS revenue FROM orders WHERE status != 'Cancelled'").get();
    const totalRevenue = revenueRow && revenueRow.revenue ? Number(revenueRow.revenue) : 0.0;
    const unreadInquiries = (await db.prepare("SELECT count(*) AS count FROM inquiries WHERE status = 'Unread' AND (is_deleted = 0 OR is_deleted IS NULL)").get()).count;

    // Category distribution (Main categories only) - excluding soft deleted
    const categoryBreakdown = await db.prepare(`
      SELECT c.id, c.name, count(DISTINCT p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON (p.category_id = c.id OR p.subcategory_id IN (SELECT id FROM categories WHERE parent_id = c.id AND (is_deleted = 0 OR is_deleted IS NULL))) AND (p.is_deleted = 0 OR p.is_deleted IS NULL)
      WHERE c.parent_id IS NULL AND (c.is_deleted = 0 OR c.is_deleted IS NULL)
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

    // Low stock products alert (active products only)
    const lowStock = await db.prepare(`
      SELECT id, name, brand, stock, price
      FROM products
      WHERE stock <= 30 AND (is_deleted = 0 OR is_deleted IS NULL)
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
        totalUsers: Number(totalUsers || 0),
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
             COALESCE(c.name, sc_parent.name) AS category_name, 
             COALESCE(c.slug, sc_parent.slug) AS category_slug,
             sc.name AS subcategory_name, 
             sc.slug AS subcategory_slug
      FROM products p
      LEFT JOIN categories c ON (p.category_id = c.id AND (c.is_deleted = 0 OR c.is_deleted IS NULL))
      LEFT JOIN categories sc ON (p.subcategory_id = sc.id AND (sc.is_deleted = 0 OR sc.is_deleted IS NULL))
      LEFT JOIN categories sc_parent ON (sc.parent_id = sc_parent.id AND (sc_parent.is_deleted = 0 OR sc_parent.is_deleted IS NULL))
      WHERE (p.is_deleted = 0 OR p.is_deleted IS NULL)
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

    if (search && search.trim()) {
      const cleanSearch = search.trim();
      // Normalize currency words like AED, dhs, dirham, $
      const normalized = cleanSearch.replace(/\b(aed|dhs?|dirhams?|usd|\$)\b/gi, ' ').trim();
      const effectiveSearch = normalized.length > 0 ? normalized : cleanSearch;
      const rawTerms = effectiveSearch
        .split(/\s+/)
        .map(t => t.replace(/^[,;]+|[,;]+$/g, ''))
        .filter(t => t.length > 0 && t !== '&' && t.toLowerCase() !== 'and');

      rawTerms.forEach(term => {
        const numOnly = term.replace(/[^0-9.]/g, '');
        const s = `%${term}%`;
        if (numOnly && !isNaN(Number(numOnly))) {
          const numPattern = `%${numOnly}%`;
          query += ` AND (
            p.name LIKE ? OR 
            p.brand LIKE ? OR 
            p.description LIKE ? OR 
            p.model LIKE ? OR 
            p.wattage LIKE ? OR 
            c.name LIKE ? OR 
            sc.name LIKE ? OR 
            sc_parent.name LIKE ? OR 
            CAST(p.price AS CHAR) LIKE ? OR 
            CAST(p.old_price AS CHAR) LIKE ?
          )`;
          params.push(s, s, s, s, s, s, s, s, numPattern, numPattern);
        } else {
          query += ` AND (
            p.name LIKE ? OR 
            p.brand LIKE ? OR 
            p.description LIKE ? OR 
            p.model LIKE ? OR 
            p.wattage LIKE ? OR 
            c.name LIKE ? OR 
            sc.name LIKE ? OR 
            sc_parent.name LIKE ? OR 
            CAST(p.price AS CHAR) LIKE ?
          )`;
          params.push(s, s, s, s, s, s, s, s, s);
        }
      });
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

    // 1. Search Categories (both main and subcategories) - active only
    const matchedCategories = await db.prepare(`
      SELECT c.*, parent.name AS parent_name, parent.slug AS parent_slug
      FROM categories c
      LEFT JOIN categories parent ON (c.parent_id = parent.id AND (parent.is_deleted = 0 OR parent.is_deleted IS NULL))
      WHERE (c.name LIKE ? OR c.slug LIKE ?)
        AND (c.is_deleted = 0 OR c.is_deleted IS NULL)
      ORDER BY 
        CASE 
          WHEN LOWER(c.name) LIKE ? THEN 1
          WHEN LOWER(c.name) LIKE ? THEN 2
          ELSE 3
        END,
        c.name ASC
      LIMIT 8
    `).all(likeTerm, likeTerm, startTerm.toLowerCase(), likeTerm.toLowerCase());

    // 2. Search Brands - active only
    const matchedBrands = await db.prepare(`
      SELECT *
      FROM brands
      WHERE (name LIKE ? OR slug LIKE ?)
        AND (is_deleted = 0 OR is_deleted IS NULL)
      ORDER BY 
        CASE 
          WHEN LOWER(name) LIKE ? THEN 1
          WHEN LOWER(name) LIKE ? THEN 2
          ELSE 3
        END,
        name ASC
      LIMIT 8
    `).all(likeTerm, likeTerm, startTerm.toLowerCase(), likeTerm.toLowerCase());

    // 3. Search Products - active only
    const matchedProducts = await db.prepare(`
      SELECT p.*, 
             COALESCE(c.name, sc_parent.name) AS category_name, 
             COALESCE(c.slug, sc_parent.slug) AS category_slug,
             sc.name AS subcategory_name, 
             sc.slug AS subcategory_slug
      FROM products p
      LEFT JOIN categories c ON (p.category_id = c.id AND (c.is_deleted = 0 OR c.is_deleted IS NULL))
      LEFT JOIN categories sc ON (p.subcategory_id = sc.id AND (sc.is_deleted = 0 OR sc.is_deleted IS NULL))
      LEFT JOIN categories sc_parent ON (sc.parent_id = sc_parent.id AND (sc_parent.is_deleted = 0 OR sc_parent.is_deleted IS NULL))
      WHERE (
            p.name LIKE ? 
         OR p.brand LIKE ? 
         OR p.description LIKE ? 
         OR p.model LIKE ? 
         OR p.wattage LIKE ? 
         OR c.name LIKE ? 
         OR sc.name LIKE ?
         OR sc_parent.name LIKE ?
         OR CAST(p.price AS CHAR) LIKE ?
      ) AND (p.is_deleted = 0 OR p.is_deleted IS NULL)
      ORDER BY 
        CASE 
          WHEN LOWER(p.name) LIKE ? THEN 1
          WHEN LOWER(p.brand) LIKE ? THEN 2
          ELSE 3
        END,
        p.id DESC
      LIMIT 12
    `).all(
      likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm,
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

    if (!name || price === undefined || price === null) {
      return res.status(400).json({ success: false, message: 'Name and price are required.' });
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
    } else {
      // Automatically ensure images are uploaded to Cloudinary if configured
      if (isCloudinaryConfigured()) {
        primaryImage = await ensureCloudinaryUrl(primaryImage, 'superlight/products');
        if (Array.isArray(images) && images.length > 0) {
          const converted = await Promise.all(images.map(img => ensureCloudinaryUrl(img, 'superlight/products')));
          imagesJson = JSON.stringify(converted);
          primaryImage = converted[0] || primaryImage;
        } else {
          imagesJson = JSON.stringify([primaryImage]);
        }
      } else {
        if (Array.isArray(images) && images.length > 0) {
          imagesJson = JSON.stringify(images);
          primaryImage = images[0] || primaryImage;
        } else {
          imagesJson = JSON.stringify([primaryImage]);
        }
      }
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
      brand ? brand.trim() : '',
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

    const existing = await db.prepare('SELECT * FROM products WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    let primaryImage = image ?? existing.image;
    let imagesJson = existing.images || '';

    if (Array.isArray(images)) {
      if (isCloudinaryConfigured()) {
        const converted = await Promise.all(images.map(img => ensureCloudinaryUrl(img, 'superlight/products')));
        imagesJson = JSON.stringify(converted);
        if (converted.length > 0) primaryImage = converted[0];
      } else {
        imagesJson = JSON.stringify(images);
        if (images.length > 0) primaryImage = images[0];
      }
    } else if (image !== undefined) {
      if (isCloudinaryConfigured()) {
        primaryImage = await ensureCloudinaryUrl(image, 'superlight/products');
      } else {
        primaryImage = image;
      }
      imagesJson = JSON.stringify([primaryImage]);
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
      brand !== undefined ? (brand ? brand.trim() : '') : existing.brand,
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

// DELETE /api/products/:id (Soft-delete product)
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await db.prepare('SELECT name FROM products WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)').get(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found or already deleted.' });
    }

    await db.prepare('UPDATE products SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
    await logActivity(req.user.id, 'Soft Deleted Product', `Soft deleted product: ${product.name} (ID: ${id})`);

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
      LEFT JOIN products p ON (c.id = p.category_id AND (p.is_deleted = 0 OR p.is_deleted IS NULL))
      WHERE (c.is_deleted = 0 OR c.is_deleted IS NULL)
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
    const { name, icon, description, parent_id, subcategories } = req.body;
    let { slug } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    if (!slug || !slug.trim()) {
      slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (!slug) slug = `cat-${Date.now()}`;
    }

    let cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let finalSlug = cleanSlug;
    let counter = 1;
    while (await db.prepare('SELECT id FROM categories WHERE slug = ?').get(finalSlug)) {
      finalSlug = `${cleanSlug}-${counter++}`;
    }

    const result = await db.prepare(`
      INSERT INTO categories (name, slug, icon, description, parent_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(name.trim(), finalSlug, icon || 'Box', description || '', parent_id ? parseInt(parent_id) : null);

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
        if (!subSlug) subSlug = `${finalSlug}-sub-${Date.now()}`;

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
    const { name, icon, description, parent_id, subcategories } = req.body;
    let { slug } = req.body;

    const existing = await db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const newName = name ? name.trim() : existing.name;
    let cleanSlug = slug ? slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : existing.slug;
    if (!cleanSlug && newName) {
      cleanSlug = newName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    if (cleanSlug !== existing.slug) {
      let finalSlug = cleanSlug;
      let counter = 1;
      while (await db.prepare('SELECT id FROM categories WHERE slug = ? AND id != ?').get(finalSlug, id)) {
        finalSlug = `${cleanSlug}-${counter++}`;
      }
      cleanSlug = finalSlug;
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

      // 1. Soft delete removed subcategories
      for (const curSub of currentSubs) {
        if (!incomingIds.includes(curSub.id)) {
          await db.prepare('UPDATE categories SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(curSub.id);
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

// DELETE /api/categories/:id (Soft-delete category and its subcategories)
app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const cat = await db.prepare('SELECT * FROM categories WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)').get(id);
    if (!cat) {
      return res.status(404).json({ success: false, message: 'Category not found or already deleted.' });
    }

    // Soft delete subcategories if this is a parent category
    await db.prepare('UPDATE categories SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE parent_id = ?').run(id);

    // Soft delete the category itself
    await db.prepare('UPDATE categories SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);

    await logActivity(req.user.id, 'Soft Deleted Category', `Soft deleted category: ${cat.name} (ID: ${id})`);
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
      LEFT JOIN products p ON (LOWER(p.brand) = LOWER(b.name) AND (p.is_deleted = 0 OR p.is_deleted IS NULL))
      WHERE (b.is_deleted = 0 OR b.is_deleted IS NULL)
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

    const existing = await db.prepare('SELECT id FROM brands WHERE (LOWER(name) = ? OR slug = ?) AND (is_deleted = 0 OR is_deleted IS NULL)').get(cleanName.toLowerCase(), cleanSlug);
    if (existing) {
      return res.status(400).json({ success: false, message: `Brand with name '${cleanName}' or slug '${cleanSlug}' already exists.` });
    }

    const finalImage = image ? await ensureCloudinaryUrl(image, 'superlight/brands') : '';

    const result = await db.prepare(`
      INSERT INTO brands (name, slug, image, website, description, is_featured)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      cleanName,
      cleanSlug,
      finalImage,
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

    const existing = await db.prepare('SELECT * FROM brands WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Brand not found.' });
    }

    const cleanName = name ? name.trim() : existing.name;
    const cleanSlug = slug
      ? slug.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9\-]+/g, '')
      : existing.slug;

    // Check duplicate name or slug on other brands
    const duplicate = await db.prepare('SELECT id FROM brands WHERE (LOWER(name) = ? OR slug = ?) AND id != ? AND (is_deleted = 0 OR is_deleted IS NULL)').get(cleanName.toLowerCase(), cleanSlug, id);
    if (duplicate) {
      return res.status(400).json({ success: false, message: `Another brand with name '${cleanName}' or slug '${cleanSlug}' already exists.` });
    }

    let finalImage = existing.image;
    if (image !== undefined) {
      finalImage = image ? await ensureCloudinaryUrl(image, 'superlight/brands') : '';
    }

    await db.prepare(`
      UPDATE brands
      SET name = ?, slug = ?, image = ?, website = ?, description = ?, is_featured = ?
      WHERE id = ?
    `).run(
      cleanName,
      cleanSlug,
      finalImage,
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

// DELETE /api/brands/:id (Soft-delete brand)
app.delete('/api/brands/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await db.prepare('SELECT * FROM brands WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)').get(id);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found or already deleted.' });
    }

    await db.prepare('UPDATE brands SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);

    await logActivity(req.user.id, 'Soft Deleted Brand', `Soft deleted brand: ${brand.name} (ID: ${id})`);

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
    const inquiries = await db.prepare('SELECT * FROM inquiries WHERE (is_deleted = 0 OR is_deleted IS NULL) ORDER BY id DESC').all();
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

    await db.prepare('UPDATE inquiries SET status = ? WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)').run(status, id);
    res.json({ success: true, message: 'Inquiry status updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/inquiries/:id (Soft-delete inquiry)
app.delete('/api/inquiries/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const inq = await db.prepare('SELECT id, name FROM inquiries WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)').get(id);
    if (!inq) {
      return res.status(404).json({ success: false, message: 'Inquiry not found or already deleted.' });
    }

    await db.prepare('UPDATE inquiries SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
    await logActivity(req.user.id, 'Soft Deleted Inquiry', `Soft deleted inquiry ID: ${id} from ${inq.name}`);
    res.json({ success: true, message: 'Inquiry deleted successfully.' });
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

    const cloudinaryReady = isCloudinaryConfigured();

    // Process all files concurrently in parallel
    const uploadTasks = files.map(async (f) => {
      let finalUrl = null;
      let cUpload = null;

      // 1. Upload to Cloudinary if configured
      if (cloudinaryReady) {
        try {
          const cRes = await uploadToCloudinary(f.path, {
            folder: 'superlight/uploads',
            public_id: path.parse(f.filename).name
          });
          if (cRes && cRes.secure_url) {
            finalUrl = cRes.secure_url;
            cUpload = {
              public_id: cRes.public_id,
              url: cRes.secure_url,
              format: cRes.format,
              bytes: cRes.bytes
            };
          }
        } catch (cErr) {
          console.error(`[Cloudinary Upload Error for ${f.filename}]:`, cErr.message);
        }
      }

      // 2. Fallback to local /uploads/ URL
      if (!finalUrl) {
        finalUrl = `/uploads/${f.filename}`;
      }

      // 3. Backup to DB table asynchronously in background without blocking response
      setImmediate(async () => {
        try {
          if (fs.existsSync(f.path)) {
            const fileBuffer = fs.readFileSync(f.path);
            await db.prepare(`
              INSERT INTO uploaded_files (filename, mime_type, file_data, size)
              VALUES (?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE file_data = VALUES(file_data), size = VALUES(size)
            `).run(f.filename, f.mimetype || 'image/png', fileBuffer, f.size);
          }
        } catch (dbErr) {
          console.warn(`[Upload DB Background Backup for ${f.filename}]:`, dbErr.message);
        }
      });

      return { finalUrl, cUpload };
    });

    const results = await Promise.all(uploadTasks);
    const urls = results.map(r => r.finalUrl);
    const cloudinaryUploads = results.filter(r => r.cUpload).map(r => r.cUpload);

    res.json({ 
      success: true, 
      imageUrl: urls[0],
      url: urls[0],
      urls,
      storage: cloudinaryReady && cloudinaryUploads.length > 0 ? 'cloudinary' : 'local_storage',
      cloudinaryUploads
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/cloudinary/status
app.get('/api/cloudinary/status', authenticateToken, (req, res) => {
  res.json({
    success: true,
    ...getCloudinaryStatus()
  });
});

// POST /api/cloudinary/migrate (Migrate all existing local/db images to Cloudinary)
app.post('/api/cloudinary/migrate', authenticateToken, async (req, res) => {
  try {
    if (!isCloudinaryConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'Cloudinary is not configured in .env. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'
      });
    }

    const migrationResult = await runCloudinaryMigration();
    await logActivity(req.user.id, 'Cloudinary Migration', `Migrated ${migrationResult.filesMigrated} images to Cloudinary`);
    res.json(migrationResult);
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
  const cStatus = getCloudinaryStatus();
  console.log(`==================================================================`);
  console.log(`🚀 Superlight Admin Backend & SQL Database Server running!`);
  console.log(`📍 Admin Dashboard URL: http://localhost:${PORT}/admin`);
  console.log(`📍 API Base URL:       http://localhost:${PORT}/api`);
  console.log(`👤 Default Admin User: admin@superlight.ae`);
  console.log(`🔑 Default Admin Pass: Admin@123`);
  if (cStatus.configured) {
    console.log(`☁️ Cloudinary Storage: ACTIVE (Cloud: ${cStatus.cloud_name})`);
  } else {
    console.log(`☁️ Cloudinary Storage: WAITING FOR CREDENTIALS in .env`);
  }
  console.log(`==================================================================`);
});

