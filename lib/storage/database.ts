// lib/storage/database.ts
import * as SQLite from 'expo-sqlite';
import { Deal, DealCreateInput, DealStage } from '@/types';
import { Invoice, InvoiceCreateInput, InvoiceStatus } from '@/types';
import { Message, MessageCreateInput } from '@/types';
import { Brand, BrandCreateInput, BrandCategory } from '@/types';

// Note: Removed notification imports to avoid circular dependency
// Notifications are scheduled in the UI layer instead

const DATABASE_NAME = 'dealkit_v2.db';

let db: SQLite.SQLiteDatabase | null = null;
let isInitialized = false;
let initPromise: Promise<void> | null = null;

async function ensureDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db && isInitialized) {
    return db;
  }

  // Prevent multiple simultaneous initializations
  if (initPromise) {
    await initPromise;
    return db!;
  }

  initPromise = (async () => {
    try {
      db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      
      // Create tables one by one
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS deals (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          brand_id TEXT,
          brand_name TEXT NOT NULL,
          value REAL DEFAULT 0,
          stage TEXT NOT NULL DEFAULT 'pitched',
          description TEXT,
          deliverables TEXT,
          due_date TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          sync_status TEXT DEFAULT 'synced'
        )
      `);

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS invoices (
          id TEXT PRIMARY KEY,
          deal_id TEXT,
          brand_id TEXT,
          brand_name TEXT,
          amount REAL NOT NULL,
          status TEXT DEFAULT 'draft',
          due_date TEXT,
          paid_date TEXT,
          paid_amount REAL DEFAULT 0,
          description TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          deal_id TEXT,
          brand_name TEXT,
          content TEXT NOT NULL,
          type TEXT DEFAULT 'note',
          is_completed INTEGER DEFAULT 0,
          reminder_date TEXT,
          notification_id TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);

      // Migration: Add reminder_date and notification_id columns if they don't exist
      try {
        await db.execAsync(`ALTER TABLE messages ADD COLUMN reminder_date TEXT`);
      } catch (e) {
        // Column already exists, ignore
      }
      try {
        await db.execAsync(`ALTER TABLE messages ADD COLUMN notification_id TEXT`);
      } catch (e) {
        // Column already exists, ignore
      }

      // Create brands table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS brands (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT DEFAULT 'other',
          description TEXT,
          logo_url TEXT,
          website TEXT,
          instagram TEXT,
          email TEXT,
          is_favorite INTEGER DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);

      isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database init error:', error);
      db = null;
      throw error;
    }
  })();

  await initPromise;
  initPromise = null;
  return db!;
}

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}


// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get current timestamp
function getTimestamp(): string {
  return new Date().toISOString();
}

// ============ DEALS ============

export async function getAllDeals(): Promise<Deal[]> {
  try {
    const database = await ensureDatabase();
    const rows = await database.getAllAsync<any>(
      'SELECT * FROM deals ORDER BY updated_at DESC'
    );
    
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      brandId: row.brand_id,
      brandName: row.brand_name,
      value: row.value,
      stage: row.stage as DealStage,
      description: row.description,
      deliverables: row.deliverables,
      dueDate: row.due_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      syncStatus: row.sync_status,
    }));
  } catch (error) {
    console.error('getAllDeals error:', error);
    return [];
  }
}

export async function getDealById(id: string): Promise<Deal | null> {
  try {
    const database = await ensureDatabase();
    const row = await database.getFirstAsync<any>(
      'SELECT * FROM deals WHERE id = ?',
      [id]
    );
    
    if (!row) return null;
    
    return {
      id: row.id,
      title: row.title,
      brandId: row.brand_id,
      brandName: row.brand_name,
      value: row.value,
      stage: row.stage as DealStage,
      description: row.description,
      deliverables: row.deliverables,
      dueDate: row.due_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      syncStatus: row.sync_status,
    };
  } catch (error) {
    console.error('getDealById error:', error);
    return null;
  }
}

export async function createDeal(input: DealCreateInput): Promise<Deal> {
  const database = await ensureDatabase();
  const now = getTimestamp();
  const id = generateId();
  
  const deal: Deal = {
    id,
    title: input.title,
    brandId: input.brandId || id,
    brandName: input.brandName,
    value: input.value || 0,
    stage: input.stage || 'pitched',
    description: input.description,
    deliverables: input.deliverables,
    dueDate: input.dueDate,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'synced',
  };
  
  await database.runAsync(
    `INSERT INTO deals (id, title, brand_id, brand_name, value, stage, description, deliverables, due_date, created_at, updated_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      deal.id,
      deal.title,
      deal.brandId ?? null,
      deal.brandName,
      deal.value,
      deal.stage,
      deal.description ?? null,
      deal.deliverables ?? null,
      deal.dueDate ?? null,
      deal.createdAt,
      deal.updatedAt,
      deal.syncStatus ?? 'synced',
    ]
  );
  
  // Note: Notification scheduling moved to UI layer
  // if (input.dueDate) {
  //   await scheduleDealReminder(id, input.title, input.dueDate);
  // }
  
  return deal;
}

export async function updateDeal(id: string, updates: Partial<Deal>): Promise<Deal | null> {
  const database = await ensureDatabase();
  const existing = await getDealById(id);
  
  if (!existing) return null;
  
  const updated: Deal = {
    ...existing,
    ...updates,
    updatedAt: getTimestamp(),
  };
  
  await database.runAsync(
    `UPDATE deals SET
      title = ?, brand_id = ?, brand_name = ?, value = ?, stage = ?,
      description = ?, deliverables = ?, due_date = ?, updated_at = ?, sync_status = ?
    WHERE id = ?`,
    [
      updated.title,
      updated.brandId ?? null,
      updated.brandName,
      updated.value,
      updated.stage,
      updated.description ?? null,
      updated.deliverables ?? null,
      updated.dueDate ?? null,
      updated.updatedAt,
      updated.syncStatus ?? 'synced',
      id,
    ]
  );
  
  // Note: Notification scheduling moved to UI layer
  // if (updates.dueDate !== undefined) {
  //   if (updates.dueDate) {
  //     await scheduleDealReminder(id, updated.title, updates.dueDate);
  //   } else {
  //     await cancelReminder(`deal-${id}`);
  //   }
  // }
  
  return updated;
}

export async function updateDealStage(id: string, stage: DealStage): Promise<Deal | null> {
  return updateDeal(id, { stage });
}

export async function deleteDeal(id: string): Promise<boolean> {
  try {
    const database = await ensureDatabase();
    const result = await database.runAsync('DELETE FROM deals WHERE id = ?', [id]);
    
    // Note: Notification cancellation moved to UI layer
    // await cancelReminder(`deal-${id}`);
    
    return result.changes > 0;
  } catch (error) {
    console.error('deleteDeal error:', error);
    return false;
  }
}

// ============ INVOICES ============

export async function getAllInvoices(): Promise<Invoice[]> {
  try {
    const database = await ensureDatabase();
    const rows = await database.getAllAsync<any>(
      'SELECT * FROM invoices ORDER BY created_at DESC'
    );
    
    return rows.map(row => ({
      id: row.id,
      dealId: row.deal_id,
      brandId: row.brand_id,
      brandName: row.brand_name,
      amount: row.amount,
      status: row.status as InvoiceStatus,
      dueDate: row.due_date,
      paidDate: row.paid_date,
      paidAmount: row.paid_amount || 0,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    console.error('getAllInvoices error:', error);
    return [];
  }
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  try {
    const database = await ensureDatabase();
    const row = await database.getFirstAsync<any>(
      'SELECT * FROM invoices WHERE id = ?',
      [id]
    );
    
    if (!row) return null;
    
    return {
      id: row.id,
      dealId: row.deal_id,
      brandId: row.brand_id,
      brandName: row.brand_name,
      amount: row.amount,
      status: row.status as InvoiceStatus,
      dueDate: row.due_date,
      paidDate: row.paid_date,
      paidAmount: row.paid_amount || 0,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    console.error('getInvoiceById error:', error);
    return null;
  }
}

export async function createInvoice(input: InvoiceCreateInput): Promise<Invoice> {
  const database = await ensureDatabase();
  const now = getTimestamp();
  const id = generateId();
  
  const invoice: Invoice = {
    id,
    dealId: input.dealId,
    brandId: input.brandId,
    brandName: input.brandName,
    amount: input.amount,
    status: input.status || 'draft',
    dueDate: input.dueDate,
    paidDate: undefined,
    paidAmount: 0,
    description: input.description,
    createdAt: now,
    updatedAt: now,
  };
  
  await database.runAsync(
    `INSERT INTO invoices (id, deal_id, brand_id, brand_name, amount, status, due_date, paid_date, paid_amount, description, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      invoice.id,
      invoice.dealId ?? null,
      invoice.brandId ?? null,
      invoice.brandName,
      invoice.amount,
      invoice.status,
      invoice.dueDate ?? null,
      invoice.paidDate ?? null,
      invoice.paidAmount,
      invoice.description ?? null,
      invoice.createdAt,
      invoice.updatedAt,
    ]
  );
  
  // Schedule reminder if due date exists
  if (input.dueDate && input.brandName) {
    await scheduleInvoiceReminder(id, input.brandName, input.amount, input.dueDate);
  }
  
  return invoice;
}

export async function updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | null> {
  const database = await ensureDatabase();
  const existing = await getInvoiceById(id);
  
  if (!existing) return null;
  
  const updated: Invoice = {
    ...existing,
    ...updates,
    updatedAt: getTimestamp(),
  };
  
  await database.runAsync(
    `UPDATE invoices SET
      deal_id = ?, brand_id = ?, brand_name = ?, amount = ?, status = ?,
      due_date = ?, paid_date = ?, paid_amount = ?, description = ?, updated_at = ?
    WHERE id = ?`,
    [
      updated.dealId ?? null,
      updated.brandId ?? null,
      updated.brandName,
      updated.amount,
      updated.status,
      updated.dueDate ?? null,
      updated.paidDate ?? null,
      updated.paidAmount,
      updated.description ?? null,
      updated.updatedAt,
      id,
    ]
  );
  
  // Reschedule reminder if due date changed
  if (updates.dueDate !== undefined) {
    if (updates.dueDate && updated.brandName) {
      await scheduleInvoiceReminder(id, updated.brandName, updated.amount, updates.dueDate);
    } else {
      await cancelReminder(`invoice-${id}`);
    }
  }
  
  // Cancel reminder if invoice is paid
  if (updates.status === 'paid') {
    await cancelReminder(`invoice-${id}`);
  }
  
  return updated;
}

export async function markInvoicePaid(id: string, paidAmount?: number): Promise<Invoice | null> {
  const existing = await getInvoiceById(id);
  if (!existing) return null;
  
  // Cancel reminder when paid
  await cancelReminder(`invoice-${id}`);
  
  return updateInvoice(id, {
    status: 'paid',
    paidDate: getTimestamp(),
    paidAmount: paidAmount ?? existing.amount,
  });
}

export async function deleteInvoice(id: string): Promise<boolean> {
  try {
    const database = await ensureDatabase();
    const result = await database.runAsync('DELETE FROM invoices WHERE id = ?', [id]);
    
    // Cancel scheduled reminder
    await cancelReminder(`invoice-${id}`);
    
    return result.changes > 0;
  } catch (error) {
    console.error('deleteInvoice error:', error);
    return false;
  }
}

export async function getInvoiceStats(): Promise<{
  totalEarned: number;
  outstanding: number;
  overdue: number;
  thisMonth: number;
  invoiceCount: number;
}> {
  const invoices = await getAllInvoices();
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  let totalEarned = 0;
  let outstanding = 0;
  let overdue = 0;
  let thisMonth = 0;
  
  invoices.forEach(inv => {
    if (inv.status === 'paid') {
      totalEarned += inv.paidAmount;
      if (inv.paidDate && new Date(inv.paidDate) >= thisMonthStart) {
        thisMonth += inv.paidAmount;
      }
    } else if (inv.status === 'sent' || inv.status === 'draft') {
      outstanding += inv.amount;
      if (inv.dueDate && new Date(inv.dueDate) < now && inv.status === 'sent') {
        overdue += inv.amount;
      }
    }
  });
  
  return { totalEarned, outstanding, overdue, thisMonth, invoiceCount: invoices.length };
}

// ============ BRANDS ============

export async function getAllBrands(): Promise<Brand[]> {
  try {
    const database = await ensureDatabase();
    const rows = await database.getAllAsync<any>(
      'SELECT * FROM brands ORDER BY is_favorite DESC, name ASC'
    );
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category as BrandCategory,
      description: row.description,
      logoUrl: row.logo_url,
      website: row.website,
      instagram: row.instagram,
      email: row.email,
      isFavorite: row.is_favorite === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    console.error('getAllBrands error:', error);
    return [];
  }
}

export async function getBrandById(id: string): Promise<Brand | null> {
  try {
    const database = await ensureDatabase();
    const row = await database.getFirstAsync<any>(
      'SELECT * FROM brands WHERE id = ?',
      [id]
    );
    
    if (!row) return null;
    
    return {
      id: row.id,
      name: row.name,
      category: row.category as BrandCategory,
      description: row.description,
      logoUrl: row.logo_url,
      website: row.website,
      instagram: row.instagram,
      email: row.email,
      isFavorite: row.is_favorite === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    console.error('getBrandById error:', error);
    return null;
  }
}

export async function createBrand(input: BrandCreateInput): Promise<Brand> {
  const database = await ensureDatabase();
  const now = getTimestamp();
  const id = generateId();
  
  const brand: Brand = {
    id,
    name: input.name,
    category: input.category,
    description: input.description,
    logoUrl: input.logoUrl,
    website: input.website,
    instagram: input.instagram,
    email: input.email,
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
  };
  
  await database.runAsync(
    `INSERT INTO brands (id, name, category, description, logo_url, website, instagram, email, is_favorite, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      brand.id,
      brand.name,
      brand.category,
      brand.description ?? null,
      brand.logoUrl ?? null,
      brand.website ?? null,
      brand.instagram ?? null,
      brand.email ?? null,
      brand.isFavorite ? 1 : 0,
      brand.createdAt,
      brand.updatedAt,
    ]
  );
  
  return brand;
}

export async function updateBrand(id: string, updates: Partial<Brand>): Promise<Brand | null> {
  const database = await ensureDatabase();
  const existing = await getBrandById(id);
  
  if (!existing) return null;
  
  const updated: Brand = {
    ...existing,
    ...updates,
    updatedAt: getTimestamp(),
  };
  
  await database.runAsync(
    `UPDATE brands SET
      name = ?, category = ?, description = ?, logo_url = ?,
      website = ?, instagram = ?, email = ?, is_favorite = ?, updated_at = ?
    WHERE id = ?`,
    [
      updated.name,
      updated.category,
      updated.description ?? null,
      updated.logoUrl ?? null,
      updated.website ?? null,
      updated.instagram ?? null,
      updated.email ?? null,
      updated.isFavorite ? 1 : 0,
      updated.updatedAt,
      id,
    ]
  );
  
  return updated;
}

export async function toggleBrandFavorite(id: string): Promise<Brand | null> {
  const existing = await getBrandById(id);
  if (!existing) return null;
  return updateBrand(id, { isFavorite: !existing.isFavorite });
}

export async function deleteBrand(id: string): Promise<boolean> {
  try {
    const database = await ensureDatabase();
    const result = await database.runAsync('DELETE FROM brands WHERE id = ?', [id]);
    return result.changes > 0;
  } catch (error) {
    console.error('deleteBrand error:', error);
    return false;
  }
}

// ============ MESSAGES ============

export async function getAllMessages(): Promise<Message[]> {
  try {
    const database = await ensureDatabase();
    const rows = await database.getAllAsync<any>(
      'SELECT * FROM messages ORDER BY created_at DESC'
    );
    
    return rows.map(row => ({
      id: row.id,
      dealId: row.deal_id,
      brandName: row.brand_name,
      content: row.content,
      type: row.type as 'note' | 'reminder' | 'task',
      isCompleted: row.is_completed === 1,
      reminderDate: row.reminder_date || undefined,
      notificationId: row.notification_id || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    console.error('getAllMessages error:', error);
    return [];
  }
}

export async function getMessageById(id: string): Promise<Message | null> {
  try {
    const database = await ensureDatabase();
    const row = await database.getFirstAsync<any>(
      'SELECT * FROM messages WHERE id = ?',
      [id]
    );
    
    if (!row) return null;
    
    return {
      id: row.id,
      dealId: row.deal_id,
      brandName: row.brand_name,
      content: row.content,
      type: row.type as 'note' | 'reminder' | 'task',
      isCompleted: row.is_completed === 1,
      reminderDate: row.reminder_date || undefined,
      notificationId: row.notification_id || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    console.error('getMessageById error:', error);
    return null;
  }
}

export async function createMessage(input: MessageCreateInput): Promise<Message> {
  const database = await ensureDatabase();
  const now = getTimestamp();
  const id = generateId();
  
  const message: Message = {
    id,
    dealId: input.dealId,
    brandName: input.brandName,
    content: input.content,
    type: input.type || 'note',
    isCompleted: false,
    reminderDate: input.reminderDate,
    createdAt: now,
    updatedAt: now,
  };
  
  await database.runAsync(
    `INSERT INTO messages (id, deal_id, brand_name, content, type, is_completed, reminder_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      message.id,
      message.dealId ?? null,
      message.brandName ?? null,
      message.content,
      message.type,
      message.isCompleted ? 1 : 0,
      message.reminderDate ?? null,
      message.createdAt,
      message.updatedAt,
    ]
  );
  
  return message;
}

export async function updateMessage(id: string, updates: Partial<Message>): Promise<Message | null> {
  const database = await ensureDatabase();
  const existing = await getMessageById(id);
  
  if (!existing) return null;
  
  const updated: Message = {
    ...existing,
    ...updates,
    updatedAt: getTimestamp(),
  };
  
  await database.runAsync(
    `UPDATE messages SET
      deal_id = ?, brand_name = ?, content = ?, type = ?, is_completed = ?, updated_at = ?
    WHERE id = ?`,
    [
      updated.dealId ?? null,
      updated.brandName ?? null,
      updated.content,
      updated.type,
      updated.isCompleted ? 1 : 0,
      updated.updatedAt,
      id,
    ]
  );
  
  return updated;
}

export async function toggleMessageComplete(id: string): Promise<Message | null> {
  const existing = await getMessageById(id);
  if (!existing) return null;
  return updateMessage(id, { isCompleted: !existing.isCompleted });
}

export async function deleteMessage(id: string): Promise<boolean> {
  try {
    const database = await ensureDatabase();
    const result = await database.runAsync('DELETE FROM messages WHERE id = ?', [id]);
    return result.changes > 0;
  } catch (error) {
    console.error('deleteMessage error:', error);
    return false;
  }
}

// ============ STATS ============

export async function getDealStats(): Promise<{
  totalDeals: number;
  totalValue: number;
  byStage: Record<DealStage, { count: number; value: number }>;
}> {
  const deals = await getAllDeals();
  
  const byStage: Record<DealStage, { count: number; value: number }> = {
    pitched: { count: 0, value: 0 },
    negotiating: { count: 0, value: 0 },
    contracted: { count: 0, value: 0 },
    in_progress: { count: 0, value: 0 },
    delivered: { count: 0, value: 0 },
    invoiced: { count: 0, value: 0 },
    paid: { count: 0, value: 0 },
  };
  
  let totalValue = 0;
  deals.forEach(deal => {
    byStage[deal.stage].count++;
    byStage[deal.stage].value += deal.value;
    totalValue += deal.value;
  });
  
  return { totalDeals: deals.length, totalValue, byStage };
}