export type MitraTier = "Silver" | "Gold" | "Platinum";

export interface TierInfo {
  id: number;
  nama: MitraTier;
  syaratTransaksi: number;
  syaratRating: number;
  komisi: number; // Rp500 per produk
}

export interface Mitra {
  id: string; // UUID from Supabase
  nama: string;
  tier: MitraTier;
  lokasi: string;
  deskripsi: string;
  rating: number;
  totalTransaksi: number;
  tanggalBergabung: string;
  avatar?: string;
  totalKomisiDibayar?: number;
}

export interface ProdukMakanan {
  id: string; // UUID from Supabase
  nama: string;
  harga: number;
  deskripsi: string;
  gambar: string;
  kategori: string;
  mitraId: string; // UUID
  mitraNama: string;
  mitraTier: MitraTier;
  rating?: number;
  tersedia: boolean;
  berat?: number;
  porsi?: string;
  totalTerjual?: number;
  komisiPerItem?: number;
  stok?: number;
}

export interface ItemKeranjang extends Omit<ProdukMakanan, 'id'> {
  id: string; // Keep as string for UUID
  jumlah: number;
}

export interface KeranjangContextType {
  keranjang: ItemKeranjang[];
  tambahKeKeranjang: (produk: ProdukMakanan) => void;
  hapusDariKeranjang: (produkId: string) => void;
  updateJumlah: (produkId: string, jumlah: number) => void;
  kosongkanKeranjang: () => void;
  getTotalKeranjang: () => number;
  getJumlahKeranjang: () => number;
}

export interface LaporanKeuangan {
  id: string;
  tanggal: string;
  pemasukan: number;
  pengeluaran: number;
  kategori: string;
  catatan: string;
}

export interface DashboardMitra {
  mitra: Mitra;
  totalPendapatan: number;
  totalPengeluaran: number;
  labaBersih: number;
  totalPesanan: number;
  laporanBulanan: LaporanBulanan[];
  produkTerlaris: ProdukTerlaris[];
}

export interface LaporanBulanan {
  bulan: string;
  pemasukan: number;
  pengeluaran: number;
  laba: number;
}

export interface ProdukTerlaris {
  nama: string;
  jumlahTerjual: number;
  pendapatan: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  produk_id: string;
  jumlah: number;
  harga_satuan: number;
  subtotal: number;
}

export interface Order {
  id: string;
  nomor_pesanan: string;
  customer_id: string;
  mitra_id: string;
  status: string;
  status_bukti?: string;
  subtotal_produk: number;
  ongkir: number;
  total_bayar: number;
  bukti_pembayaran?: string;
  pembayaran_metode?: string;
  created_at: string;
  paid_at?: string;
  received_at?: string;
}
