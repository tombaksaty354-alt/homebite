"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ItemKeranjang, ProdukMakanan, KeranjangContextType } from "@/types";

const KeranjangContext = createContext<KeranjangContextType | undefined>(undefined);

export function KeranjangProvider({ children }: { children: ReactNode }) {
  const [keranjang, setKeranjang] = useState<ItemKeranjang[]>([]);

  // Muat keranjang dari localStorage saat mount
  useEffect(() => {
    const keranjangTersimpan = localStorage.getItem("keranjang-homebite");
    if (keranjangTersimpan) {
      setKeranjang(JSON.parse(keranjangTersimpan));
    }
  }, []);

  // Simpan keranjang ke localStorage saat berubah
  useEffect(() => {
    localStorage.setItem("keranjang-homebite", JSON.stringify(keranjang));
  }, [keranjang]);

  const tambahKeKeranjang = (produk: ProdukMakanan) => {
    // Normalize product data to ensure camelCase fields
    const normalizedProduk = {
      ...produk,
      // Ensure mitraId is set (support both snake_case and camelCase from API)
      mitraId: produk.mitraId || (produk as any).mitra_id,
      mitraNama: produk.mitraNama || (produk as any).mitra_nama,
      mitraTier: produk.mitraTier || (produk as any).mitra_tier || 'silver',
    };

    setKeranjang((keranjangSebelumnya) => {
      const itemExist = keranjangSebelumnya.find((item) => item.id === produk.id);
      if (itemExist) {
        return keranjangSebelumnya.map((item) =>
          item.id === produk.id ? { ...item, jumlah: item.jumlah + 1 } : item
        );
      }
      return [...keranjangSebelumnya, { ...normalizedProduk, jumlah: 1 }];
    });
  };

  const hapusDariKeranjang = (produkId: number) => {
    setKeranjang((keranjangSebelumnya) =>
      keranjangSebelumnya.filter((item) => item.id !== produkId)
    );
  };

  const updateJumlah = (produkId: number, jumlah: number) => {
    if (jumlah <= 0) {
      hapusDariKeranjang(produkId);
      return;
    }
    setKeranjang((keranjangSebelumnya) =>
      keranjangSebelumnya.map((item) => (item.id === produkId ? { ...item, jumlah } : item))
    );
  };

  const kosongkanKeranjang = () => {
    setKeranjang([]);
  };

  const getTotalKeranjang = () => {
    return keranjang.reduce((total, item) => total + item.harga * item.jumlah, 0);
  };

  const getJumlahKeranjang = () => {
    return keranjang.reduce((jumlah, item) => jumlah + item.jumlah, 0);
  };

  return (
    <KeranjangContext.Provider
      value={{
        keranjang,
        tambahKeKeranjang,
        hapusDariKeranjang,
        updateJumlah,
        kosongkanKeranjang,
        getTotalKeranjang,
        getJumlahKeranjang,
      }}
    >
      {children}
    </KeranjangContext.Provider>
  );
}

export function useKeranjang() {
  const context = useContext(KeranjangContext);
  if (context === undefined) {
    throw new Error("useKeranjang harus digunakan dalam KeranjangProvider");
  }
  return context;
}
