"use client";

import { useState, useEffect } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaMoneyBillWave, FaClock, FaCheckCircle, FaWallet, FaChartLine, FaDownload } from "react-icons/fa";

export default function MitraPencairanPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [saldo, setSaldo] = useState<any>(null);
  const [stats, setStats] = useState({
    totalSelesai: 0,
    totalPending: 0,
    totalPaid: 0,
    totalKomisi: 0,
    totalPayout: 0,
    saldoTersedia: 0,
    saldoPending: 0,
  });
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.role !== "mitra") router.push("/");
      else {
        fetchPencairanData();
        fetchSaldo();
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role === "mitra") {
      fetchPencairanData();
    }
  }, [filterStatus]);

  async function fetchPencairanData() {
    if (!supabase || !user) return;

    try {
      // Fetch all completed/paid orders for this mitra
      let query = supabase
        .from("orders")
        .select("*")
        .eq("mitra_id", user.id)
        .in("status", ["dikirim", "selesai"])
        .order("received_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      const allOrders = data || [];
      setOrders(allOrders);

      // Calculate stats
      const totalSelesai = allOrders.filter(o => o.status === "selesai").length;
      const totalPending = allOrders.filter(o => o.status_pencairan === "pending").length;
      const totalPaid = allOrders.filter(o => o.status_pencairan === "paid").length;
      const totalKomisi = allOrders.reduce((sum, o) => sum + (o.commission_amount || 0), 0);
      const totalPayout = allOrders.reduce((sum, o) => sum + (o.payout_amount || (o.total_bayar - (o.commission_amount || 0))), 0);

      setStats(prev => ({
        ...prev,
        totalSelesai,
        totalPending,
        totalPaid,
        totalKomisi,
        totalPayout,
      }));

    } catch (error) {
      console.error("Error fetching pencairan data:", error);
    }
  }

  async function fetchSaldo() {
    if (!supabase || !user) return;

    try {
      const { data, error } = await supabase
        .from("mitra_saldo")
        .select("*")
        .eq("mitra_id", user.id)
        .single();

      if (!error && data) {
        setSaldo(data);
        setStats(prev => ({
          ...prev,
          saldoTersedia: data.saldo_tersedia || 0,
          saldoPending: data.saldo_pending || 0,
        }));
      }
    } catch (error) {
      console.error("Error fetching saldo:", error);
    }
  }

  async function exportToCSV() {
    if (orders.length === 0) {
      alert("Tidak ada data untuk di-export");
      return;
    }

    let csv = "No Pesanan,Status,Pencairan,Total Bayar,Komisi,Dana Cair,Tanggal Selesai,Bukti Transfer Admin\n";

    orders.forEach((order, index) => {
      csv += `${order.nomor_pesanan},${order.status},${order.status_pencairan},${order.total_bayar},${order.commission_amount || 0},${order.payout_amount || (order.total_bayar - (order.commission_amount || 0))},${order.received_at ? new Date(order.received_at).toLocaleDateString('id-ID') : '-'},${order.admin_transfer_proof || '-'}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pencairan-dana-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  function formatRupiah(angka: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
  }

  if (loading) return <div className="container py-5 text-center">Loading...</div>;
  if (!user || user.role !== "mitra") return null;

  const filteredOrders = filterStatus === "all" 
    ? orders 
    : filterStatus === "pending" 
      ? orders.filter(o => o.status_pencairan === "pending")
      : orders.filter(o => o.status_pencairan === "paid");

  return (
    <section className="py-5 bg-light">
      <div className="container">
        <div className="mb-4">
          <Link href="/mitra-dashboard" className="btn btn-outline-secondary btn-sm mb-2">
            <FaArrowLeft className="me-1" /> Kembali
          </Link>
          <h2 className="fw-bold"><FaMoneyBillWave className="me-2" /> Pemantauan Pencairan Dana</h2>
          <p className="text-muted">
            Monitor status pencairan dana dari pesanan yang sudah selesai. Dana akan ditransfer ke rekening Anda setelah Admin memproses.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div className="card border-primary shadow-sm">
              <div className="card-body text-center">
                <FaWallet size={30} className="text-primary mb-2" />
                <h6 className="text-muted">Saldo Tersedia</h6>
                <h4 className="fw-bold text-primary">{formatRupiah(stats.saldoTersedia)}</h4>
                <small>Dana siap ditarik</small>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card border-warning shadow-sm">
              <div className="card-body text-center">
                <FaClock size={30} className="text-warning mb-2" />
                <h6 className="text-muted">Saldo Pending</h6>
                <h4 className="fw-bold text-warning">{formatRupiah(stats.saldoPending)}</h4>
                <small>Menunggu pencairan</small>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card border-success shadow-sm">
              <div className="card-body text-center">
                <FaCheckCircle size={30} className="text-success mb-2" />
                <h6 className="text-muted">Sudah Dicairkan</h6>
                <h4 className="fw-bold text-success">{stats.totalPaid}</h4>
                <small>Pesanan</small>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card border-info shadow-sm">
              <div className="card-body text-center">
                <FaChartLine size={30} className="text-info mb-2" />
                <h6 className="text-muted">Total Komisi</h6>
                <h4 className="fw-bold text-info">{formatRupiah(stats.totalKomisi)}</h4>
                <small>Rp500 × {Math.floor(stats.totalKomisi / 500)} item</small>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="card shadow-sm mb-4">
          <div className="card-body d-flex justify-content-between align-items-center">
            <div className="btn-group" role="group">
              <button
                className={`btn btn-sm ${filterStatus === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setFilterStatus("all")}
              >
                Semua ({orders.length})
              </button>
              <button
                className={`btn btn-sm ${filterStatus === 'pending' ? 'btn-warning' : 'btn-outline-secondary'}`}
                onClick={() => setFilterStatus("pending")}
              >
                <FaClock className="me-1" /> Menunggu ({stats.totalPending})
              </button>
              <button
                className={`btn btn-sm ${filterStatus === 'paid' ? 'btn-success' : 'btn-outline-secondary'}`}
                onClick={() => setFilterStatus("paid")}
              >
                <FaCheckCircle className="me-1" /> Dicairkan ({stats.totalPaid})
              </button>
            </div>
            <button className="btn btn-outline-primary" onClick={exportToCSV}>
              <FaDownload className="me-1" /> Export CSV
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="card shadow-sm">
          <div className="card-body">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <FaMoneyBillWave size={48} className="mb-3" />
                <h5>Tidak ada data pencairan</h5>
                <p className="mb-0">
                  {filterStatus === "pending"
                    ? "Semua dana sudah dicairkan"
                    : "Belum ada pesanan yang selesai"}
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>No Pesanan</th>
                      <th>Total Bayar</th>
                      <th>Komisi</th>
                      <th>Dana Cair</th>
                      <th>Status Pencairan</th>
                      <th>Tanggal Selesai</th>
                      <th>Bukti Transfer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <strong>{order.nomor_pesanan}</strong>
                        </td>
                        <td>{formatRupiah(order.total_bayar || 0)}</td>
                        <td className="text-warning">{formatRupiah(order.commission_amount || 0)}</td>
                        <td className="text-success fw-bold">
                          {formatRupiah(order.payout_amount || (order.total_bayar - (order.commission_amount || 0)))}
                        </td>
                        <td>
                          {order.status_pencairan === "pending" ? (
                            <span className="badge bg-warning text-dark">
                              <FaClock className="me-1" /> Menunggu
                            </span>
                          ) : (
                            <span className="badge bg-success">
                              <FaCheckCircle className="me-1" /> Dicairkan
                            </span>
                          )}
                        </td>
                        <td>
                          <small>
                            {order.received_at 
                              ? new Date(order.received_at).toLocaleDateString('id-ID') 
                              : order.created_at 
                                ? new Date(order.created_at).toLocaleDateString('id-ID')
                                : '-'}
                          </small>
                        </td>
                        <td>
                          {order.admin_transfer_proof ? (
                            <a 
                              href={order.admin_transfer_proof} 
                              target="_blank" 
                              rel="noreferrer"
                              className="btn btn-sm btn-outline-success"
                            >
                              <FaCheckCircle className="me-1" /> Lihat
                            </a>
                          ) : (
                            <span className="text-muted small">Belum ada</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    <tr className="table-light fw-bold">
                      <td colSpan={2}>TOTAL</td>
                      <td className="text-warning">{formatRupiah(stats.totalKomisi)}</td>
                      <td className="text-success">{formatRupiah(stats.totalPayout)}</td>
                      <td colSpan={3}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="card shadow-sm mt-4 border-info">
          <div className="card-body">
            <h6 className="fw-bold text-info"><FaChartLine className="me-2" /> Cara Kerja Pencairan Dana</h6>
            <ol className="small mb-2">
              <li><strong>Pesanan Selesai:</strong> Setelah pesanan selesai, dana masuk ke saldo pending Anda</li>
              <li><strong>Komisi Platform:</strong> Potongan Rp500 per item terjual</li>
              <li><strong>Admin Proses:</strong> Admin akan memverifikasi dan mentransfer dana ke rekening Anda</li>
              <li><strong>Bukti Transfer:</strong> Anda bisa melihat bukti transfer dari Admin di kolom "Bukti Transfer"</li>
              <li><strong>Saldo Tersedia:</strong> Dana yang sudah dicairkan masuk ke saldo tersedia Anda</li>
            </ol>
            <p className="small mb-0 text-muted">
              <strong>Catatan:</strong> Pastikan rekening Anda sudah terdaftar di halaman Pengaturan. Hubungi admin jika ada kendala.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
