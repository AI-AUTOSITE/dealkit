// types/message.ts

export interface Message {
  id: string;
  dealId?: string;
  brandName?: string;
  content: string;
  type: 'note' | 'reminder' | 'task';
  isCompleted?: boolean;
  reminderDate?: string;  // ISO date string for reminder
  notificationId?: string; // ID of scheduled notification
  createdAt: string;
  updatedAt: string;
}

export interface MessageCreateInput {
  dealId?: string;
  brandName?: string;
  content: string;
  type?: 'note' | 'reminder' | 'task';
  reminderDate?: string;
}