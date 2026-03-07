import * as SQLite from 'expo-sqlite';

// Database instance
let db: SQLite.SQLiteDatabase | null = null;

// Database version for migrations
const DB_VERSION = 4;

// Initialize database
export async function initDatabase(): Promise<void> {
  if (db) return;
  
  db = await SQLite.openDatabaseAsync('dealkit.db');
  
  // Enable foreign keys
  await db.execAsync('PRAGMA foreign_keys = ON;');
  
  // Check current version
  let currentVersion = 0;
  try {
    const versionResult = await db.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version'
    );
    currentVersion = versionResult?.user_version || 0;
  } catch (e) {
    currentVersion = 0;
  }
  
  // If old database exists without version, drop and recreate
  if (currentVersion === 0) {
    try {
      // Check if deals table exists
      const tableExists = await db.getFirstAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='deals'"
      );
      
      if (tableExists) {
        // Old database - check if it has status column
        const tableInfo = await db.getAllAsync<{ name: string }>(
          "PRAGMA table_info(deals)"
        );
        const hasStatus = tableInfo.some(col => col.name === 'status');
        
        if (!hasStatus) {
          // Old schema - drop all tables and recreate
          console.log('Migrating old database schema...');
          await db.execAsync(`
            DROP TABLE IF EXISTS payment_reminders;
            DROP TABLE IF EXISTS contract_reviews;
            DROP TABLE IF EXISTS rate_calculations;
            DROP TABLE IF EXISTS email_drafts;
            DROP TABLE IF EXISTS usage_calculations;
            DROP TABLE IF EXISTS usage_tracking;
            DROP TABLE IF EXISTS payments;
            DROP TABLE IF EXISTS deals;
            DROP TABLE IF EXISTS user_profile;
            DROP TABLE IF EXISTS premium_status;
          `);
        }
      }
    } catch (e) {
      console.log('Migration check error:', e);
    }
  }
  
  // Migration from version 2 to 3: Add usage_types and total_fee columns
  if (currentVersion >= 1 && currentVersion < 3) {
    try {
      // Check if usage_calculations table exists and add missing columns
      const tableExists = await db.getFirstAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='usage_calculations'"
      );
      
      if (tableExists) {
        const tableInfo = await db.getAllAsync<{ name: string }>(
          "PRAGMA table_info(usage_calculations)"
        );
        const columns = tableInfo.map(col => col.name);
        
        if (!columns.includes('usage_types')) {
          await db.execAsync('ALTER TABLE usage_calculations ADD COLUMN usage_types TEXT');
        }
        if (!columns.includes('total_fee')) {
          await db.execAsync('ALTER TABLE usage_calculations ADD COLUMN total_fee REAL');
        }
      }
      console.log('Migration to version 3 completed');
    } catch (e) {
      console.log('Migration to v3 error:', e);
    }
  }

  // Migration from version 3 to 4: Add brand_notes table
  if (currentVersion >= 1 && currentVersion < 4) {
    try {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS brand_notes (
          id TEXT PRIMARY KEY,
          brand_id TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
        )
      `);
      await db.execAsync('CREATE INDEX IF NOT EXISTS idx_brand_notes_brand_id ON brand_notes(brand_id)');
      console.log('Migration to version 4 completed');
    } catch (e) {
      console.log('Migration to v4 error:', e);
    }
  }
  
  // Create tables
  await db.execAsync(`
    -- User Profile
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY DEFAULT 1,
      display_name TEXT,
      primary_platform TEXT,
      handle TEXT,
      followers INTEGER,
      engagement_rate REAL,
      niche TEXT,
      email TEXT,
      default_currency TEXT DEFAULT 'USD',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Deals
    CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      brand_name TEXT NOT NULL,
      campaign_name TEXT,
      rate REAL NOT NULL,
      platform TEXT NOT NULL,
      content_type TEXT NOT NULL,
      deadline TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      progress_stage TEXT DEFAULT 'briefing',
      contact_name TEXT,
      contact_email TEXT,
      usage_rights TEXT,
      usage_duration TEXT,
      exclusivity TEXT,
      payment_terms TEXT DEFAULT 'net_30',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Payments
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      deal_id TEXT,
      brand_name TEXT NOT NULL,
      campaign_name TEXT,
      amount REAL NOT NULL,
      invoice_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      payment_terms TEXT DEFAULT 'net_30',
      status TEXT DEFAULT 'pending',
      paid_date TEXT,
      payment_method TEXT,
      invoice_number TEXT,
      contact_name TEXT,
      contact_email TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL
    );

    -- Payment Reminders
    CREATE TABLE IF NOT EXISTS payment_reminders (
      id TEXT PRIMARY KEY,
      payment_id TEXT NOT NULL,
      reminder_type TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      sent_at TEXT,
      notification_id TEXT,
      FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
    );

    -- Contract Reviews (saved results)
    CREATE TABLE IF NOT EXISTS contract_reviews (
      id TEXT PRIMARY KEY,
      deal_id TEXT,
      contract_text TEXT NOT NULL,
      brand_name TEXT,
      risk_score INTEGER,
      critical_issues TEXT,
      warnings TEXT,
      positive_terms TEXT,
      negotiation_tips TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL
    );

    -- Rate Calculations (saved results)
    CREATE TABLE IF NOT EXISTS rate_calculations (
      id TEXT PRIMARY KEY,
      deal_id TEXT,
      platform TEXT NOT NULL,
      content_type TEXT NOT NULL,
      followers INTEGER NOT NULL,
      engagement_rate REAL,
      niche TEXT,
      usage_rights TEXT,
      duration TEXT,
      exclusivity TEXT,
      whitelisting INTEGER DEFAULT 0,
      calculated_rate_min REAL NOT NULL,
      calculated_rate_max REAL NOT NULL,
      breakdown TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL
    );

    -- Email Drafts
    CREATE TABLE IF NOT EXISTS email_drafts (
      id TEXT PRIMARY KEY,
      deal_id TEXT,
      template_type TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      input_data TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL
    );

    -- Usage Rights Calculations
    CREATE TABLE IF NOT EXISTS usage_calculations (
      id TEXT PRIMARY KEY,
      deal_id TEXT,
      base_rate REAL NOT NULL,
      content_type TEXT,
      digital_usage TEXT,
      traditional_usage TEXT,
      duration TEXT NOT NULL,
      exclusivity TEXT,
      exclusivity_scope TEXT,
      territory TEXT,
      usage_types TEXT,
      total_fee REAL,
      calculated_fee_min REAL,
      calculated_fee_max REAL,
      breakdown TEXT,
      contract_language TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
    CREATE INDEX IF NOT EXISTS idx_deals_deadline ON deals(deadline);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);

    -- Brand Notes
    CREATE TABLE IF NOT EXISTS brand_notes (
      id TEXT PRIMARY KEY,
      brand_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_brand_notes_brand_id ON brand_notes(brand_id);
  `);
  
  // Set database version
  await db.execAsync(`PRAGMA user_version = ${DB_VERSION}`);
  
  console.log('Database initialized successfully');
}

// Get database instance
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// Generate UUID
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Get local date string (respecting timezone)
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
