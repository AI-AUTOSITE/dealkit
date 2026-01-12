// Format currency
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format large numbers (e.g., 45000 -> 45K)
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

// Format percentage
export function formatPercentage(value: number): string {
  return value.toFixed(1) + '%';
}

// Calculate days between two dates
export function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

// Get relative time string (e.g., "3 days ago", "in 2 days")
export function getRelativeTime(dateString: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateString);
  const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 0) return `in ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

// Format date for display
export function formatDate(dateString: string, format: 'short' | 'long' = 'short'): string {
  const date = new Date(dateString);
  if (format === 'short') {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Truncate text with ellipsis
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

// Capitalize first letter of each word
export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// Translate error messages to user-friendly text
export function translateError(error: Error | string): {
  title: string;
  message: string;
  action?: string;
} {
  const msg = typeof error === 'string' ? error : error.message;

  if (msg.includes('Network request failed') || msg.includes('fetch')) {
    return {
      title: "Can't connect",
      message: 'Check your internet and try again.',
      action: 'Try Again',
    };
  }

  if (msg.includes('401') || msg.includes('Unauthorized')) {
    return {
      title: 'Session expired',
      message: 'Please sign in again.',
      action: 'Sign In',
    };
  }

  if (msg.includes('SQLITE_CONSTRAINT') || msg.includes('UNIQUE constraint')) {
    return {
      title: 'Already exists',
      message: 'This name is already taken. Try a different one.',
      action: 'OK',
    };
  }

  if (msg.includes('500') || msg.includes('Internal Server')) {
    return {
      title: 'Something went wrong',
      message: 'There was a problem on our end. Please try again later.',
      action: 'OK',
    };
  }

  // Default fallback
  return {
    title: 'Something went wrong',
    message: 'Please try again later.',
    action: 'OK',
  };
}

// Platform display names
export const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  twitter: 'Twitter',
};

// Content type display names
export const CONTENT_TYPE_LABELS: Record<string, string> = {
  reel: 'Reel',
  static_post: 'Static Post',
  carousel: 'Carousel',
  story_set: 'Story ×3',
  tiktok_60s: 'Video (60s)',
  tiktok_3min: 'Video (1-3min)',
  youtube_shorts: 'Shorts',
  youtube_dedicated: 'Dedicated Video',
  youtube_integration: 'Integration',
  thread: 'Thread',
  single_post: 'Single Post',
};

// Payment terms display
export const PAYMENT_TERM_LABELS: Record<string, string> = {
  upon_delivery: 'Upon Delivery',
  net_15: 'Net-15',
  net_30: 'Net-30',
  net_45: 'Net-45',
  net_60: 'Net-60',
};

// Status colors
export function getStatusConfig(status: string): {
  label: string;
  color: string;
  icon: string;
} {
  switch (status) {
    case 'active':
      return { label: 'Active', color: '#10B981', icon: 'play-circle' };
    case 'completed':
      return { label: 'Completed', color: '#7C3AED', icon: 'checkmark-circle' };
    case 'pending':
      return { label: 'Pending', color: '#F59E0B', icon: 'time' };
    case 'cancelled':
      return { label: 'Cancelled', color: '#6B7280', icon: 'close-circle' };
    case 'paid':
      return { label: 'Paid', color: '#10B981', icon: 'checkmark-circle' };
    case 'overdue':
      return { label: 'Overdue', color: '#EF4444', icon: 'alert-circle' };
    default:
      return { label: status, color: '#6B7280', icon: 'help-circle' };
  }
}
