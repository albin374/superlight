import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path
const dbPath = path.join(__dirname, 'superlight.db');
const db = new DatabaseSync(dbPath);

// Enable foreign keys and WAL mode for reliability and speed
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

/**
 * Initialize SQL Database Tables and seed default data
 */
export function initDatabase() {
  console.log(`[Database] Initializing SQL Database at: ${dbPath}`);

  // 1. Admins Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Super Admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Categories Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      icon TEXT,
      description TEXT,
      parent_id INTEGER DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(parent_id) REFERENCES categories(id) ON DELETE CASCADE
    );
  `);

  // 3. Products Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER,
      subcategory_id INTEGER,
      brand TEXT NOT NULL,
      price REAL NOT NULL,
      old_price REAL,
      image TEXT NOT NULL,
      images TEXT,
      warranty TEXT,
      wattage TEXT,
      model TEXT,
      description TEXT,
      stock INTEGER DEFAULT 50,
      rating REAL DEFAULT 5.0,
      reviews_count INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      is_bestseller INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY(subcategory_id) REFERENCES categories(id) ON DELETE SET NULL
    );
  `);

  // Migration for new product columns
  try {
    const tableInfo = db.prepare("PRAGMA table_info(products)").all();
    const existingCols = tableInfo.map(c => c.name);

    if (!existingCols.includes('subcategory_id')) {
      db.exec("ALTER TABLE products ADD COLUMN subcategory_id INTEGER;");
    }
    if (!existingCols.includes('images')) {
      db.exec("ALTER TABLE products ADD COLUMN images TEXT;");
    }
    if (!existingCols.includes('warranty')) {
      db.exec("ALTER TABLE products ADD COLUMN warranty TEXT;");
    }
    if (!existingCols.includes('wattage')) {
      db.exec("ALTER TABLE products ADD COLUMN wattage TEXT;");
    }
    if (!existingCols.includes('model')) {
      db.exec("ALTER TABLE products ADD COLUMN model TEXT;");
    }
    if (!existingCols.includes('is_bestseller')) {
      db.exec("ALTER TABLE products ADD COLUMN is_bestseller INTEGER DEFAULT 0;");
    }
  } catch (mErr) {
    console.error('[Database] Products migration note:', mErr.message);
  }

  // 4. Orders Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      items_json TEXT,
      delivery_location TEXT,
      notes TEXT,
      order_source TEXT DEFAULT 'WhatsApp',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration for orders table columns
  try {
    const ordersInfo = db.prepare("PRAGMA table_info(orders)").all();
    const existingOrderCols = ordersInfo.map(c => c.name);

    if (!existingOrderCols.includes('delivery_location')) {
      db.exec("ALTER TABLE orders ADD COLUMN delivery_location TEXT;");
    }
    if (!existingOrderCols.includes('notes')) {
      db.exec("ALTER TABLE orders ADD COLUMN notes TEXT;");
    }
    if (!existingOrderCols.includes('order_source')) {
      db.exec("ALTER TABLE orders ADD COLUMN order_source TEXT DEFAULT 'WhatsApp';");
    }
  } catch (oErr) {
    console.error('[Database] Orders migration note:', oErr.message);
  }

  // 5. Inquiries / Contact Messages Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      subject TEXT,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Unread',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 6. Activity Logs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 7. Brands Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      image TEXT,
      website TEXT,
      description TEXT,
      is_featured INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default brands if none exists
  const checkBrands = db.prepare('SELECT count(*) AS count FROM brands').get();
  if (checkBrands.count === 0) {
    const defaultBrands = [
      { name: 'Schneider Electric', slug: 'schneider-electric', image: '/logo/Schneider Electric.png', is_featured: 1 },
      { name: 'Legrand', slug: 'legrand', image: '/logo/Legrand.png', is_featured: 1 },
      { name: 'Philips', slug: 'philips', image: '/logo/philips.png', is_featured: 1 },
      { name: 'Osram', slug: 'osram', image: '/logo/osram.png', is_featured: 1 },
      { name: 'Makita', slug: 'makita', image: '/logo/makitha.png', is_featured: 1 },
      { name: 'DeWalt', slug: 'dewalt', image: '/logo/DeWalt_Logo.svg', is_featured: 1 },
      { name: 'Belden', slug: 'belden', image: '/logo/belden.png', is_featured: 1 },
      { name: 'Fluke', slug: 'fluke', image: '/logo/Fluke_Logo2.webp', is_featured: 1 },
      { name: 'Ducab', slug: 'ducab', image: '/logo/Ducab.png', is_featured: 1 },
      { name: 'Marshall-Tufflex', slug: 'marshall-tufflex', image: '/logo/Marshall-Tufflex.png', is_featured: 0 },
      { name: 'ABB', slug: 'abb', image: '/logo/ABB.png', is_featured: 0 }
    ];

    const insertBrand = db.prepare(`
      INSERT INTO brands (name, slug, image, is_featured)
      VALUES (?, ?, ?, ?)
    `);

    for (const b of defaultBrands) {
      insertBrand.run(b.name, b.slug, b.image, b.is_featured);
    }
    console.log('[Database] Default brands seeded.');
  }

  // Seed default admin if none exists
  const checkAdmin = db.prepare('SELECT count(*) AS count FROM admins').get();
  if (checkAdmin.count === 0) {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync('Admin@123', salt);
    
    db.prepare(`
      INSERT INTO admins (name, email, password, role)
      VALUES (?, ?, ?, ?)
    `).run('Superlight Administrator', 'admin@superlight.ae', hashedPassword, 'Super Admin');

    console.log('[Database] Default admin created: admin@superlight.ae / Admin@123');
  }
}

export default db;
