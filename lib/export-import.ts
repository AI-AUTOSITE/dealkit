import {
  documentDirectory,
  writeAsStringAsync,
  readAsStringAsync,
  deleteAsync,
  readDirectoryAsync,
  getInfoAsync,
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDatabase, getLocalDateString } from './database';

const EXPORT_VERSION = 1;

interface ExportData {
  version: number;
  exportedAt: string;
  data: {
    deals: any[];
    payments: any[];
    userProfile: any;
    settings: any;
  };
}

// Export all user data to JSON file
export async function exportData(): Promise<{ success: boolean; message: string }> {
  try {
    const db = getDatabase();

    // Fetch all deals
    const deals = await db.getAllAsync('SELECT * FROM deals ORDER BY created_at DESC');

    // Fetch all payments
    const payments = await db.getAllAsync('SELECT * FROM payments ORDER BY created_at DESC');

    // Fetch user profile
    const userProfile = await db.getFirstAsync('SELECT * FROM user_profile WHERE id = 1');

    const exportData: ExportData = {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        deals: deals || [],
        payments: payments || [],
        userProfile: userProfile || null,
        settings: {},
      },
    };

    // Create file
    const fileName = `dealkit-backup-${getLocalDateString()}.json`;
    const filePath = `${documentDirectory}${fileName}`;

    await writeAsStringAsync(filePath, JSON.stringify(exportData, null, 2));

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Export DealKit Data',
        UTI: 'public.json',
      });
      return { success: true, message: 'Data exported successfully!' };
    } else {
      return { success: false, message: 'Sharing is not available on this device.' };
    }
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, message: 'Failed to export data. Please try again.' };
  }
}

// Import data from JSON file
export async function importData(): Promise<{ success: boolean; message: string; stats?: { deals: number; payments: number } }> {
  try {
    // Pick document
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return { success: false, message: 'Import cancelled.' };
    }

    const file = result.assets[0];
    if (!file) {
      return { success: false, message: 'No file selected.' };
    }

    // Read file
    const content = await readAsStringAsync(file.uri);
    const importData: ExportData = JSON.parse(content);

    // Validate
    if (!importData.version || !importData.data) {
      return { success: false, message: 'Invalid backup file format.' };
    }

    // Migrate if needed
    const migratedData = migrateData(importData);

    const db = getDatabase();
    let dealsImported = 0;
    let paymentsImported = 0;

    // Import deals
    for (const deal of migratedData.data.deals) {
      try {
        // Check if deal already exists
        const existing = await db.getFirstAsync(
          'SELECT id FROM deals WHERE id = ?',
          [deal.id]
        );

        if (!existing) {
          await db.runAsync(
            `INSERT INTO deals (id, brand_name, campaign_name, platform, content_type, rate, status, deadline, notes, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              deal.id,
              deal.brand_name,
              deal.campaign_name,
              deal.platform,
              deal.content_type,
              deal.rate,
              deal.status,
              deal.deadline,
              deal.notes,
              deal.created_at,
              deal.updated_at,
            ]
          );
          dealsImported++;
        }
      } catch (e) {
        console.error('Failed to import deal:', e);
      }
    }

    // Import payments
    for (const payment of migratedData.data.payments) {
      try {
        const existing = await db.getFirstAsync(
          'SELECT id FROM payments WHERE id = ?',
          [payment.id]
        );

        if (!existing) {
          await db.runAsync(
            `INSERT INTO payments (id, deal_id, brand_name, campaign_name, amount, status, invoice_date, payment_terms, due_date, paid_date, invoice_number, contact_name, contact_email, notes, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              payment.id,
              payment.deal_id,
              payment.brand_name,
              payment.campaign_name,
              payment.amount,
              payment.status,
              payment.invoice_date,
              payment.payment_terms,
              payment.due_date,
              payment.paid_date,
              payment.invoice_number,
              payment.contact_name,
              payment.contact_email,
              payment.notes,
              payment.created_at,
              payment.updated_at,
            ]
          );
          paymentsImported++;
        }
      } catch (e) {
        console.error('Failed to import payment:', e);
      }
    }

    // Import user profile if not exists
    if (migratedData.data.userProfile) {
      const existingProfile = await db.getFirstAsync(
        'SELECT id FROM user_profile WHERE id = 1'
      );

      if (!existingProfile) {
        const p = migratedData.data.userProfile;
        await db.runAsync(
          `INSERT INTO user_profile (id, display_name, platform, handle, followers, engagement_rate, niche, email)
           VALUES (1, ?, ?, ?, ?, ?, ?, ?)`,
          [p.display_name, p.platform, p.handle, p.followers, p.engagement_rate, p.niche, p.email]
        );
      }
    }

    return {
      success: true,
      message: `Import complete!`,
      stats: { deals: dealsImported, payments: paymentsImported },
    };
  } catch (error) {
    console.error('Import error:', error);
    return { success: false, message: 'Failed to import data. Make sure the file is valid.' };
  }
}

// Migrate old data formats to current version
function migrateData(data: ExportData): ExportData {
  let migrated = { ...data };

  // Future migrations can be added here
  // if (data.version < 2) { ... }

  migrated.version = EXPORT_VERSION;
  return migrated;
}

// Get export file info
export async function getLastExportInfo(): Promise<{ date: string | null; size: string | null }> {
  try {
    const dirInfo = await readDirectoryAsync(documentDirectory || '');
    const backupFiles = dirInfo.filter(f => f.startsWith('dealkit-backup-'));
    
    if (backupFiles.length === 0) {
      return { date: null, size: null };
    }

    // Get most recent
    backupFiles.sort().reverse();
    const latestFile = backupFiles[0];
    const filePath = `${documentDirectory}${latestFile}`;
    const fileInfo = await getInfoAsync(filePath);

    if (fileInfo.exists && 'size' in fileInfo) {
      const sizeKB = Math.round(fileInfo.size / 1024);
      const dateStr = latestFile.replace('dealkit-backup-', '').replace('.json', '');
      return { date: dateStr, size: `${sizeKB} KB` };
    }

    return { date: null, size: null };
  } catch {
    return { date: null, size: null };
  }
}

// Clear all local data (for testing or reset)
export async function clearAllData(): Promise<boolean> {
  try {
    const db = getDatabase();
    
    await db.runAsync('DELETE FROM deals');
    await db.runAsync('DELETE FROM payments');
    await db.runAsync('DELETE FROM usage_tracking');
    await db.runAsync('DELETE FROM contract_reviews');
    await db.runAsync('DELETE FROM rate_calculations');
    await db.runAsync('DELETE FROM email_generations');
    await db.runAsync('DELETE FROM usage_calculations');
    await db.runAsync('DELETE FROM payment_reminders');
    
    return true;
  } catch (error) {
    console.error('Clear data error:', error);
    return false;
  }
}
