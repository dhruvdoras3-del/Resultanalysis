import mysql from 'mysql2/promise';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool = null;
let sqliteDb = null;
let dbType = 'sqlite';

const useMySQL = process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME;

if (useMySQL) {
  try {
    console.log('Database Config: Initializing MySQL Connection Pool...');
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });
    dbType = 'mysql';
    console.log('Database Config: MySQL configured successfully.');
  } catch (err) {
    console.error('Database Config: Failed to configure MySQL. Falling back to SQLite.', err.message);
    pool = null;
  }
}

if (!pool) {
  console.log('Database Config: Using SQLite fallback database.');
  const dbPath = path.resolve(__dirname, '../db.sqlite');
  
  // Ensure db folder exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Database Config: Error opening SQLite database:', err.message);
    } else {
      console.log(`Database Config: SQLite database opened at ${dbPath}`);
      sqliteDb.run('PRAGMA foreign_keys = ON;');
    }
  });
  dbType = 'sqlite';
}

/**
 * Executes a query and returns the results.
 * Wraps both MySQL pool and SQLite connection in a unified promise-based interface.
 */
export async function query(sql, params = []) {
  if (dbType === 'mysql') {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } else {
    return new Promise((resolve, reject) => {
      // Convert MySQL style "?" parameters to SQLite if necessary (usually they are identical)
      // SQLite run/all/get method mapping:
      // For SELECT queries, use all()
      // For INSERT/UPDATE/DELETE, use run()
      const isSelect = sql.trim().toLowerCase().startsWith('select') || 
                       sql.trim().toLowerCase().startsWith('pragma') ||
                       sql.trim().toLowerCase().startsWith('show');
      
      if (isSelect) {
        sqliteDb.all(sql, params, (err, rows) => {
          if (err) {
            console.error(`SQLite Select Error: ${sql} | Params:`, params, err);
            reject(err);
          } else {
            resolve(rows);
          }
        });
      } else {
        sqliteDb.run(sql, params, function (err) {
          if (err) {
            console.error(`SQLite Execute Error: ${sql} | Params:`, params, err);
            reject(err);
          } else {
            // Return insertId and changes matching MySQL's okPacket
            resolve({
              insertId: this.lastID,
              affectedRows: this.changes
            });
          }
        });
      }
    });
  }
}

export { dbType };
export default { query, dbType };
