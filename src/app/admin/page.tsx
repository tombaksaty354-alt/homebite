"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';

// Lazy load chart to reduce bundle size by ~200KB
const Bar = dynamic(() => import('react-chartjs-2').then((mod) => {
  // Register ChartJS components
  const { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } = require('chart.js');
  Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
  return mod.Bar;
}), { ssr: false, loading: () => <div className="text-center p-4">Loading chart...</div> });

import { useAuth, supabase } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { FaUsers, FaUserCheck, FaUserClock, FaClipboardList, FaChartBar, FaCheck, FaTimes, FaEye, FaCalendarAlt, FaMoneyBillWave } from "react-icons/fa";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("approval");
  const [pendingMitras, setPendingMitras] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filterPeriod, setFilterPeriod] = useState("7");

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.role !== "admin") router.push("/");
      else fetchData();
    }
  }, [user, loading, router]);

  async function fetchData() {
    fetchMitras();
    if (activeTab === "orders") fetchOrders();
    if (activeTab === "stats") fetchStats();
  }

  async function fetchMitras() {
    if (!supabase) return;
    const { data } = await supabase
      .from("calon_mitra_applications")
      .select("*")
      .eq("status", "pending")
      .order("tanggal_daftar", { ascending: false });
    if (data) setPendingMitras(data);
  }

  async function fetchOrders() {
    const res = await fetch(`/api/admin/data?type=orders`);
    const json = await res.json();
    if (json.success) setOrders(json.data);
  }

  async function fetchStats() {
    const res = await fetch(`/api/admin/data?type=stats&period=${filterPeriod}`);
    const json = await res.json();
    if (json.success) setStats(json.data);
  }

  useEffect(() => {
    if (activeTab === "orders" && orders.length === 0) fetchOrders();
    if (activeTab === "stats") fetchStats();
  }, [activeTab, filterPeriod]);

  async function approveMitra(calon: any) {
    setProcessing(calon.id);
    try {
      const res = await fetch('/api/admin/approve-mitra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: calon.email,
          password: calon.password || 'Homebite123',
          nama: calon.nama,
          telepon: calon.telepon,
          kota: calon.kota,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Update application status via API
      await fetch('/api/admin/approve-mitra', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: calon.id,
          status: 'diterima',
          catatan_admin: 'Disetujui Admin'
        }),
      });

      alert("✅ Mitra berhasil disetujui!");
      fetchMitras();
    } catch (error: any) {
      alert("Error: " + error.message);
    }
    setProcessing(null);
  }

  async function rejectMitra(id: string) {
    if (!confirm("Tolak pendaftaran ini?")) return;
    setProcessing(id);
    
    const updateRes = await fetch('/api/admin/approve-mitra', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: id,
        status: 'ditolak'
      }),
    });

    if (!updateRes.ok) {
      alert("Gagal menolak aplikasi");
    }
    
    fetchMitras();
    setProcessing(null);
  }

  if (loading) return <div className="container py-5 text-center">Loading...</div>;
  if (!user || user.role !== "admin") return null;

  const chartData = {
    labels: stats.map(s => s.nama),
    datasets: [{
      label: 'Pendapatan (Lunas/Selesai)',
      data: stats.map(s => s.totalPendapatan),
      backgroundColor: '#e67e22',
    }, {
      label: 'Jumlah Order',
      data: stats.map(s => s.totalOrder),
      backgroundColor: '#2c3e50',
    }]
  };

  return (
    <section className="py-5 bg-light">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold">🛡️ Admin Dashboard</h2>
          <div className="btn-group">
            <button className={`btn ${activeTab === 'approval' ? 'btn-warning' : 'btn-outline-secondary'}`} onClick={() => setActiveTab('approval')}>Persetujuan Mitra</button>
            <button className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setActiveTab('orders')}>Rekap Pesanan</button>
            <button className={`btn ${activeTab === 'stats' ? 'btn-success' : 'btn-outline-secondary'}`} onClick={() => setActiveTab('stats')}>Statistik</button>
            <Link href="/admin/payment-approval" className="btn btn-outline-warning">
              <FaMoneyBillWave className="me-1" /> Konfirmasi Pembayaran
            </Link>
            <Link href="/admin/payout" className="btn btn-outline-success">💸 Pencairan Dana</Link>
            <Link href="/admin/platform-rekening" className="btn btn-outline-primary">🏦 Rekening Platform</Link>
            <Link href="/admin/refund" className="btn btn-outline-danger">🔄 Refund</Link>
            <Link href="/admin/pengaturan" className="btn btn-outline-dark">⚙️ Pengaturan</Link>
          </div>
        </div>

        {/* TAB 1: APPROVAL */}
        {activeTab === 'approval' && (
          <div>
            <h4 className="mb-3">Pendaftaran Menunggu ({pendingMitras.length})</h4>
            {pendingMitras.length === 0 ? <p className="text-muted">Tidak ada pendaftaran baru.</p> : (
              pendingMitras.map(c => (
                <div key={c.id} className="card mb-3 border-start border-warning border-4">
                  <div className="card-body">
                    <h5 className="fw-bold">{c.nama}</h5>
                    <p className="mb-1">📧 {c.email} | 📱 {c.telepon}</p>
                    <p className="mb-1">🏪 {c.nama_usaha} ({c.jenis_makanan})</p>
                    <p className="mb-3">📍 {c.kota}</p>
                    <div className="d-flex gap-2">
                      <button className="btn btn-success" onClick={() => approveMitra(c)} disabled={processing === c.id}>
                        <FaCheck className="me-1" /> Setujui
                      </button>
                      <button className="btn btn-danger" onClick={() => rejectMitra(c.id)} disabled={processing === c.id}>
                        <FaTimes className="me-1" /> Tolak
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: REKAP PESANAN */}
        {activeTab === 'orders' && (
          <div className="card shadow-sm">
            <div className="card-body">
              <h4 className="fw-bold mb-3"><FaClipboardList className="me-2" /> Semua Pesanan Masuk</h4>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>No. Pesanan</th>
                      <th>Customer</th>
                      <th>Mitra</th>
                      <th>Total Bayar</th>
                      <th>Status</th>
                      <th>Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id}>
                        <td className="fw-bold">{o.nomor_pesanan}</td>
                        <td>{o.customer?.nama || 'N/A'}</td>
                        <td>{o.mitra?.nama || 'N/A'}</td>
                        <td>Rp{(o.total_bayar || 0).toLocaleString("id-ID")}</td>
                        <td>
                          <span className={`badge ${
                            o.status === 'menunggu_ongkir' ? 'bg-warning text-dark' :
                            o.status === 'menunggu_pembayaran' ? 'bg-info' :
                            o.status === 'lunas' ? 'bg-success' : 'bg-secondary'
                          }`}>{o.status.replace(/_/g, " ")}</span>
                        </td>
                        <td>{new Date(o.created_at).toLocaleDateString("id-ID")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STATISTIK */}
        {activeTab === 'stats' && (
          <div>
            <div className="card shadow-sm mb-4">
              <div className="card-body d-flex justify-content-between align-items-center">
                <h4 className="fw-bold mb-0"><FaChartBar className="me-2" /> Kinerja Mitra</h4>
                <div className="d-flex align-items-center gap-2">
                  <FaCalendarAlt className="text-muted" />
                  <select className="form-select form-select-sm" value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}>
                    <option value="7">7 Hari Terakhir</option>
                    <option value="30">30 Hari (1 Bulan)</option>
                    <option value="90">3 Bulan</option>
                  </select>
                </div>
              </div>
            </div>
            
            {stats.length > 0 ? (
              <div className="card shadow-sm mb-4">
                <div className="card-body">
                  <Bar data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
                </div>
              </div>
            ) : (
              <p className="text-center text-muted py-5">Belum ada data pesanan untuk periode ini.</p>
            )}

            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="fw-bold mb-3">Tabel Detail Mitra</h5>
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Mitra</th>
                      <th>Total Order</th>
                      <th>Pendapatan (Lunas/Selesai)</th>
                      <th>Order Selesai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map((s, i) => (
                      <tr key={i}>
                        <td className="fw-bold">{s.nama}</td>
                        <td>{s.totalOrder}</td>
                        <td className="text-success fw-bold">Rp{s.totalPendapatan.toLocaleString("id-ID")}</td>
                        <td>{s.orderSelesai}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
