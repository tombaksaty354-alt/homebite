"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaBox, FaShoppingCart, FaMoneyBillWave, FaChartLine,
  FaPlus, FaEdit, FaTrash, FaComments, FaFileInvoice
} from "react-icons/fa";

export default function MitraDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalProduk: 0,
    pesananBaru: 0,
    pesananDiproses: 0,
    pendapatanBulanIni: 0,
    ratingRata: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "mitra" && user.role !== "admin") {
        router.push("/");
      } else {
        fetchStats();
      }
    }
  }, [user, loading, router]);

  async function fetchStats() {
    if (!user) return;

    // Import supabase client
    const { supabase } = await import("@/context/AuthContext");
    if (!supabase) return;

    // Count products
    const { count: produkCount } = await supabase
      .from("produk")
      .select("*", { count: "exact", head: true })
      .eq("mitra_id", user.id);

    // Count orders by status
    const { count: baruCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("mitra_id", user.id)
      .eq("status", "menunggu_ongkir");

    const { count: prosesCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("mitra_id", user.id)
      .eq("status", "menunggu_pembayaran");

    // Calculate pendapatan bulan ini from orders that are "lunas" or "selesai"
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data: ordersLunas } = await supabase
      .from("orders")
      .select("total_bayar")
      .eq("mitra_id", user.id)
      .in("status", ["lunas", "selesai"])
      .gte("created_at", startOfMonth);

    const pendapatanBulanIni = ordersLunas?.reduce((sum: number, o: any) => sum + (o.total_bayar || 0), 0) || 0;

    // Calculate rating from reviews
    const { data: produkMitra } = await supabase
      .from("produk")
      .select("id")
      .eq("mitra_id", user.id);

    let ratingRata = 0;
    if (produkMitra && produkMitra.length > 0) {
      const produkIds = produkMitra.map((p: any) => p.id);
      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating")
        .in("produk_id", produkIds);

      if (reviews && reviews.length > 0) {
        ratingRata = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;
      }
    }

    // Recent orders
    const { data: orders } = await supabase
      .from("orders")
      .select("*")
      .eq("mitra_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    setStats({
      totalProduk: produkCount || 0,
      pesananBaru: baruCount || 0,
      pesananDiproses: prosesCount || 0,
      pendapatanBulanIni,
      ratingRata: Math.round(ratingRata * 10) / 10,
    });

    if (orders) setRecentOrders(orders);
  }

  if (loading) {
    return <div className="container py-5 text-center">Loading...</div>;
  }

  if (!user || user.role !== "mitra") {
    return null;
  }

  return (
    <section className="py-5" style={{ backgroundColor: "#f5f6fa" }}>
      <div className="container">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="fw-bold">Dashboard Mitra</h1>
            <p className="text-muted">Kelola produk, pesanan, dan laporan usaha Anda</p>
          </div>
          <Link href="/mitra-dashboard/produk" className="btn text-white" style={{ backgroundColor: "#e67e22" }}>
            <FaPlus className="me-2" />
            Tambah Produk
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div className="card shadow-sm border-primary">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <FaBox size={30} className="text-primary me-3" />
                  <div>
                    <h4 className="fw-bold mb-0">{stats.totalProduk}</h4>
                    <small className="text-muted">Produk Aktif</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card shadow-sm border-warning">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <FaShoppingCart size={30} className="text-warning me-3" />
                  <div>
                    <h4 className="fw-bold mb-0">{stats.pesananBaru}</h4>
                    <small className="text-muted">Pesanan Baru</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card shadow-sm border-info">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <FaChartLine size={30} className="text-info me-3" />
                  <div>
                    <h4 className="fw-bold mb-0">{stats.pesananDiproses}</h4>
                    <small className="text-muted">Menunggu Pembayaran</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card shadow-sm border-success">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <FaMoneyBillWave size={30} className="text-success me-3" />
                  <div>
                    <h4 className="fw-bold mb-0">Rp{stats.pendapatanBulanIni.toLocaleString("id-ID")}</h4>
                    <small className="text-muted">Pendapatan Bulan Ini</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links - Essential Only */}
        <div className="row mb-4">
          <div className="col-12">
            <h5 className="fw-bold mb-3">Menu Utama</h5>
          </div>
          <div className="col-md-3 mb-3">
            <Link href="/mitra-dashboard/produk" className="card shadow-sm h-100 text-decoration-none border-primary">
              <div className="card-body text-center">
                <FaBox size={40} className="text-primary mb-2" />
                <h6 className="fw-bold">Kelola Produk</h6>
                <small className="text-muted">Tambah, edit, hapus produk</small>
              </div>
            </Link>
          </div>
          <div className="col-md-3 mb-3">
            <Link href="/mitra-dashboard/pesanan" className="card shadow-sm h-100 text-decoration-none border-warning">
              <div className="card-body text-center">
                <FaShoppingCart size={40} className="text-warning mb-2" />
                <h6 className="fw-bold">Kelola Pesanan</h6>
                <small className="text-muted">Ongkir, bukti bayar, kirim</small>
              </div>
            </Link>
          </div>
          <div className="col-md-3 mb-3">
            <Link href="/mitra-dashboard/pencairan" className="card shadow-sm h-100 text-decoration-none border-success">
              <div className="card-body text-center">
                <FaMoneyBillWave size={40} className="text-success mb-2" />
                <h6 className="fw-bold">Pencairan Dana</h6>
                <small className="text-muted">Monitor status pencairan</small>
              </div>
            </Link>
          </div>
          <div className="col-md-3 mb-3">
            <Link href="/mitra-dashboard/laporan" className="card shadow-sm h-100 text-decoration-none border-info">
              <div className="card-body text-center">
                <FaFileInvoice size={40} className="text-info mb-2" />
                <h6 className="fw-bold">Laporan Keuangan</h6>
                <small className="text-muted">Pemasukan & pengeluaran</small>
              </div>
            </Link>
          </div>
          <div className="col-md-3 mb-3">
            <Link href="/chat" className="card shadow-sm h-100 text-decoration-none border-secondary">
              <div className="card-body text-center">
                <FaComments size={40} className="text-secondary mb-2" />
                <h6 className="fw-bold">Chat</h6>
                <small className="text-muted">Komunikasi dengan customer</small>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
