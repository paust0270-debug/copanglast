import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types (will be generated later)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          keyword: string;
          current_rank: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          keyword: string;
          current_rank: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          keyword?: string;
          current_rank?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      rank_history: {
        Row: {
          id: string;
          product_id: string;
          rank: number;
          checked_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          rank: number;
          checked_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          rank?: number;
          checked_at?: string;
        };
      };
    };
  };
}
