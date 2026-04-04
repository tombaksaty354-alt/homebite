"use client";

import { useState, useEffect } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { FaSave, FaArrowLeft, FaPlus, FaTrash, FaCheckCircle } from "react-icons/fa";

interface Rekening {
  id: string;
  bank: string;
  nomor: string;
  nama: string;
  is_primary: boolean;
}

export default function PengaturanMitra() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ bank: "", nomor: "", nama: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [rekeningList, setRekeningList] = useState<Rekening[]>([]);
  const [isLoadingRekening, setIsLoadingRekening] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.role !== "mitra") router.push("/");
      else {
        fetchRekeningList();
      }
    }
  }, [user, loading, router]);

  async function fetchRekeningList() {
    if (!supabase || !user) return;
    
    setIsLoadingRekening(true);
    const { data, error } = await supabase
      .from("rekening_mitra")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRekeningList(data);
    }
    setIsLoadingRekening(false);
  }

  const handleAddRekening = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    if (!supabase || !user) { 
      alert("Supabase tidak tersedia"); 
      setIsSaving(false); 
      return; 
    }

    // Check if this is the first rekening
    const isPrimary = rekeningList.length === 0;

    const { error } = await supabase
      .from("rekening_mitra")
      .insert({
        user_id: user.id,
        bank: form.bank,
        nomor: form.nomor,
        nama: form.nama,
        is_primary: isPrimary,
      });

    setIsSaving(false);
    if (!error) {
      alert("✅ Rekening berhasil ditambahkan!");
      setForm({ bank: "", nomor: "", nama: "" });
      fetchRekeningList();
    } else {
      alert("Gagal: " + error.message);
    }
  };

  const handleSetPrimary = async (rekeningId: string) => {
    if (!supabase) return;

    // Set all to non-primary
    await supabase
      .from("rekening_mitra")
      .update({ is_primary: false })
      .eq("user_id", user?.id);

    // Set selected to primary
    const { error } = await supabase
      .from("rekening_mitra")
      .update({ is_primary: true })
      .eq("id", rekeningId);

    if (!error) {
      fetchRekeningList();
    }
  };

  const handleDeleteRekening = async (rekeningId: string) => {
    if (!supabase) return;
    
    if (!confirm("Yakin ingin menghapus rekening ini?")) return;

    const { error } = await supabase
      .from("rekening_mitra")
      .delete()
      .eq("id", rekeningId);

    if (!error) {
      alert("✅ Rekening berhasil dihapus");
      fetchRekeningList();
    } else {
      alert("Gagal: " + error.message);
    }
  };

  if (loading) return <div className="container py-5 text-center">Loading...</div>;
  if (!user || user.role !== "mitra") return null;

  return (
    <section className="py-5 bg-light">
      <div className="container">
        <button className="btn btn-outline-secondary btn-sm mb-3" onClick={() => router.push("/mitra-dashboard")}>
          <FaArrowLeft className="me-1" /> Kembali
        </button>
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body p-4">
                <h3 className="fw-bold mb-2">🏦 Pengaturan Rekening Pencairan</h3>
                <p className="text-muted mb-4">Dana dari pesanan lunas akan otomatis dicairkan ke rekening utama Anda setelah dikurangi komisi platform.</p>

                <div className="alert alert-info small">
                  💡 <strong>Info Komisi:</strong> Komisi akan <strong>ditagihkan setiap bulan</strong> dari setiap transaksi yang selesai/lunas. Tagihan akan muncul di halaman Tagihan.
                </div>

                <form onSubmit={handleAddRekening}>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Nama Bank / E-Wallet</label>
                    <input type="text" className="form-control" placeholder="Contoh: BCA, Mandiri, GoPay, OVO" value={form.bank} onChange={e => setForm({...form, bank: e.target.value})} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Nomor Rekening / Telepon</label>
                    <input type="text" className="form-control" placeholder="Contoh: 1234567890 atau 0812xxxx" value={form.nomor} onChange={e => setForm({...form, nomor: e.target.value})} required />
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-bold">Atas Nama</label>
                    <input type="text" className="form-control" placeholder="Sesuai dengan rekening terdaftar" value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} required />
                  </div>
                  <button type="submit" className="btn btn-success w-100 py-2" disabled={isSaving}>
                    {isSaving ? "Menyimpan..." : <><FaPlus className="me-2"/> Tambah Rekening</>}
                  </button>
                </form>
              </div>
            </div>

            {/* Daftar Rekening */}
            <div className="card shadow-sm border-0">
              <div className="card-body p-4">
                <h4 className="fw-bold mb-3">📋 Daftar Rekening Anda</h4>
                
                {isLoadingRekening ? (
                  <div className="text-center py-3">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : rekeningList.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <FaSave size={40} className="mb-2 opacity-50" />
                    <p className="mb-0">Belum ada rekening terdaftar</p>
                    <small>Tambahkan rekening pertama Anda menggunakan form di atas</small>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {rekeningList.map((rek) => (
                      <div 
                        key={rek.id} 
                        className={`list-group-item p-3 ${rek.is_primary ? 'border-success bg-light' : ''}`}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            {rek.is_primary && (
                              <span className="badge bg-success mb-2">
                                <FaCheckCircle className="me-1" /> Rekening Utama
                              </span>
                            )}
                            <h5 className="mb-1 fw-bold">{rek.bank}</h5>
                            <p className="mb-1">
                              <small className="text-muted">No. Rekening:</small><br/>
                              <span className="fw-bold">{rek.nomor}</span>
                            </p>
                            <p className="mb-0">
                              <small className="text-muted">Atas Nama:</small><br/>
                              {rek.nama}
                            </p>
                          </div>
                          <div className="d-flex flex-column gap-2">
                            {!rek.is_primary && (
                              <button 
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleSetPrimary(rek.id)}
                                title="Jadikan rekening utama"
                              >
                                Jadikan Utama
                              </button>
                            )}
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteRekening(rek.id)}
                              title="Hapus rekening"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
