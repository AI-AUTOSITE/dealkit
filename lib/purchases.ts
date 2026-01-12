import { getDatabase, getLocalDateString } from './database';

// Product IDs - これらはApp Store Connect / Google Play Consoleで設定
export const PRODUCT_IDS = {
  MONTHLY: 'dealkit_premium_monthly',
  YEARLY: 'dealkit_premium_yearly',
  LIFETIME: 'dealkit_premium_lifetime',
};

export interface Product {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
  type: 'subscription' | 'lifetime';
}

export interface PurchaseResult {
  success: boolean;
  message: string;
}

// Default products (prices shown to user)
export async function getProducts(): Promise<Product[]> {
  // In production, these would come from the store
  // For now, return default pricing
  return [
    {
      productId: PRODUCT_IDS.MONTHLY,
      title: 'Premium Monthly',
      description: 'Unlimited access to all AI tools',
      price: '$4.99',
      priceAmountMicros: 4990000,
      priceCurrencyCode: 'USD',
      type: 'subscription',
    },
    {
      productId: PRODUCT_IDS.YEARLY,
      title: 'Premium Yearly',
      description: 'Save 50% with annual subscription',
      price: '$29.99',
      priceAmountMicros: 29990000,
      priceCurrencyCode: 'USD',
      type: 'subscription',
    },
    {
      productId: PRODUCT_IDS.LIFETIME,
      title: 'Premium Lifetime',
      description: 'One-time purchase, forever access',
      price: '$79.99',
      priceAmountMicros: 79990000,
      priceCurrencyCode: 'USD',
      type: 'lifetime',
    },
  ];
}

// Purchase a product (simulated in development)
export async function purchaseProduct(productId: string): Promise<PurchaseResult> {
  // In production, this would use react-native-iap or RevenueCat
  // For development/testing, simulate the purchase
  return simulatePurchase(productId);
}

// Restore purchases (simulated in development)
export async function restorePurchases(): Promise<PurchaseResult> {
  // In production, this would check with the store
  return { 
    success: false, 
    message: 'No purchases to restore. This feature requires a production build.' 
  };
}

// Check if premium is still valid (for subscriptions)
export async function checkPremiumStatus(): Promise<boolean> {
  try {
    const db = getDatabase();
    const status = await db.getFirstAsync<{
      is_premium: number;
      subscription_type: string | null;
      expiry_date: string | null;
    }>('SELECT is_premium, subscription_type, expiry_date FROM premium_status WHERE id = 1');

    if (!status || status.is_premium !== 1) {
      return false;
    }

    // Lifetime never expires
    if (status.subscription_type === 'lifetime') {
      return true;
    }

    // Check if subscription has expired
    if (status.expiry_date) {
      const expiry = new Date(status.expiry_date);
      const now = new Date();
      
      if (now > expiry) {
        // Subscription expired - update database
        await db.runAsync(
          'UPDATE premium_status SET is_premium = 0 WHERE id = 1'
        );
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Failed to check premium status:', error);
    return false;
  }
}

// Simulate purchase for development/testing
export async function simulatePurchase(productId: string): Promise<PurchaseResult> {
  try {
    const db = getDatabase();
    const now = getLocalDateString();
    
    let expiryDate: string | null = null;
    let subscriptionType = 'lifetime';
    
    if (productId === PRODUCT_IDS.MONTHLY) {
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + 1);
      expiryDate = getLocalDateString(expiry);
      subscriptionType = 'monthly';
    } else if (productId === PRODUCT_IDS.YEARLY) {
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1);
      expiryDate = getLocalDateString(expiry);
      subscriptionType = 'yearly';
    }
    
    await db.runAsync(
      `UPDATE premium_status SET 
        is_premium = 1, 
        subscription_type = ?,
        purchase_date = ?,
        expiry_date = ?,
        transaction_id = ?
      WHERE id = 1`,
      [subscriptionType, now, expiryDate, `sim_${Date.now()}`]
    );
    
    return { success: true, message: 'Purchase successful! Premium activated.' };
  } catch (error) {
    console.error('Simulate purchase error:', error);
    return { success: false, message: 'Purchase failed. Please try again.' };
  }
}

// Reset premium status (for testing)
export async function resetPremiumStatus(): Promise<void> {
  try {
    const db = getDatabase();
    await db.runAsync(
      `UPDATE premium_status SET 
        is_premium = 0, 
        subscription_type = NULL,
        purchase_date = NULL,
        expiry_date = NULL,
        transaction_id = NULL
      WHERE id = 1`
    );
  } catch (error) {
    console.error('Failed to reset premium status:', error);
  }
}
