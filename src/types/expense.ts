export interface Expense {
  id: string;
  user_id: string;
  member_id: string;
  name: string;
  details: string;
  amount: number;
  status: string;
  attachments?: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseInput {
  user_id: string;
  member_id: string;
  name: string;
  details: string;
  amount: number;
  attachments?: string[];
}

export interface UpdateExpenseInput {
  name?: string;
  details?: string;
  amount?: number;
  status?: string;
  attachments?: string[];
}
