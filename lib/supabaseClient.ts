import { createClient } from '@supabase/supabase-js';

// Credentials provided in prompt
const DEFAULT_URL = "https://ecfzrlvblcozgijfkzid.supabase.co";
const DEFAULT_KEY = "sb_publishable_IQi0jdvZffTxHYmjYwDiIg_ms51W19P";

// Safe accessor for environment variables to prevent runtime errors
const getEnv = (key: string, fallback: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key] || fallback;
    }
  } catch (e) {
    console.warn('Error reading environment variables, using fallback.');
  }
  return fallback;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL', DEFAULT_URL);
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY', DEFAULT_KEY);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/* 
  ===================================================================
  DATABASE SETUP (Already created by you)
  ===================================================================
  
  Table Name: "data"
  Columns:
    - id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
    - payload: JSONB
    - created_at: TIMESTAMPTZ DEFAULT NOW()
*/