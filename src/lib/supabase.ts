import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

const getSupabaseUrl = (): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) {
    return import.meta.env.VITE_SUPABASE_URL;
  }
  if (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_URL) {
    return process.env.VITE_SUPABASE_URL;
  }
  return 'https://fkbhsuhlukwyqevwkygx.supabase.co';
};

const getSupabaseAnonKey = (): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return import.meta.env.VITE_SUPABASE_ANON_KEY;
  }
  if (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_ANON_KEY) {
    return process.env.VITE_SUPABASE_ANON_KEY;
  }
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrYmhzdWhsdWt3eXFldndreWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4ODQ0ODAsImV4cCI6MjEwMjQ2MDQ4MH0.R-_cP8p5T1EdzgVNk6c6w4GEj_BNz17OQkjBw3U683c';
};

export const supabaseUrl = getSupabaseUrl();
export const supabaseAnonKey = getSupabaseAnonKey();

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
