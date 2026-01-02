
export enum OmniModule {
  SOCIAL = 'SOCIAL',
  FINANCE = 'FINANCE',
  PROJECTS = 'PROJECTS',
  INSIGHTS = 'INSIGHTS',
  IDENTITY = 'IDENTITY',
  WALLET = 'WALLET',
  SYSTEM_LEDGER = 'SYSTEM_LEDGER',
  VAULT = 'VAULT',
  PULSE = 'PULSE',
  INVENTORY = 'INVENTORY',
  HEALTH = 'HEALTH',
  WORKFLOWS = 'WORKFLOWS',
  COMMAND_CENTER = 'COMMAND_CENTER'
}

export interface Asset {
  id: string;
  name: string;
  serial?: string;
  value: number;
  category: string;
  location: string;
  purchaseDate: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  name: string;
  handle?: string;
  category: 'Professional' | 'Personal' | 'Strategic';
  lastContacted: string;
  notes?: string;
}

export interface SocialPost {
  id: string;
  author: string;
  text: string;
  likes: number;
  createdAt: string;
}

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'BTC' | 'ETH';

export interface WalletBalance {
  currency: CurrencyCode;
  amount: number;
  label: string;
  symbol: string;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: CurrencyCode;
  category: string;
  type: 'income' | 'expense';
  date: string;
  description: string;
  recipient?: string;
  contactId?: string; // Relational link
}

export interface ProjectTask {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
  projectId?: string;
}

export interface HealthMetric {
  id: string;
  date: string;
  type: 'Sleep' | 'HeartRate' | 'Energy' | 'Mood' | 'Weight';
  value: number;
  unit: string;
}

export interface WorkflowRule {
  id: string;
  name: string;
  triggerType: 'TRANSACTION' | 'TASK_COMPLETE' | 'BIO_DROP';
  condition: string;
  action: string;
  active: boolean;
}
