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
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      icon TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Products Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER,
      brand TEXT NOT NULL,
      price REAL NOT NULL,
      old_price REAL,
      image TEXT NOT NULL,
      description TEXT,
      stock INTEGER DEFAULT 50,
      rating REAL DEFAULT 5.0,
      reviews_count INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL
    );
  `);

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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

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

  // Seed default categories if none exists
  const checkCat = db.prepare('SELECT count(*) AS count FROM categories').get();
  if (checkCat.count === 0) {
    const defaultCategories = [
      ['Lighting Solutions', 'lighting-solutions', 'Lightbulb', 'Commercial and residential LED fixtures & downlights'],
      ['Cables & Cable Management', 'cables-cable-management', 'Layers', 'High performance industrial copper wiring, conduits & trunking'],
      ['Electrical Accessories', 'electrical-accessories', 'Sliders', 'Premium modular sockets, breakers, door bells and switches'],
      ['Adhesives, Tools & Hardware', 'adhesives-tools-hardware', 'Tool', 'Heavy-duty power tools, sealants and contractor hardware'],
      ['Plumbing Materials', 'plumbing-materials', 'Droplets', 'Pipes, brass gate valves, luxury mixers, and sanitary fixtures'],
      ['Home Automation', 'home-automation', 'Cpu', 'Smart touch switches, video doorbells, biometric locks & gateways']
    ];

    const insertCat = db.prepare(`
      INSERT INTO categories (name, slug, icon, description)
      VALUES (?, ?, ?, ?)
    `);

    for (const cat of defaultCategories) {
      insertCat.run(...cat);
    }
    console.log(`[Database] Seeded ${defaultCategories.length} categories.`);
  }

  // Seed default products if none exists
  const checkProd = db.prepare('SELECT count(*) AS count FROM products').get();
  if (checkProd.count === 0) {
    const getCatId = (slug) => {
      const row = db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug);
      return row ? row.id : 1;
    };

    const initialProducts = [
      {
        name: 'Philips LED Downlight 15W Round (Cool White)',
        slug: 'lighting-solutions',
        brand: 'PHILIPS',
        price: 35.0,
        old_price: 45.0,
        image: '/prod_downlight_1791451418016.png',
        description: 'High efficiency recessed LED downlight with 50,000h lifespan, optimal for commercial offices and modern residences.',
        stock: 140,
        rating: 5.0,
        reviews_count: 24,
        is_featured: 1
      },
      {
        name: 'Ducab Electrical Cable 3 Core 2.5mm (100m Roll)',
        slug: 'cables-cable-management',
        brand: 'DUCAB',
        price: 320.0,
        old_price: 360.0,
        image: '/prod_cable_1791451428788.png',
        description: 'Certified pure copper 3-core 2.5mm building wire, flame retardant PVC jacket compliant with UAE civil defense standards.',
        stock: 85,
        rating: 5.0,
        reviews_count: 32,
        is_featured: 1
      },
      {
        name: 'Heavy-Duty PVC Conduit & Trunking Set (25mm)',
        slug: 'cables-cable-management',
        brand: 'MARSHALL-TUFFLEX',
        price: 85.0,
        old_price: 110.0,
        image: '/Industrial Conduit and Trunking Components.png',
        description: 'Rigid high-impact PVC electrical conduit pipes and accessories for professional surface wiring installations.',
        stock: 60,
        rating: 5.0,
        reviews_count: 19,
        is_featured: 0
      },
      {
        name: 'Legrand 13A Single Switch Socket (White)',
        slug: 'electrical-accessories',
        brand: 'LEGRAND',
        price: 18.0,
        old_price: 24.0,
        image: '/prod_socket_1791451439423.png',
        description: 'British Standard 13 Amp switched power outlet featuring safety shutters and durable polycarbonate finish.',
        stock: 220,
        rating: 5.0,
        reviews_count: 18,
        is_featured: 1
      },
      {
        name: 'Schneider Electric Acti9 MCB 63A Single Pole',
        slug: 'electrical-accessories',
        brand: 'SCHNEIDER',
        price: 25.0,
        old_price: 32.0,
        image: '/prod_mcb_1791451449276.png',
        description: 'Miniature circuit breaker engineered for overload and short-circuit protection in distribution boards.',
        stock: 110,
        rating: 5.0,
        reviews_count: 21,
        is_featured: 0
      },
      {
        name: 'DeWalt 18V Cordless Combo Tool Kit with 2 Batteries',
        slug: 'adhesives-tools-hardware',
        brand: 'DEWALT',
        price: 1250.0,
        old_price: 1480.0,
        image: '/Professional Cordless Tool Kit Display.png',
        description: 'Professional brushless impact driver and hammer drill kit complete with heavy-duty TSTAK carry case.',
        stock: 24,
        rating: 5.0,
        reviews_count: 41,
        is_featured: 1
      },
      {
        name: 'Stanley Professional Electrician Hand Tool Set (28 Pcs)',
        slug: 'adhesives-tools-hardware',
        brand: 'STANLEY',
        price: 285.0,
        old_price: 340.0,
        image: '/Neon Electrician Tools Showcase.png',
        description: 'VDE certified 1000V insulated screwdrivers, pliers, wire strippers, and voltage detector.',
        stock: 45,
        rating: 5.0,
        reviews_count: 28,
        is_featured: 0
      },
      {
        name: 'Grohe Eurosmart Chrome Basin Mixer & Hand Shower Set',
        slug: 'plumbing-materials',
        brand: 'GROHE',
        price: 285.0,
        old_price: 350.0,
        image: '/Polished Chrome Bathroom Fixture Collection.png',
        description: 'Starlight chrome finish monobloc mixer with SilkMove ceramic cartridge and water-saving EcoJoy technology.',
        stock: 35,
        rating: 5.0,
        reviews_count: 36,
        is_featured: 1
      },
      {
        name: 'ERA Schedule 40 UPVC Pressure Pipe & Fittings Kit',
        slug: 'plumbing-materials',
        brand: 'ERA',
        price: 140.0,
        old_price: 175.0,
        image: '/cat_plumbing_1791448831573.png',
        description: 'Corrosion-resistant high-pressure UPVC piping kit for potable water delivery and commercial drainage.',
        stock: 75,
        rating: 5.0,
        reviews_count: 29,
        is_featured: 0
      },
      {
        name: 'Pegler Heavy-Duty Brass Ball & Gate Valves Set',
        slug: 'plumbing-materials',
        brand: 'PEGLER',
        price: 195.0,
        old_price: 245.0,
        image: '/plumbing_brass_valves.png',
        description: 'Dezincification-resistant solid brass valves with full-bore flow for hot and cold plumbing circuits.',
        stock: 52,
        rating: 5.0,
        reviews_count: 24,
        is_featured: 0
      },
      {
        name: 'Franke Stainless Steel Double Bowl Kitchen Sink & Strainer',
        slug: 'plumbing-materials',
        brand: 'FRANKE',
        price: 480.0,
        old_price: 590.0,
        image: '/plumbing_kitchen_sink.png',
        description: 'Aesthetic 18/10 surgical grade stainless steel undermount sink with acoustic sound-deadening pads.',
        stock: 18,
        rating: 5.0,
        reviews_count: 18,
        is_featured: 1
      },
      {
        name: 'Tuya Smart WiFi 2-Gang Touch Wall Switch (Tempered Glass)',
        slug: 'home-automation',
        brand: 'TUYA',
        price: 120.0,
        old_price: 155.0,
        image: '/prod_smart_switch.png',
        description: 'Capacitive touch crystal glass smart switch compatible with Alexa, Google Home, and Smart Life app.',
        stock: 90,
        rating: 5.0,
        reviews_count: 31,
        is_featured: 1
      },
      {
        name: 'Aqara 2K Smart Video Doorbell with Wireless Chime',
        slug: 'home-automation',
        brand: 'AQARA',
        price: 340.0,
        old_price: 410.0,
        image: '/prod_smart_doorbell.png',
        description: 'On-device AI facial recognition, 162-degree ultra wide FOV, and Apple HomeKit Secure Video support.',
        stock: 42,
        rating: 5.0,
        reviews_count: 45,
        is_featured: 1
      },
      {
        name: 'Yale Biometric Keyless Smart Lock with Fingerprint Access',
        slug: 'home-automation',
        brand: 'YALE',
        price: 890.0,
        old_price: 1050.0,
        image: '/prod_smart_lock.png',
        description: 'Bank-grade 3D biometric fingerprint scanner, backlit numeric keypad, RFID card and emergency physical key.',
        stock: 22,
        rating: 5.0,
        reviews_count: 27,
        is_featured: 1
      },
      {
        name: 'BroadLink Zigbee 3.0 & Matter Universal Smart Gateway Hub',
        slug: 'home-automation',
        brand: 'BROADLINK',
        price: 185.0,
        old_price: 230.0,
        image: '/prod_smart_hub.png',
        description: 'High-speed central automation gateway linking up to 128 smart sensors, switches, and voice commands.',
        stock: 64,
        rating: 5.0,
        reviews_count: 38,
        is_featured: 0
      }
    ];

    const insertProd = db.prepare(`
      INSERT INTO products (name, category_id, brand, price, old_price, image, description, stock, rating, reviews_count, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const prod of initialProducts) {
      const catId = getCatId(prod.slug);
      insertProd.run(
        prod.name,
        catId,
        prod.brand,
        prod.price,
        prod.old_price,
        prod.image,
        prod.description,
        prod.stock,
        prod.rating,
        prod.reviews_count,
        prod.is_featured
      );
    }
    console.log(`[Database] Seeded ${initialProducts.length} products.`);
  }

  // Seed sample orders if none exists
  const checkOrders = db.prepare('SELECT count(*) AS count FROM orders').get();
  if (checkOrders.count === 0) {
    const sampleOrders = [
      {
        order_number: 'SL-2026-9041',
        customer_name: 'Rashid Al Maktoum',
        customer_email: 'rashid.m@almaktoum-group.ae',
        customer_phone: '+971 50 882 1199',
        total_amount: 3450.0,
        status: 'Completed',
        items: JSON.stringify([
          { name: 'Ducab Electrical Cable 3 Core 2.5mm', qty: 6, price: 320.0 },
          { name: 'Philips LED Downlight 15W Round', qty: 30, price: 35.0 },
          { name: 'Schneider Electric Acti9 MCB 63A', qty: 10, price: 25.0 }
        ]),
        created_at: '2026-10-10 14:20:00'
      },
      {
        order_number: 'SL-2026-9042',
        customer_name: 'Sarah Jenkins',
        customer_email: 's.jenkins@dxbinteriors.com',
        customer_phone: '+971 55 319 4488',
        total_amount: 1475.0,
        status: 'Processing',
        items: JSON.stringify([
          { name: 'Grohe Eurosmart Chrome Basin Mixer Set', qty: 2, price: 285.0 },
          { name: 'Franke Stainless Steel Double Bowl Kitchen Sink', qty: 1, price: 480.0 },
          { name: 'Tuya Smart WiFi 2-Gang Touch Wall Switch', qty: 3, price: 120.0 }
        ]),
        created_at: '2026-10-11 09:45:00'
      },
      {
        order_number: 'SL-2026-9043',
        customer_name: 'Ahmed Tariq Building Contracting',
        customer_email: 'procurement@tariqcontracting.ae',
        customer_phone: '+971 52 766 2301',
        total_amount: 4890.0,
        status: 'Completed',
        items: JSON.stringify([
          { name: 'DeWalt 18V Cordless Combo Tool Kit', qty: 2, price: 1250.0 },
          { name: 'Yale Biometric Keyless Smart Lock', qty: 2, price: 890.0 },
          { name: 'ERA Schedule 40 UPVC Pressure Pipe Kit', qty: 4, price: 140.0 }
        ]),
        created_at: '2026-10-11 16:30:00'
      },
      {
        order_number: 'SL-2026-9044',
        customer_name: 'David Miller',
        customer_email: 'david.miller@gmail.com',
        customer_phone: '+971 58 412 8890',
        total_amount: 525.0,
        status: 'Pending',
        items: JSON.stringify([
          { name: 'Aqara 2K Smart Video Doorbell', qty: 1, price: 340.0 },
          { name: 'BroadLink Zigbee 3.0 & Matter Smart Gateway Hub', qty: 1, price: 185.0 }
        ]),
        created_at: '2026-10-12 11:15:00'
      }
    ];

    const insertOrder = db.prepare(`
      INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, total_amount, status, items_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const ord of sampleOrders) {
      insertOrder.run(
        ord.order_number,
        ord.customer_name,
        ord.customer_email,
        ord.customer_phone,
        ord.total_amount,
        ord.status,
        ord.items,
        ord.created_at
      );
    }
    console.log(`[Database] Seeded ${sampleOrders.length} orders.`);
  }

  // Seed sample inquiries if none exists
  const checkInquiries = db.prepare('SELECT count(*) AS count FROM inquiries').get();
  if (checkInquiries.count === 0) {
    const sampleInquiries = [
      {
        name: 'Khaled Mansoori',
        email: 'khaled.m@emiratestech.com',
        phone: '+971 50 119 2288',
        subject: 'Bulk quotation for 500 units Ducab 3-Core Cables',
        message: 'Hello Superlight Team, We require a commercial price quote and specification sheets for 500 rolls of Ducab 2.5mm and 4mm cables for a residential project in Dubai South. Please provide delivery timeframe.',
        status: 'Unread'
      },
      {
        name: 'Elena Rostova',
        email: 'elena@designhub.ae',
        phone: '+971 56 904 7712',
        subject: 'Home Automation Integration Query',
        message: 'Hi, are your smart touch switches and biometric locks fully compatible with standard UAE UK-type back boxes and Home Assistant? We would like to visit your showroom.',
        status: 'Replied'
      }
    ];

    const insertInq = db.prepare(`
      INSERT INTO inquiries (name, email, phone, subject, message, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const inq of sampleInquiries) {
      insertInq.run(inq.name, inq.email, inq.phone, inq.subject, inq.message, inq.status);
    }
    console.log(`[Database] Seeded ${sampleInquiries.length} customer inquiries.`);
  }
}

export default db;
