import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// ===========================
// AUTH HELPERS
// ===========================

export const signUp = async (nikNis: string, password: string, userData: { name: string, role: string, kelas?: string }) => {
  if (!nikNis || !password || !userData.name || !userData.role) {
    return { data: null, error: new Error("NIK/NIS, Password, Nama, dan Role wajib diisi") };
  }

  const { data, error } = await supabase.auth.signUp({
    email: `${nikNis}@suarasekolah.id`, // Email fiktif berbasis NIK/NIS
    password,
    options: {
      data: {
        nik_nis: nikNis,
        name: userData.name,
        role: userData.role,
        kelas: userData.kelas || null
      }
    }
  });

  return { data, error };
};

export const signIn = async (nikNis: string, password: string) => {
  if (!nikNis || !password) {
    return { data: null, error: new Error("NIK/NIS dan Password wajib diisi") };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: `${nikNis}@suarasekolah.id`,
    password
  });

  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user || null, error };
};
