
export enum OmniModule {
  SOCIAL = 'SOCIAL',
  FINANCE = 'FINANCE',
  PROJECTS = 'PROJECTS',
  INSIGHTS = 'INSIGHTS',
  IDENTITY = 'IDENTITY',
  WALLET = 'WALLET',
  SYSTEM_LEDGER = 'SYSTEM_LEDGER',
  VAULT = 'VAULT',
  PULSE = 'PULSE'
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
}

export interface ProjectTask {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
}
