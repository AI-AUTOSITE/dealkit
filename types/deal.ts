// types/deal.ts

export type DealStage =
  | 'pitched'
  | 'negotiating'
  | 'contracted'
  | 'in_progress'
  | 'delivered'
  | 'invoiced'
  | 'paid';

export interface Deal {
  id: string;
  title: string;
  brandId?: string;
  brandName: string;
  value: number;
  stage: DealStage;
  description?: string;
  deliverables?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus?: 'synced' | 'pending' | 'error';
}

// brandId をオプショナルに変更
export interface DealCreateInput {
  title: string;
  brandId?: string;      // ← オプショナル
  brandName: string;
  value?: number;
  stage?: DealStage;
  description?: string;
  deliverables?: string;
  dueDate?: string;
}