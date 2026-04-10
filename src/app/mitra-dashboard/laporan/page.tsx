"use client";

import { useState, useEffect } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
// Hapus import xlsx statis agar tidak memberatkan bundle awal
// import * as XLSX from 'xlsx'; 
import { FaPlus, FaDownload, FaMoneyBillWave, FaChartPie, FaArrowUp, FaArrowDown, FaFileExcel, FaTrash, FaSync } from "react-icons/fa";
import { FaHandHoldingDollar } from "react-icons/fa6";

export default function LaporanKeuangan() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // States
  const [activeTab, setActiveTab] = useState("ringkasan");
  const [filterBulan, setFilterBulan] = useState(new Date().toISOString().slice(0, 7));
  
  // Form States
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<"pemasukan" | "pengeluaran">("pemasukan");
  const [formData, setFormData] = useState({ tanggal: new Date().toISOString().slice(0, 10), kategori: "", jumlah: "", keterangan: "" });
  const [isSaving, setIsSaving] = useState(false);

  // Data States
  const [pemasukanData, setPemasukanData] = useState<any[]>([]);
  const [pengeluaranData, setPengeluaranData] = useState<any[]>([]);
  const [ordersData, setOrdersData] = useState<any[]>([]);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.role !== "mitra") router.push("/");
      else fetchData();
    }
  }, [user, loading, router, filterBulan]);

  async function fetchData() {
    if (!supabase || !user) return;

    // Tentukan rentang tanggal yang VALID
    const [year, month] = filterBulan.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1).toISOString(); // Tgl 1 bulan ini
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString(); // Hari terakhir bulan ini

    // 1. Ambil Penjualan Otomatis (Pesanan Lunas/Selesai)
    const { data: orders, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("mitra_id", user.id)
      .in("status", ["lunas", "selesai"])
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    if (orderError) console.error("Gagal ambil pesanan:", orderError);
    // console.log(`Pesanan Lunas/Selesai di periode ini: ${orders?.length || 0}`);
    
    if (orders && orders.length > 0) {
      // console.log("Detail pesanan:", orders.map(o => ({ id: o.id.slice(0,8), total: o.total_bayar, created: o.created_at })));
    }
    
    setOrdersData(orders || []);

    // 3. Ambil Pemasukan Manual
    const { data: pemasukan } = await supabase
      .from("pemasukan_mitra")
      .select("*")
      .eq("mitra_id", user.id)
      .gte("tanggal", startDate.slice(0, 10))
      .lte("tanggal", endDate.slice(0, 10))
      .order("tanggal", { ascending: false });
    if (pemasukan) setPemasukanData(pemasukan);

    // 4. Ambil Pengeluaran Manual
    const { data: pengeluaran } = await supabase
      .from("pengeluaran_mitra")
      .select("*")
      .eq("mitra_id", user.id)
      .gte("tanggal", startDate.slice(0, 10))
      .lte("tanggal", endDate.slice(0, 10))
      .order("tanggal", { ascending: false });
    if (pengeluaran) setPengeluaranData(pengeluaran);
    
    // console.log("=== SELESAI FETCH DATA ===");
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !user) return;
    setIsSaving(true);

    const dataToSave = {
      mitra_id: user.id,
      tanggal: formData.tanggal,
      kategori: formData.kategori,
      jumlah: parseInt(formData.jumlah),
      keterangan: formData.keterangan,
    };

    const table = formType === "pemasukan" ? "pemasukan_mitra" : "pengeluaran_mitra";
    const { error } = await supabase.from(table).insert(dataToSave);

    if (!error) {
      alert("✅ Data berhasil disimpan!");
      setShowForm(false);
      fetchData();
    } else {
      alert("Gagal: " + error.message);
    }
    setIsSaving(false);
  }

  async function handleDelete(id: string, type: string) {
    if (!confirm("Hapus data ini?")) return;
    if (!supabase) return;
    const table = type === "pemasukan" ? "pemasukan_mitra" : "pengeluaran_mitra";
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (!error) fetchData();
  }

  // Hitung Ringkasan
  const totalPenjualan = ordersData.reduce((sum, o) => sum + (o.total_bayar || 0), 0);
  const totalPemasukanLain = pemasukanData.reduce((sum, p) => sum + p.jumlah, 0);
  const totalPengeluaran = pengeluaranData.reduce((sum, p) => sum + p.jumlah, 0);
  const totalHpp = ordersData.reduce((sum, o) => sum + (o.komisi_dipotong || 0), 0); 
  
  const labaKotor = totalPenjualan - totalHpp;
  const labaBersih = labaKotor + totalPemasukanLain - totalPengeluaran;

  // Export to Excel (Lazy Loading)
  async function exportToExcel() {
    // Import library hanya saat dibutuhkan
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Laba Rugi
    const lrData = [
      ["LAPORAN LABA RUGI"],
      [`Periode: ${filterBulan}`],
      [],
      ["PENDAPATAN USAHA"],
      ["Penjualan Produk (Otomatis)", totalPenjualan],
      [],
      ["HARGA POKOK PENJUALAN (HPP)"],
      ["Biaya Komisi Platform (Bulanan)", -totalHpp],
      [],
      ["LABA KOTOR", labaKotor],
      [],
      ["PEMASUKAN LAINNYA"],
      ...pemasukanData.map(p => [p.kategori || "Lainnya", p.jumlah]),
      [],
      ["PENGELUARAN OPERASIONAL"],
      ...pengeluaranData.map(p => [p.kategori || "Lainnya", -p.jumlah]),
      [],
      ["LABA BERSIH", labaBersih]
    ];
    const lrWs = XLSX.utils.aoa_to_sheet(lrData);
    XLSX.utils.book_append_sheet(wb, lrWs, "Laba Rugi");

    // Sheet 2: Neraca Sederhana
    const neracaData = [
      ["NERACA SEDERHANA"],
      [`Periode: ${filterBulan}`],
      [],
      ["ASET (HARTA)"],
      ["Kas / Bank (Estimasi dari Laba Bersih)", labaBersih],
      ["Total Aset", labaBersih],
      [],
      ["KEWAJIBAN & MODAL"],
      ["Kewajiban (Utang)", 0],
      ["Modal Awal", 0],
      ["Laba Periode Ini", labaBersih],
      ["Total Kewajiban & Modal", labaBersih]
    ];
    const neracaWs = XLSX.utils.aoa_to_sheet(neracaData);
    XLSX.utils.book_append_sheet(wb, neracaWs, "Neraca");

    // Sheet 3: Detail Transaksi
    const detailData = [
      ["TANGGAL", "JENIS", "KATEGORI", "KETERANGAN", "JUMLAH (Rp)"],
      ...ordersData.map(o => [new Date(o.created_at).toLocaleDateString(), "Penjualan", "Produk", o.nomor_pesanan, o.total_bayar]),
      ...pemasukanData.map(p => [p.tanggal, "Pemasukan", p.kategori, p.keterangan, p.jumlah]),
      ...pengeluaranData.map(p => [p.tanggal, "Pengeluaran", p.kategori, p.keterangan, -p.jumlah]),
    ];
    const detailWs = XLSX.utils.aoa_to_sheet(detailData);
    XLSX.utils.book_append_sheet(wb, detailWs, "Detail Transaksi");

    XLSX.writeFile(wb, `Laporan_Keuangan_Homebite_${filterBulan}.xlsx`);
  }

  function formatRupiah(angka: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
  }

  if (loading) return <div className="container py-5 text-center">Loading...</div>;
  if (!user || user.role !== "mitra") return null;

  return (
    <section className="py-5 bg-light">
      <div className="container">
        <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h2 className="fw-bold mb-0"><FaFileExcel className="me-2" /> Laporan Keuangan</h2>
            <p className="text-muted mb-0">Pantau arus kas dan profitabilitas usaha Anda</p>
          </div>
          <div className="d-flex gap-2">
            <input type="month" className="form-control" value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} />
            <button className="btn btn-outline-secondary" onClick={fetchData}><FaSync className="me-1" /> Refresh</button>
            <button className="btn btn-success" onClick={() => exportToExcel()}><FaDownload className="me-2" /> Export Excel</button>
            <button className="btn text-white" style={{ backgroundColor: "#e67e22" }} onClick={() => { setShowForm(true); setFormType("pengeluaran"); }}><FaPlus className="me-2" /> Catat Pengeluaran</button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="row mb-4">
          <div className="col-md-4 mb-3">
            <div className="card border-success shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="text-muted mb-0">Pendapatan Penjualan (Otomatis)</h6>
                  <FaMoneyBillWave size={24} className="text-success" />
                </div>
                <h3 className="fw-bold text-success">{formatRupiah(totalPenjualan)}</h3>
                <small className="text-muted">Dari {ordersData.length} pesanan Lunas/Selesai</small>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card border-danger shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="text-muted mb-0">Total Pengeluaran (Manual)</h6>
                  <FaArrowDown size={24} className="text-danger" />
                </div>
                <h3 className="fw-bold text-danger">{formatRupiah(totalPengeluaran)}</h3>
                <small className="text-muted">Dari {pengeluaranData.length} catatan</small>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card shadow-sm h-100" style={{ borderTop: '4px solid #e67e22' }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="text-muted mb-0">Laba Bersih</h6>
                  <FaChartPie size={24} style={{ color: '#e67e22' }} />
                </div>
                <h3 className="fw-bold" style={{ color: '#e67e22' }}>{formatRupiah(labaBersih)}</h3>
                <small className="text-muted">Pendapatan - (HPP + Pengeluaran)</small>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item"><button className={`nav-link ${activeTab === 'ringkasan' ? 'active' : ''}`} onClick={() => setActiveTab('ringkasan')}>📝 Detail Transaksi</button></li>
          <li className="nav-item"><button className={`nav-link ${activeTab === 'labarugi' ? 'active' : ''}`} onClick={() => setActiveTab('labarugi')}>📊 Laporan Laba Rugi</button></li>
          <li className="nav-item"><button className={`nav-link ${activeTab === 'neraca' ? 'active' : ''}`} onClick={() => setActiveTab('neraca')}>🏦 Neraca Sederhana</button></li>
        </ul>

        {activeTab === 'ringkasan' && (
          <div className="card shadow-sm">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Tanggal</th>
                      <th>Jenis</th>
                      <th>Kategori</th>
                      <th>Keterangan</th>
                      <th className="text-end">Jumlah</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* List Penjualan */}
                    {ordersData.map((o, i) => (
                      <tr key={`ord-${i}`}>
                        <td>{new Date(o.created_at).toLocaleDateString()}</td>
                        <td><span className="badge bg-success">Penjualan</span></td>
                        <td>Pesanan #{o.nomor_pesanan.split('-').pop()}</td>
                        <td>{o.catatan_customer || "-"}</td>
                        <td className="text-end text-success fw-bold">{formatRupiah(o.total_bayar)}</td>
                        <td></td>
                      </tr>
                    ))}
                    {/* List Pemasukan Manual */}
                    {pemasukanData.map((p) => (
                      <tr key={`inc-${p.id}`}>
                        <td>{p.tanggal}</td>
                        <td><span className="badge bg-primary">Pemasukan</span></td>
                        <td>{p.kategori}</td>
                        <td>{p.keterangan}</td>
                        <td className="text-end text-success fw-bold">{formatRupiah(p.jumlah)}</td>
                        <td><button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p.id, "pemasukan")}><FaTrash /></button></td>
                      </tr>
                    ))}
                    {/* List Pengeluaran */}
                    {pengeluaranData.map((p) => (
                      <tr key={`exp-${p.id}`}>
                        <td>{p.tanggal}</td>
                        <td><span className="badge bg-danger">Pengeluaran</span></td>
                        <td>{p.kategori}</td>
                        <td>{p.keterangan}</td>
                        <td className="text-end text-danger fw-bold">-{formatRupiah(p.jumlah)}</td>
                        <td><button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p.id, "pengeluaran")}><FaTrash /></button></td>
                      </tr>
                    ))}
                    {ordersData.length === 0 && pemasukanData.length === 0 && pengeluaranData.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-5 text-muted">Belum ada transaksi pada periode ini</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'labarugi' && (
          <div className="card shadow-sm">
            <div className="card-body p-5">
              <h3 className="text-center fw-bold mb-4">LAPORAN LABA RUGI</h3>
              <p className="text-center text-muted mb-4">Periode: {filterBulan}</p>
              <table className="table table-borderless">
                <tbody>
                  <tr className="fw-bold bg-light"><td>PENDAPATAN USAHA</td><td></td></tr>
                  <tr><td className="ps-4">Penjualan Produk</td><td className="text-end fw-bold">{formatRupiah(totalPenjualan)}</td></tr>
                  <tr className="fw-bold bg-light"><td>HARGA POKOK PENJUALAN (HPP)</td><td></td></tr>
                  <tr><td className="ps-4">Biaya Komisi Platform (Bulanan)</td><td className="text-end text-danger">-{formatRupiah(totalHpp)}</td></tr>
                  <tr className="fw-bold fs-5 border-top border-bottom"><td>LABA KOTOR</td><td className="text-end">{formatRupiah(labaKotor)}</td></tr>
                  
                  <tr className="fw-bold bg-light mt-3"><td className="pt-3">PEMASUKAN LAINNYA</td><td></td></tr>
                  {pemasukanData.length === 0 ? <tr><td colSpan={2} className="ps-4 text-muted">Tidak ada data</td></tr> : 
                    pemasukanData.map(p => <tr key={p.id}><td className="ps-4">{p.kategori}</td><td className="text-end fw-bold">{formatRupiah(p.jumlah)}</td></tr>)}
                  <tr className="fw-bold"><td>Total Pemasukan Lain</td><td className="text-end">{formatRupiah(totalPemasukanLain)}</td></tr>

                  <tr className="fw-bold bg-light mt-3"><td className="pt-3">PENGELUARAN OPERASIONAL</td><td></td></tr>
                  {pengeluaranData.length === 0 ? <tr><td colSpan={2} className="ps-4 text-muted">Tidak ada data</td></tr> : 
                    pengeluaranData.map(p => <tr key={p.id}><td className="ps-4">{p.kategori}</td><td className="text-end text-danger">-{formatRupiah(p.jumlah)}</td></tr>)}
                  <tr className="fw-bold"><td>Total Pengeluaran</td><td className="text-end text-danger">-{formatRupiah(totalPengeluaran)}</td></tr>

                  <tr className={`fw-bold fs-4 border-top border-bottom ${labaBersih >= 0 ? 'text-success' : 'text-danger'}`}><td className="py-3">LABA / (RUGI) BERSIH</td><td className="text-end py-3">{formatRupiah(labaBersih)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'neraca' && (
          <div className="card shadow-sm">
            <div className="card-body p-5">
              <h3 className="text-center fw-bold mb-4">NERACA SEDERHANA</h3>
              <p className="text-center text-muted mb-4">Periode: {filterBulan}</p>
              <div className="row">
                <div className="col-md-6 border-end">
                  <h5 className="fw-bold text-success mb-3">ASET (HARTA)</h5>
                  <table className="table table-sm">
                    <tbody>
                      <tr><td>Kas / Saldo Usaha (Estimasi)</td><td className="text-end fw-bold">{formatRupiah(labaBersih)}</td></tr>
                      <tr className="fw-bold border-top"><td>Total Aset</td><td className="text-end">{formatRupiah(labaBersih)}</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="col-md-6">
                  <h5 className="fw-bold text-danger mb-3">KEWAJIBAN & MODAL</h5>
                  <table className="table table-sm">
                    <tbody>
                      <tr><td>Kewajiban (Utang Dagang)</td><td className="text-end fw-bold">Rp0</td></tr>
                      <tr><td>Modal Awal</td><td className="text-end">-</td></tr>
                      <tr><td>Laba Periode Ini</td><td className="text-end fw-bold">{formatRupiah(labaBersih)}</td></tr>
                      <tr className="fw-bold border-top"><td>Total Kewajiban & Modal</td><td className="text-end">{formatRupiah(labaBersih)}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="alert alert-info small mt-4">
                ℹ️ <strong>Catatan:</strong> Neraca ini disederhanakan berdasarkan data transaksi di sistem.
              </div>
            </div>
          </div>
        )}

        {/* Modal Form Input */}
        {showForm && (
          <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Catat {formType === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleFormSubmit}>
                    <div className="mb-3">
                      <label className="form-label">Tanggal</label>
                      <input type="date" className="form-control" value={formData.tanggal} onChange={(e) => setFormData({...formData, tanggal: e.target.value})} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Kategori</label>
                      <select className="form-select" value={formData.kategori} onChange={(e) => setFormData({...formData, kategori: e.target.value})} required>
                        <option value="">-- Pilih Kategori --</option>
                        {formType === 'pemasukan' ? (
                          <><option value="Pendapatan Jasa">Pendapatan Jasa</option><option value="Lainnya">Lainnya</option></>
                        ) : (
                          <><option value="Bahan Baku">Bahan Baku</option><option value="Gaji">Gaji</option><option value="Operasional">Operasional</option><option value="Lainnya">Lainnya</option></>
                        )}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Jumlah (Rp)</label>
                      <input type="number" className="form-control" value={formData.jumlah} onChange={(e) => setFormData({...formData, jumlah: e.target.value})} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Keterangan</label>
                      <textarea className="form-control" rows={2} value={formData.keterangan} onChange={(e) => setFormData({...formData, keterangan: e.target.value})}></textarea>
                    </div>
                    <button type="submit" className="btn btn-success w-100" disabled={isSaving}>{isSaving ? "Menyimpan..." : "Simpan Data"}</button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
