import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string
          name: string
          description: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          created_by?: string
          created_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          group_id: string
          description: string
          amount: number
          paid_by: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          description: string
          amount: number
          paid_by: string
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          description?: string
          amount?: number
          paid_by?: string
          created_at?: string
        }
      }
      expense_splits: {
        Row: {
          id: string
          expense_id: string
          user_id: string
          amount: number
        }
        Insert: {
          id?: string
          expense_id: string
          user_id: string
          amount: number
        }
        Update: {
          id?: string
          expense_id?: string
          user_id?: string
          amount?: number
        }
      }
      settlements: {
        Row: {
          id: string
          group_id: string
          from_user: string
          to_user: string
          amount: number
          settled_at: string
        }
        Insert: {
          id?: string
          group_id: string
          from_user: string
          to_user: string
          amount: number
          settled_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          from_user?: string
          to_user?: string
          amount?: number
          settled_at?: string
        }
      }
    }
  }
}