"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// IMPORTANT: Service role key should NEVER be used client-side
// Only use anon key for client operations
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("⚠️ Supabase credentials belum diisi di file .env!");
}

// Client untuk browser - ONLY use anon key (SAFE)
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// DO NOT export supabaseAdmin client-side!
// Admin operations should go through API routes
// This is intentionally null to prevent accidental usage
export const supabaseAdmin = null;

interface User {
  id: string;
  email: string;
  nama: string;
  role: "customer" | "mitra" | "admin";
  tier?: string;
  telepon?: string;
  alamat?: string;
  kota?: string;
  provinsi?: string;
  rekening_bank?: string;
  rekening_nomor?: string;
  rekening_nama?: string;
  profile_picture?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (nama: string, email: string, password: string, role: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      console.error("Supabase client tidak tersedia");
      setLoading(false);
      return;
    }

    // Cek session saat ini
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch(err => {
      console.error("Error getting session:", err);
      setLoading(false);
    });

    // Listen auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserProfile(userId: string) {
    try {
      // Gunakan supabase client
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (data && !error) {
        setUser({
          id: data.id,
          email: data.email,
          nama: data.nama,
          role: data.role,
          tier: data.tier,
          telepon: data.telepon,
          alamat: data.alamat,
          kota: data.kota,
          provinsi: data.provinsi,
          profile_picture: data.profile_picture,
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
    setLoading(false);
  }

  async function login(email: string, password: string) {
    try {
      if (!supabase) return { success: false, error: "Supabase tidak tersedia" };

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("DEBUG LOGIN ERROR:", error);
        return { success: false, error: `Login gagal: ${error.message} (Status: ${error.status || 400})` };
      }

      // Cek approval untuk mitra
      if (data?.user) {
        // Gunakan supabase client langsung untuk cek status
        const { data: userData } = await supabase
          .from("users")
          .select("status")
          .eq("id", data.user.id)
          .single();
        
        if (userData?.status === "pending") {
          await supabase.auth.signOut();
          return { success: false, error: "Akun Anda masih menunggu persetujuan admin. Silakan hubungi kami." };
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error("Login exception:", error);
      return { success: false, error: error.message || "Login gagal" };
    }
  }

  async function register(nama: string, email: string, password: string, role: string) {
    try {
      if (!supabase) {
        return { success: false, error: "Supabase tidak tersedia" };
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Registrasi gagal");

      // Status: mitra = pending (butuh approval), customer/admin = active langsung
      const status = role === "mitra" ? "pending" : "active";

      // Gunakan supabase client karena service key sudah dihapus
      const { error: dbError } = await supabase
        .from("users")
        .insert({
          id: authData.user.id,
          email,
          nama,
          role,
          tier: "silver",
          status,
        });

      if (dbError) throw dbError;
      return { success: true, message: role === "mitra" ? "Pendaftaran berhasil. Menunggu persetujuan admin." : undefined };
    } catch (error: any) {
      return { success: false, error: error.message || "Registrasi gagal" };
    }
  }

  async function logout() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  }

  async function updateProfile(data: Partial<User>) {
    try {
      if (!user || !supabase) {
        return { success: false, error: "User belum login" };
      }

      const { error } = await supabase
        .from("users")
        .update(data)
        .eq("id", user.id);

      if (error) throw error;
      setUser((prev) => prev ? { ...prev, ...data } : null);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  const contextValue = useMemo(() => ({
    user, 
    loading, 
    login, 
    register, 
    logout, 
    updateProfile
  }), [user, loading, login, register, logout, updateProfile]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth harus digunakan dalam AuthProvider");
  }
  return context;
}
