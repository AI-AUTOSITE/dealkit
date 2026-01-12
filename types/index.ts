// Re-export Brand Types
export * from './brand';

// ============================================
// Deal Types
// ============================================

export type DealStatus = 'active' | 'completed' | 'pending' | 'cancelled';

export type ProgressStage = 
  | 'briefing' 
  | 'shooting' 
  | 'editing' 
  | 'review' 
  | 'done';

export type Platform = 'instagram' | 'tiktok' | 'youtube' | 'twitter';

export type ContentType = 
  // Instagram
  | 'reel' 
  | 'static_post' 
  | 'carousel' 
  | 'story_set'
  // TikTok
  | 'tiktok_60s'
  | 'tiktok_3min'
  // YouTube
  | 'youtube_shorts'
  | 'youtube_dedicated'
  | 'youtube_integration'
  // Twitter
  | 'thread'
  | 'single_post';

export type PaymentTerms = 
  | 'upon_delivery' 
  | 'net_15' 
  | 'net_30' 
  | 'net_45' 
  | 'net_60';

export interface Deal {
  id: string;
  brand_name: string;
  campaign_name?: string;
  rate: number;
  platform: Platform;
  content_type: ContentType;
  deadline: string;
  status: DealStatus;
  progress_stage: ProgressStage;
  contact_name?: string;
  contact_email?: string;
  usage_rights?: string;
  usage_duration?: string;
  exclusivity?: string;
  payment_terms: PaymentTerms;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// Payment Types
// ============================================

export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export type PaymentMethod = 'bank' | 'paypal' | 'venmo' | 'other';

export interface Payment {
  id: string;
  deal_id?: string;
  brand_name: string;
  campaign_name?: string;
  amount: number;
  invoice_date: string;
  due_date: string;
  payment_terms: PaymentTerms;
  status: PaymentStatus;
  paid_date?: string;
  payment_method?: PaymentMethod;
  invoice_number?: string;
  contact_name?: string;
  contact_email?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type ReminderType = 
  | 'before_due' 
  | 'on_due' 
  | 'day_1' 
  | 'day_7' 
  | 'day_14' 
  | 'day_30';

export interface PaymentReminder {
  id: string;
  payment_id: string;
  reminder_type: ReminderType;
  scheduled_date: string;
  sent_at?: string;
  notification_id?: string;
}

// ============================================
// Contract Review Types
// ============================================

export type IssueSeverity = 'critical' | 'warning' | 'positive';

export interface ContractIssue {
  type: string;
  severity: IssueSeverity;
  title: string;
  description: string;
  location?: string;
  original_text?: string;
  recommendation?: string;
  negotiation_phrase?: string;
}

export interface ContractReview {
  id: string;
  deal_id?: string;
  contract_text: string;
  brand_name?: string;
  risk_score: number;
  critical_issues: ContractIssue[];
  warnings: ContractIssue[];
  positive_terms: ContractIssue[];
  negotiation_tips?: string[];
  created_at: string;
}

// ============================================
// Rate Calculator Types
// ============================================

export type Niche = 
  // Premium niches
  | 'finance'
  | 'crypto'
  | 'tech'
  | 'legal'
  | 'healthcare'
  | 'real_estate'
  // Standard niches
  | 'fashion'
  | 'beauty'
  | 'fitness'
  | 'food'
  | 'travel'
  | 'gaming'
  | 'music'
  | 'photography'
  | 'parenting'
  | 'pets'
  | 'lifestyle'
  | 'education'
  | 'entertainment'
  | 'sports'
  | 'diy'
  | 'automotive'
  | 'home_decor';

export interface RateCalculationInput {
  platform: Platform;
  content_type: ContentType;
  followers: number;
  engagement_rate?: number;
  niche: Niche;
  // Premium options
  usage_rights?: string[];
  duration?: string;
  exclusivity?: string;
  whitelisting?: boolean;
}

export interface RateCalculation {
  id: string;
  deal_id?: string;
  platform: Platform;
  content_type: ContentType;
  followers: number;
  engagement_rate?: number;
  niche: Niche;
  usage_rights?: string;
  duration?: string;
  exclusivity?: string;
  whitelisting: boolean;
  calculated_rate_min: number;
  calculated_rate_max: number;
  breakdown?: RateBreakdown;
  created_at: string;
}

export interface RateBreakdown {
  base_rate: number;
  niche_adjustment: number;
  engagement_adjustment: number;
  usage_rights_adjustment: number;
  duration_adjustment: number;
  exclusivity_adjustment: number;
  whitelisting_adjustment: number;
  total: number;
}

// ============================================
// Email Assistant Types
// ============================================

export type EmailCategory = 
  | 'pitch'
  | 'negotiation'
  | 'payment'
  | 'business'
  | 'relationship';

export type EmailTemplate = 
  // Pitch
  | 'pitch_initial'
  | 'pitch_followup'
  // Negotiation
  | 'negotiation_rate_quote'
  | 'negotiation_counter_offer'
  | 'negotiation_usage_rights'
  | 'negotiation_decline'
  // Payment
  | 'payment_pre_due'
  | 'payment_day_1'
  | 'payment_day_7'
  | 'payment_day_14'
  | 'payment_day_30'
  // Business
  | 'business_confirmation'
  | 'business_delivery'
  | 'business_thank_you'
  // Relationship (Premium)
  | 'relationship_checkin'
  | 'relationship_recollab';

export type EmailTone = 'friendly' | 'professional' | 'firm';

export interface EmailDraft {
  id: string;
  deal_id?: string;
  template_type: EmailTemplate;
  subject: string;
  body: string;
  input_data?: Record<string, any>;
  created_at: string;
}

// ============================================
// Usage Rights Calculator Types
// ============================================

export type DigitalUsage = 
  | 'organic_social'
  | 'paid_social'
  | 'website'
  | 'email'
  | 'digital_display'
  | 'whitelisting';

export type TraditionalUsage = 
  | 'print'
  | 'ooh'
  | 'packaging'
  | 'tv_streaming'
  | 'retail';

export type UsageDuration = 
  | '30_days'
  | '3_months'
  | '6_months'
  | '12_months'
  | '2_years'
  | 'perpetual';

export type ExclusivityPeriod = 
  | 'none'
  | '30_days'
  | '60_days'
  | '90_days'
  | '6_months'
  | '12_months';

export type ExclusivityScope = 
  | 'direct_competitors'
  | 'product_category'
  | 'entire_industry';

export type Territory = 
  | 'usa'
  | 'north_america'
  | 'global';

export interface UsageCalculationInput {
  base_rate: number;
  content_type: ContentType;
  digital_usage: DigitalUsage[];
  traditional_usage?: TraditionalUsage[];
  duration: UsageDuration;
  exclusivity: ExclusivityPeriod;
  exclusivity_scope?: ExclusivityScope;
  territory?: Territory;
}

export interface UsageCalculation {
  id: string;
  deal_id?: string;
  base_rate: number;
  content_type: ContentType;
  digital_usage?: string;
  traditional_usage?: string;
  duration: UsageDuration;
  exclusivity: ExclusivityPeriod;
  exclusivity_scope?: ExclusivityScope;
  territory?: Territory;
  calculated_fee_min: number;
  calculated_fee_max: number;
  breakdown?: UsageBreakdown;
  contract_language?: string;
  created_at: string;
}

export interface UsageBreakdown {
  base_rate: number;
  digital_usage_fees: Record<string, number>;
  traditional_usage_fees: Record<string, number>;
  duration_adjustment: number;
  exclusivity_adjustment: number;
  scope_adjustment: number;
  territory_adjustment: number;
  total: number;
  warnings: string[];
}

// ============================================
// User & Premium Types
// ============================================

export interface UserProfile {
  id: number;
  display_name?: string;
  primary_platform?: Platform;
  handle?: string;
  followers?: number;
  engagement_rate?: number;
  niche?: Niche;
  email?: string;
  default_currency: string;
  created_at: string;
  updated_at: string;
}

export type PremiumPlan = 'monthly' | 'yearly';

export interface PremiumStatus {
  id: number;
  is_premium: boolean;
  plan_type?: PremiumPlan;
  purchase_date?: string;
  expiry_date?: string;
  transaction_id?: string;
}

// ============================================
// Feature Usage Limits
// ============================================

export interface FeatureLimits {
  contract_review: { free: number; premium: number };
  rate_calculator: { free: number; premium: number };
  email_assistant: { free: number; premium: number };
  usage_calculator: { free: number; premium: number };
  active_payments: { free: number; premium: number };
}

export const FEATURE_LIMITS: FeatureLimits = {
  contract_review: { free: 2, premium: Infinity },
  rate_calculator: { free: 5, premium: Infinity },
  email_assistant: { free: 5, premium: Infinity },
  usage_calculator: { free: 5, premium: Infinity },
  active_payments: { free: 3, premium: Infinity },
};

