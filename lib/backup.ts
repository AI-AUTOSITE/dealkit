// lib/backup.ts
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getAllDeals, getAllBrands, getAllInvoices, getAllMessages, getAllBrandNotes, getDatabase } from './storage/database';

const BACKUP_VERSION = 2;

export interface BackupData {
  version: number;
  exportedAt: string;
  data: {
    deals: any[];
    brands: any[];
    invoices: any[];
    messages: any[];
    brandNotes?: any[];
  };
}

// Export all data to JSON file
export async function exportData(): Promise<boolean> {
  try {
    // Gather all data
    const deals = await getAllDeals();
    const brands = await getAllBrands();
    const invoices = await getAllInvoices();
    const messages = await getAllMessages();
    const brandNotes = await getAllBrandNotes();

    const backup: BackupData = {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        deals,
        brands,
        invoices,
        messages,
        brandNotes,
      },
    };

    // Create JSON string
    const jsonString = JSON.stringify(backup, null, 2);

    // Create file path
    const fileName = `dealkit-backup-${new Date().toISOString().split('T')[0]}.json`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;

    // Write file
    await FileSystem.writeAsStringAsync(filePath, jsonString, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Share file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Export DealKit Data',
      });
      return true;
    } else {
      console.error('Sharing is not available');
      return false;
    }
  } catch (error) {
    console.error('Export error:', error);
    return false;
  }
}

// Import data from JSON file
export async function importData(): Promise<{ success: boolean; message: string }> {
  try {
    // Pick document
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { success: false, message: 'No file selected' };
    }

    const fileUri = result.assets[0].uri;

    // Read file
    const jsonString = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Parse JSON
    const backup: BackupData = JSON.parse(jsonString);

    // Validate backup
    if (!backup.version || !backup.data) {
      return { success: false, message: 'Invalid backup file format' };
    }

    // Get database
    const db = getDatabase();

    // Import data (within transaction)
    await db.withTransactionAsync(async () => {
      // Clear existing data
      await db.runAsync('DELETE FROM brand_notes');
      await db.runAsync('DELETE FROM deals');
      await db.runAsync('DELETE FROM brands');
      await db.runAsync('DELETE FROM invoices');
      await db.runAsync('DELETE FROM messages');

      // Import deals
      for (const deal of backup.data.deals) {
        await db.runAsync(
          `INSERT INTO deals (id, title, brand_id, brand_name, value, stage, description, deliverables, due_date, created_at, updated_at, sync_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [deal.id, deal.title, deal.brandId ?? null, deal.brandName, deal.value ?? 0, deal.stage, deal.description ?? null, deal.deliverables ?? null, deal.dueDate ?? null, deal.createdAt, deal.updatedAt, deal.syncStatus ?? 'synced']
        );
      }

      // Import brands
      for (const brand of backup.data.brands) {
        await db.runAsync(
          `INSERT INTO brands (id, name, category, description, logo_url, website, instagram, email, is_favorite, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [brand.id, brand.name, brand.category, brand.description, brand.logoUrl, brand.website, brand.instagram, brand.email, brand.isFavorite ? 1 : 0, brand.createdAt, brand.updatedAt]
        );
      }

      // Import invoices
      for (const invoice of backup.data.invoices) {
        await db.runAsync(
          `INSERT INTO invoices (id, deal_id, brand_id, brand_name, amount, status, due_date, paid_date, paid_amount, description, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [invoice.id, invoice.dealId ?? null, invoice.brandId ?? null, invoice.brandName, invoice.amount, invoice.status, invoice.dueDate ?? null, invoice.paidDate ?? null, invoice.paidAmount ?? 0, invoice.description ?? null, invoice.createdAt, invoice.updatedAt]
        );
      }

      // Import messages
      for (const msg of backup.data.messages) {
        await db.runAsync(
          `INSERT INTO messages (id, deal_id, brand_name, content, type, is_completed, reminder_date, notification_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [msg.id, msg.dealId ?? null, msg.brandName ?? null, msg.content, msg.type, msg.isCompleted ? 1 : 0, msg.reminderDate ?? null, msg.notificationId ?? null, msg.createdAt, msg.updatedAt]
        );
      }

      // Import brand notes (if present in backup)
      if (backup.data.brandNotes) {
        for (const note of backup.data.brandNotes) {
          await db.runAsync(
            `INSERT INTO brand_notes (id, brand_id, content, created_at)
             VALUES (?, ?, ?, ?)`,
            [note.id, note.brandId, note.content, note.createdAt]
          );
        }
      }
    });

    const totalItems = 
      backup.data.deals.length + 
      backup.data.brands.length + 
      backup.data.invoices.length + 
      backup.data.messages.length +
      (backup.data.brandNotes?.length ?? 0);

    return { 
      success: true, 
      message: `Imported ${totalItems} items successfully!` 
    };
  } catch (error) {
    console.error('Import error:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Import failed' 
    };
  }
}

// Clear all data from BOTH databases
export async function clearAllData(): Promise<boolean> {
  try {
    // Clear dealkit_v2.db (hooks database)
    const db = getDatabase();
    
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM brand_notes');
      await db.runAsync('DELETE FROM deals');
      await db.runAsync('DELETE FROM brands');
      await db.runAsync('DELETE FROM invoices');
      await db.runAsync('DELETE FROM messages');
    });

    // Also clear dealkit.db (old database) if it exists
    try {
      const SQLite = await import('expo-sqlite');
      const oldDb = await SQLite.openDatabaseAsync('dealkit.db');
      
      // Try to clear old tables (they may not all exist)
      const tablesToClear = [
        'deals', 'payments', 'brands', 'messages',
        'payment_reminders', 'contract_reviews', 
        'rate_calculations', 'email_drafts',
        'usage_calculations', 'usage_tracking'
      ];
      
      for (const table of tablesToClear) {
        try {
          await oldDb.runAsync(`DELETE FROM ${table}`);
        } catch (e) {
          // Table might not exist, ignore
        }
      }
      
      console.log('[clearAllData] Cleared both databases');
    } catch (e) {
      console.log('[clearAllData] Old database not found or error:', e);
    }

    return true;
  } catch (error) {
    console.error('Clear data error:', error);
    return false;
  }
}