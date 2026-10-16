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
    `);
    console.log('[SQLite] Local database initialized with uploaded_files table.');
  };
}

export const initDatabase = initDbFunc;
export default dbInstance;
