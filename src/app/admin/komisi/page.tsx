"use client";

import { useState, useEffect } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaMoneyBillWave, FaChartLine, FaDownload, FaFilter, FaUsers } from "react-icons/fa";

export default function AdminKomisiPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalKomisi: 0,
    totalPesananSelesai: 0,
    totalItemTerjual: 0,
    totalPayout: 0,
    komisiPerMitra: [] as any[],
  });
  const [filterStatus, setFilterStatus] = useState("all"); // all, pending, paid

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.role !== "admin") router.push("/");
      else fetchKomisi();
    }
  }, [user, loading, router]);

  async function fetchKomisi() {
    if (!supabase || !user) return;

    try {
      // Fetch completed orders with commission data
      let query = supabase
        .from("orders")
        .select(`
          *,
          customer:customer_id(nama),
          mitra:mitra_id(nama, email)
        `)
        .eq("status", "selesai")
        .order("received_at", { ascending: false });

      const { data, error } = await query;

      if (error || !data) return;

      setOrders(data);

      // Calculate stats
      const totalKomisi = data.reduce((sum, o) => sum + (o.commission_amount || 0), 0);
      const totalPayout = data.reduce((sum, o) => sum + (o.payout_amount || 0), 0);
      const totalItem = data.reduce((sum, o) => {
        // Estimate items from commission (Rp500 per item)
        return sum + Math.floor((o.commission_amount || 0) / 500);
      }, 0);

      // Group by mitra
      const mitraMap: Record<string, any> = {};
      data.forEach(order => {
        const mitraId = order.mitra_id;
        if (!mitraMap[mitraId]) {
          mitraMap[mitraId] = {
            mitra_id: mitraId,
            mitra_name: order.mitra?.nama || '-',
            mitra_email: order.mitra?.email || '-',
            total_orders: 0,
            total_items: 0,
            total_komisi: 0,
            total_payout: 0,
            pending_payout: 0,
            paid_payout: 0,
          };
        }
        
        mitraMap[mitraId].total_orders += 1;
        mitraMap[mitraId].total_items += Math.floor((order.commission_amount || 0) / 500);
        mitraMap[mitraId].total_komisi += order.commission_amount || 0;
        mitraMap[mitraId].total_payout += order.payout_amount || 0;
        
        if (order.status_pencairan === 'pending') {
          mitraMap[mitraId].pending_payout += order.payout_amount || 0;
        } else {
          mitraMap[mitraId].paid_payout += order.payout_amount || 0;
        }
      });

      setStats({
        totalKomisi,
        totalPesananSelesai: data.length,
        totalItemTerjual: totalItem,
        totalPayout: totalPayout,
        komisiPerMitra: Object.values(mitraMap).sort((a, b) => b.total_komisi - a.total_komisi),
      });

    } catch (error) {
      console.error("Error fetching komisi:", error);
    }
  }

  function formatRupiah(angka: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
  }

  async function exportToCSV() {
    if (orders.length === 0) {
      alert("Tidak ada data untuk di-export");
      return;
    }

    let csv = "No Pesanan,Customer,Mitra,Total Bayar,Komisi (Rp500/item),Dana Cair,Tanggal Selesai,Status Pencairan\n";
    
    orders.forEach((order, index) => {
      csv += `${order.nomor_pesanan},${order.customer?.nama || '-'},${order.mitra?.nama || '-'},${order.total_bayar},${order.commission_amount},${order.payout_amount},${new Date(order.received_at).toLocaleDateString('id-ID')},${order.status_pencairan}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `komisi-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  if (loading) return <div className="container py-5 text-center">Loading...</div>;
  if (!user || user.role !== "admin") return null;

  return (
    <section className="py-5 bg-light">
      <div className="container">
        <div className="mb-4">
          <Link href="/admin" className="btn btn-outline-secondary btn-sm mb-2">
            <FaArrowLeft className="me-1" /> Kembali
          </Link>
          <h2 className="fw-bold"><FaMoneyBillWave className="me-2" /> Rekap Komisi Platform</h2>
          <p className="text-muted">
            Komisi otomatis Rp500 per item terjual. Dipotong saat payout ke mitra.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div className="card border-primary shadow-sm">
              <div className="card-body text-center">
                <FaMoneyBillWave size={30} className="text-primary mb-2" />
                <h6 className="text-muted">Total Komisi Platform</h6>
                <h3 className="fw-bold text-primary">{formatRupiah(stats.totalKomisi)}</h3>
                <small>Rp500 × {stats.totalItemTerjual} item</small>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card border-success shadow-sm">
              <div className="card-body text-center">
                <FaChartLine size={30} className="text-success mb-2" />
                <h6 className="text-muted">Total Dana Cair ke Mitra</h6>
                <h3 className="fw-bold text-success">{formatRupiah(stats.totalPayout)}</h3>
                <small>{stats.totalPesananSelesai} pesanan selesai</small>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card border-info shadow-sm">
              <div className="card-body text-center">
                <FaUsers size={30} className="text-info mb-2" />
                <h6 className="text-muted">Total Mitra Aktif</h6>
                <h3 className="fw-bold text-info">{stats.komisiPerMitra.length}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card border-warning shadow-sm">
              <div className="card-body text-center">
                <FaDownload size={30} className="text-warning mb-2" />
                <h6 className="text-muted">Export Data</h6>
                <button className="btn btn-sm btn-warning" onClick={exportToCSV}>
                  <FaDownload className="me-1" /> Download CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Komisi Per Mitra */}
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0"><FaUsers className="me-2" /> Komisi per Mitra</h5>
          </div>
          <div className="card-body">
            {stats.komisiPerMitra.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <p className="mb-0">Belum ada data komisi</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Mitra</th>
                      <th>Email</th>
                      <th>Total Pesanan</th>
                      <th>Total Item</th>
                      <th>Total Komisi</th>
                      <th>Menunggu Payout</th>
                      <th>Sudah Cair</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.komisiPerMitra.map((mitra, i) => (
                      <tr key={mitra.mitra_id}>
                        <td><strong>{mitra.mitra_name}</strong></td>
                        <td>{mitra.mitra_email || '-'}</td>
                        <td>{mitra.total_orders}</td>
                        <td>{mitra.total_items}</td>
                        <td className="text-primary fw-bold">{formatRupiah(mitra.total_komisi)}</td>
                        <td className="text-warning">{formatRupiah(mitra.pending_payout)}</td>
                        <td className="text-success">{formatRupiah(mitra.paid_payout)}</td>
                      </tr>
                    ))}
                    <tr className="table-light fw-bold">
                      <td colSpan={4}>TOTAL</td>
                      <td className="text-primary">{formatRupiah(stats.totalKomisi)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Detail Orders */}
        <div className="card shadow-sm">
          <div className="card-header bg-white">
            <h5 className="mb-0">📋 Detail Pesanan Selesai</h5>
          </div>
          <div className="card-body">
            {orders.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <p className="mb-0">Belum ada pesanan selesai</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>No Pesanan</th>
                      <th>Customer</th>
                      <th>Mitra</th>
                      <th>Total Bayar</th>
                      <th>Komisi</th>
                      <th>Dana Cair</th>
                      <th>Status</th>
                      <th>Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td><strong>{order.nomor_pesanan}</strong></td>
                        <td>{order.customer?.nama || '-'}</td>
                        <td>{order.mitra?.nama || '-'}</td>
                        <td>{formatRupiah(order.total_bayar || 0)}</td>
                        <td className="text-primary">{formatRupiah(order.commission_amount || 0)}</td>
                        <td className="text-success">{formatRupiah(order.payout_amount || 0)}</td>
                        <td>
                          {order.status_pencairan === 'pending' ? (
                            <span className="badge bg-warning text-dark">Menunggu</span>
                          ) : (
                            <span className="badge bg-success">Cair</span>
                          )}
                        </td>
                        <td>
                          <small>{new Date(order.received_at).toLocaleDateString('id-ID')}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="card shadow-sm mt-4 border-info">
          <div className="card-body">
            <h6 className="fw-bold text-info">ℹ️ Info Komisi</h6>
            <p className="small mb-2">
              <strong>Komisi Platform:</strong> Rp500 per item terjual
            </p>
            <p className="small mb-2">
              <strong>Perhitungan:</strong> Komisi otomatis dihitung saat pesanan selesai (customer konfirmasi atau auto-complete 3 hari)
            </p>
            <p className="small mb-2">
              <strong>Payout:</strong> Dana masuk ke saldo mitra (total - komisi). Admin melakukan pencairan manual via transfer bank.
            </p>
            <p className="small mb-0">
              <strong>Export CSV:</strong> Download laporan komisi untuk audit & akuntansi platform.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
