export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      financial_accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'SAVINGS' | 'CREDIT_CARD' | 'CASH' | 'WALLET'
          balance: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'SAVINGS' | 'CREDIT_CARD' | 'CASH' | 'WALLET'
          balance?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'SAVINGS' | 'CREDIT_CARD' | 'CASH' | 'WALLET'
          balance?: number
          created_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string
          to_account_id: string | null
          amount: number
          type: 'INCOME' | 'EXPENSE' | 'INVESTMENT' | 'TRANSFER'
          category: string
          notes: string | null
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          to_account_id?: string | null
          amount: number
          type: 'INCOME' | 'EXPENSE' | 'INVESTMENT' | 'TRANSFER'
          category: string
          notes?: string | null
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          to_account_id?: string | null
          amount?: number
          type?: 'INCOME' | 'EXPENSE' | 'INVESTMENT' | 'TRANSFER'
          category?: string
          notes?: string | null
          date?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          }
        ]
      }
      loans: {
        Row: {
          id: string
          user_id: string
          name: string
          total_amount: number
          outstanding_balance: number
          emi_amount: number
          start_date: string
          duration_months: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          total_amount: number
          outstanding_balance: number
          emi_amount: number
          start_date: string
          duration_months: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          total_amount?: number
          outstanding_balance?: number
          emi_amount?: number
          start_date?: string
          duration_months?: number
          created_at?: string
        }
        Relationships: []
      }
      recurring_transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string
          to_account_id: string | null
          description: string
          amount: number
          type: 'INCOME' | 'EXPENSE' | 'INVESTMENT' | 'TRANSFER'
          category: string
          frequency: 'MONTHLY' | 'YEARLY'
          start_date: string
          next_due_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          to_account_id?: string | null
          description: string
          amount: number
          type: 'INCOME' | 'EXPENSE' | 'INVESTMENT' | 'TRANSFER'
          category: string
          frequency: 'MONTHLY' | 'YEARLY'
          start_date: string
          next_due_date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          to_account_id?: string | null
          description?: string
          amount?: number
          type?: 'INCOME' | 'EXPENSE' | 'INVESTMENT' | 'TRANSFER'
          category?: string
          frequency?: 'MONTHLY' | 'YEARLY'
          start_date?: string
          next_due_date?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_transactions_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          }
        ]
      }
      user_preferences: {
        Row: {
          user_id: string
          preferences: Json
        }
        Insert: {
          user_id: string
          preferences?: Json
        }
        Update: {
          user_id?: string
          preferences?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_user_account: {
        Args: Record<string, never>
        Returns: undefined
      }
    }
    Enums: {
      account_type: 'SAVINGS' | 'CREDIT_CARD' | 'CASH' | 'WALLET'
      transaction_type: 'INCOME' | 'EXPENSE' | 'INVESTMENT' | 'TRANSFER'
      frequency_type: 'MONTHLY' | 'YEARLY'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
