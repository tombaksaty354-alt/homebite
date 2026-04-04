"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth, supabase } from "@/context/AuthContext";

interface WishlistItem {
  id: string;
  produk_id: string;
  customer_id: string;
  created_at: string;
  produk: any; // Data produk lengkap
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  loading: boolean;
  addToWishlist: (produkId: string) => Promise<void>;
  removeFromWishlist: (produkId: string) => Promise<void>;
  isInWishlist: (produkId: string) => boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      refreshWishlist();
    } else {
      setWishlist([]);
    }
  }, [user]);

  async function refreshWishlist() {
    if (!user || !supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("wishlist")
        .select("*, produk:produk_id(*)")
        .eq("customer_id", user.id);
      
      if (!error && data) setWishlist(data);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    }
    setLoading(false);
  }

  async function addToWishlist(produkId: string) {
    if (!user || !supabase) {
      alert("Silakan login terlebih dahulu");
      return;
    }
    
    try {
      const { error } = await supabase
        .from("wishlist")
        .insert({ customer_id: user.id, produk_id: produkId });

      if (error) {
        if (error.code === '23505') {
          alert("Produk sudah ada di wishlist");
        } else {
          throw error;
        }
      } else {
        await refreshWishlist();
      }
    } catch (error: any) {
      alert("Gagal menambah ke wishlist: " + error.message);
    }
  }

  async function removeFromWishlist(produkId: string) {
    if (!user || !supabase) return;
    
    try {
      const { error } = await supabase
        .from("wishlist")
        .delete()
        .eq("customer_id", user.id)
        .eq("produk_id", produkId);

      if (!error) {
        setWishlist(prev => prev.filter(item => item.produk_id !== produkId));
      }
    } catch (error: any) {
      alert("Gagal menghapus dari wishlist: " + error.message);
    }
  }

  function isInWishlist(produkId: string): boolean {
    return wishlist.some(item => item.produk_id === produkId);
  }

  return (
    <WishlistContext.Provider value={{ 
      wishlist, 
      loading, 
      addToWishlist, 
      removeFromWishlist, 
      isInWishlist,
      refreshWishlist 
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist harus digunakan dalam WishlistProvider");
  }
  return context;
}
