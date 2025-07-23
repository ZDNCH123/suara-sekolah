import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  name: string;
  nikNis: string;
  displayId: string;
  role: 'siswa' | 'guru' | 'osis' | 'admin';
  points: number;
  badges: string[];
  kelas?: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (nikNis: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  updatePoints: (points: number) => void;
  addBadge: (badge: string) => void;
}

interface RegisterData {
  nikNis: string;
  name: string;
  role: 'siswa' | 'guru' | 'osis' | 'admin';
  kelas?: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Session error:', error.message);
      }

      if (session?.user) {
        await loadUserProfile(session.user);
      }

      setLoading(false);
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      if (userError) {
        console.error('Supabase query error:', userError.message);
        setUser(null);
        return;
      }

      if (!userData) {
        console.warn(`User with id ${supabaseUser.id} not found in "users" table`);
        // Create user profile if it doesn't exist
        const { data: newUserData, error: insertError } = await supabase
          .from('users')
          .insert({
            id: supabaseUser.id,
            nik_nis: supabaseUser.email?.split('@')[0] || '',
            display_id: Math.random().toString(36).substring(2, 10).toUpperCase(),
            name: supabaseUser.user_metadata?.full_name || 'User',
            role: supabaseUser.user_metadata?.role || 'siswa',
            password_hash: 'handled_by_supabase_auth',
            kelas: supabaseUser.user_metadata?.kelas || null
          })
          .select()
          .single();

        if (insertError) {
          console.error('Failed to create user profile:', insertError.message);
          setUser(null);
          return;
        }

        // Also create leaderboard entry
        await supabase.from('leaderboard').insert({
          user_id: supabaseUser.id,
          total_berita: 0,
          total_pengaduan: 0,
          points: 0
        });

        userData = newUserData;
      }

      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .maybeSingle();

      if (leaderboardError) {
        console.error('Leaderboard query error:', leaderboardError.message);
      }

      const profile: User = {
        id: userData.id,
        name: userData.name,
        nikNis: userData.nik_nis,
        displayId: userData.display_id,
        role: userData.role,
        points: leaderboardData?.points || 0,
        badges: [], // bisa tambahkan fitur badges kalau nanti ada di DB
        kelas: userData.kelas,
        email: supabaseUser.email
      };

      setUser(profile);
    } catch (err) {
      console.error('Unhandled error loading profile:', err);
      setUser(null);
    }
  };

  const login = async (nikNis: string, password: string): Promise<boolean> => {
    setLoading(true);

    try {
      // Sign in with constructed email
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${nikNis}@suarasekolah.id`,
        password
      });

      if (error) {
        console.error('Login failed:', error.message);
        setLoading(false);
        return false;
      }

      if (data.user) {
        await loadUserProfile(data.user);
        setLoading(false);
        return true;
      }

      console.warn('Login succeeded but user data missing');
      setLoading(false);
      return false;
    } catch (err) {
      console.error('Login error:', err);
      setLoading(false);
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    setLoading(true);

    try {
      // Generate random display_id
      const generateDisplayId = () => {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
      };

      let displayId = generateDisplayId();
      
      // Check if display_id already exists
      let { data: existingUser } = await supabase
        .from('users')
        .select('display_id')
        .eq('display_id', displayId)
        .maybeSingle();

      // Generate new ID if exists
      while (existingUser) {
        displayId = generateDisplayId();
        const { data } = await supabase
          .from('users')
          .select('display_id')
          .eq('display_id', displayId)
          .maybeSingle();
        existingUser = data;
      }

    const { data, error } = await supabase.auth.signUp({
      email: `${userData.nikNis}@suarasekolah.id`,
      password: userData.password,
      options: {
        data: {
          full_name: userData.name,
          nik_nis: userData.nikNis,
          role: userData.role,
          kelas: userData.kelas
        }
      }
    });

    if (error) {
      console.error('Registration failed:', error.message);
      setLoading(false);
      return false;
    }

    if (data.user) {
      // Insert ke tabel public.users
      const { error: insertError } = await supabase.from('users').insert({
        id: data.user.id,
        nik_nis: userData.nikNis,
        display_id: displayId,
        name: userData.name,
        role: userData.role,
        password_hash: 'handled_by_supabase_auth',
        kelas: userData.kelas
      });

      if (insertError) {
        console.error('Insert user to "users" table failed:', insertError.message);
        setLoading(false);
        return false;
      }

      // Insert ke leaderboard
      const { error: leaderboardError } = await supabase.from('leaderboard').insert({
        user_id: data.user.id,
        total_berita: 0,
        total_pengaduan: 0,
        points: 0
      });

      if (leaderboardError) {
        console.warn('Leaderboard entry failed:', leaderboardError.message);
        // Tidak harus return false karena tidak fatal
      }

      await loadUserProfile(data.user);
      setLoading(false);
      return true;
    }

    console.warn('Register succeeded but user data missing');
    setLoading(false);
    return false;
    } catch (err) {
      console.error('Registration error:', err);
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updatePoints = (points: number) => {
    if (user) {
      const newPoints = user.points + points;
      setUser({ ...user, points: newPoints });

      supabase.from('leaderboard')
        .update({ points: newPoints })
        .eq('user_id', user.id)
        .then(({ error }) => {
          if (error) console.error('Update points error:', error.message);
        });
    }
  };

  const addBadge = (badge: string) => {
    if (user && !user.badges.includes(badge)) {
      const newBadges = [...user.badges, badge];
      setUser({ ...user, badges: newBadges });

      // TODO: Simpan badges ke database kalau nanti ada field-nya
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updatePoints,
    addBadge
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
