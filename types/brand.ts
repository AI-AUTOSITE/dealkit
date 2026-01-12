// types/brand.ts

export type BrandCategory = 
  | 'fashion'
  | 'beauty'
  | 'tech'
  | 'food'
  | 'fitness'
  | 'travel'
  | 'lifestyle'
  | 'gaming'
  | 'finance'
  | 'other';

export interface Brand {
  id: string;
  name: string;
  category: BrandCategory;
  description?: string;
  logoUrl?: string;
  website?: string;
  instagram?: string;
  email?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrandCreateInput {
  name: string;
  category: BrandCategory;
  description?: string;
  logoUrl?: string;
  website?: string;
  instagram?: string;
  email?: string;
}

// Category display info
export const BRAND_CATEGORIES: { value: BrandCategory; label: string; icon: string }[] = [
  { value: 'fashion', label: 'Fashion', icon: 'shirt-outline' },
  { value: 'beauty', label: 'Beauty', icon: 'sparkles-outline' },
  { value: 'tech', label: 'Tech', icon: 'phone-portrait-outline' },
  { value: 'food', label: 'Food', icon: 'restaurant-outline' },
  { value: 'fitness', label: 'Fitness', icon: 'fitness-outline' },
  { value: 'travel', label: 'Travel', icon: 'airplane-outline' },
  { value: 'lifestyle', label: 'Lifestyle', icon: 'home-outline' },
  { value: 'gaming', label: 'Gaming', icon: 'game-controller-outline' },
  { value: 'finance', label: 'Finance', icon: 'card-outline' },
  { value: 'other', label: 'Other', icon: 'grid-outline' },
];