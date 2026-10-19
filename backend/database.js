import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend folder or process environment
dotenv.config({ path: path.join(__dirname, '.env') });

const isMySQLConfigured = !!(process.env.MYSQL_HOST || process.env.DATABASE_URL);

let dbInstance = null;
let initDbFunc = null;

if (isMySQLConfigured) {
  const mysql = await import('mysql2/promise');

  console.log(`[Database] Connecting to Aiven MySQL Cloud Database at ${process.env.MYSQL_HOST || 'via URL'}...`);

  const pool = mysql.default.createPool({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'avnadmin',
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || 'defaultdb',
    ssl: {
      rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
  });

  const formatArgs = (args) => {
    if (!args || args.length === 0) return [];
    if (args.length === 1 && Array.isArray(args[0])) return args[0];
    return args;
  };

  dbInstance = {
    isMySQL: true,
    pool,
    prepare: (sql) => ({
      all: async (...args) => {
        const [rows] = await pool.query(sql, formatArgs(args));
        return rows;
      },
      get: async (...args) => {
        const [rows] = await pool.query(sql, formatArgs(args));
        return rows[0] || null;
      },
      run: async (...args) => {
        const [result] = await pool.query(sql, formatArgs(args));
        return {
          lastInsertRowid: result.insertId,
          insertId: result.insertId,
          changes: result.affectedRows,
          affectedRows: result.affectedRows
        };
      }
    }),
    exec: async (sql) => {
      await pool.query(sql);
    }
  };

  initDbFunc = async () => {
    try {
      const [res] = await pool.query('SELECT 1 as connected');
      console.log(' [Aiven MySQL] Cloud database connected and verified successfully!');
      
      // Ensure persistent uploaded_files table exists
      await pool.query(`
        CREATE TABLE IF NOT EXISTS uploaded_files (
          id INT AUTO_INCREMENT PRIMARY KEY,
          filename VARCHAR(255) UNIQUE NOT NULL,
          mime_type VARCHAR(100) NOT NULL,
          file_data LONGBLOB NOT NULL,
          size INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Ensure customer users table exists
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NULL,
          name VARCHAR(255),
          phone VARCHAR(50),
          avatar TEXT,
          google_id VARCHAR(255),
          role VARCHAR(50) DEFAULT 'customer',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Add google_id, avatar and make password nullable if table already existed
      try {
        const [existingCols] = await pool.query('SHOW COLUMNS FROM users');
        const colNames = existingCols.map(c => c.Field);
        if (!colNames.includes('google_id')) {
          await pool.query('ALTER TABLE users ADD COLUMN google_id VARCHAR(255) NULL');
          console.log(' [Aiven MySQL] Added google_id column to users table');
        }
        if (!colNames.includes('avatar')) {
          await pool.query('ALTER TABLE users ADD COLUMN avatar TEXT NULL');
          console.log(' [Aiven MySQL] Added avatar column to users table');
        }
        const pwdCol = existingCols.find(c => c.Field === 'password');
        if (pwdCol && pwdCol.Null === 'NO') {
          await pool.query('ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL');
          console.log(' [Aiven MySQL] Updated password column to allow NULL for OAuth users');
        }

        // Ensure is_deleted and deleted_at columns exist for soft deletes
        const softDeleteTables = ['users', 'products', 'categories', 'brands', 'inquiries'];
        for (const tbl of softDeleteTables) {
          try {
            const [cols] = await pool.query(`SHOW COLUMNS FROM \`${tbl}\``);
            const names = cols.map(c => c.Field);
            if (!names.includes('is_deleted')) {
              await pool.query(`ALTER TABLE \`${tbl}\` ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0`);
              console.log(` [Aiven MySQL] Added is_deleted column to ${tbl}`);
            }
            if (!names.includes('deleted_at')) {
              await pool.query(`ALTER TABLE \`${tbl}\` ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL`);
              console.log(` [Aiven MySQL] Added deleted_at column to ${tbl}`);
            }
          } catch (tErr) {
            console.warn(`⚠️ [Aiven MySQL] Soft delete column check for ${tbl}:`, tErr.message);
          }
        }

        // Ensure products.brand is nullable
        try {
          const [pCols] = await pool.query('SHOW COLUMNS FROM products');
          const brandCol = pCols.find(c => c.Field === 'brand');
          if (brandCol && brandCol.Null === 'NO') {
            await pool.query("ALTER TABLE products MODIFY COLUMN brand VARCHAR(100) NULL DEFAULT ''");
          }
        } catch (bErr) {}
      } catch (colErr) {
        console.warn('⚠️ [Aiven MySQL] Column check notice:', colErr.message);
      }
    } catch (err) {
      console.error('❌ [Aiven MySQL] Connection error:', err.message);
    }
  };

} else {
  // SQLite Fallback for local offline testing
  const { DatabaseSync } = await import('node:sqlite');
  const dbPath = path.join(__dirname, 'superlight.db');
  console.log(`[Database] Using local SQLite database at: ${dbPath}`);

  const sqliteDb = new DatabaseSync(dbPath);
  sqliteDb.exec('PRAGMA foreign_keys = ON;');
  sqliteDb.exec('PRAGMA journal_mode = WAL;');

  dbInstance = {
    isMySQL: false,
    sqliteDb,
    prepare: (sql) => {
      const stmt = sqliteDb.prepare(sql);
      return {
        all: async (...args) => {
          const flat = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
          return stmt.all(...flat);
        },
        get: async (...args) => {
          const flat = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
          return stmt.get(...flat);
        },
        run: async (...args) => {
          const flat = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
          return stmt.run(...flat);
        }
      };
    },
    exec: async (sql) => {
      sqliteDb.exec(sql);
    }
  };

  initDbFunc = () => {
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS uploaded_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT UNIQUE NOT NULL,
        mime_type TEXT NOT NULL,
        file_data BLOB NOT NULL,
        size INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        name TEXT,
        phone TEXT,
        avatar TEXT,
        google_id TEXT,
        role TEXT DEFAULT 'customer',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    try {
      const cols = sqliteDb.prepare("PRAGMA table_info('users')").all();
      const colNames = cols.map(c => c.name);
      if (!colNames.includes('google_id')) sqliteDb.exec('ALTER TABLE users ADD COLUMN google_id TEXT;');
      if (!colNames.includes('avatar')) sqliteDb.exec('ALTER TABLE users ADD COLUMN avatar TEXT;');

      const softDeleteTables = ['users', 'products', 'categories', 'brands', 'inquiries'];
      for (const tbl of softDeleteTables) {
        try {
          const tCols = sqliteDb.prepare(`PRAGMA table_info('${tbl}')`).all();
          const tNames = tCols.map(c => c.name);
          if (tNames.length > 0) {
            if (!tNames.includes('is_deleted')) sqliteDb.exec(`ALTER TABLE \`${tbl}\` ADD COLUMN is_deleted INTEGER DEFAULT 0;`);
            if (!tNames.includes('deleted_at')) sqliteDb.exec(`ALTER TABLE \`${tbl}\` ADD COLUMN deleted_at DATETIME;`);
          }
        } catch (te) {}
      }
    } catch (e) {}
    console.log('[SQLite] Local database initialized with uploaded_files and users tables.');
  };
}

export const initDatabase = initDbFunc;
export default dbInstance;
