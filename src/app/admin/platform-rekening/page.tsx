"use client";

import { useState, useEffect } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaPlus, FaEdit, FaTrash, FaCheckCircle, FaTimes, FaSave } from "react-icons/fa";

interface PlatformRekening {
  id: string;
  bank: string;
  nomor: string;
  atas_nama: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminPlatformRekeningPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [rekenings, setRekenings] = useState<PlatformRekening[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    bank: "",
    nomor: "",
    atas_nama: "",
    is_active: true
  });

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.role !== "admin") router.push("/");
      else fetchRekenings();
    }
  }, [user, loading, router]);

  async function fetchRekenings() {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("platform_rekening")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRekenings(data);
    }
  }

  function openAddForm() {
    setFormData({
      bank: "",
      nomor: "",
      atas_nama: "",
      is_active: true
    });
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(rekening: PlatformRekening) {
    setFormData({
      bank: rekening.bank,
      nomor: rekening.nomor,
      atas_nama: rekening.atas_nama,
      is_active: rekening.is_active
    });
    setEditingId(rekening.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!supabase || !formData.bank || !formData.nomor || !formData.atas_nama) {
      alert("⚠️ Semua field wajib diisi!");
      return;
    }

    setIsSaving(true);

    try {
      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from("platform_rekening")
          .update({
            bank: formData.bank,
            nomor: formData.nomor,
            atas_nama: formData.atas_nama,
            is_active: formData.is_active
          })
          .eq("id", editingId);

        if (error) throw error;
        alert("✅ Rekening berhasil diupdate!");
      } else {
        // Add new
        const { error } = await supabase
          .from("platform_rekening")
          .insert({
            bank: formData.bank,
            nomor: formData.nomor,
            atas_nama: formData.atas_nama,
            is_active: formData.is_active
          });

        if (error) throw error;
        alert("✅ Rekening berhasil ditambahkan!");
      }

      setShowForm(false);
      await fetchRekenings();
    } catch (error: any) {
      console.error("Error saving rekening:", error);
      alert("❌ Gagal: " + error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!supabase) return;
    if (!confirm("Yakin ingin menghapus rekening ini?")) return;

    try {
      const { error } = await supabase
        .from("platform_rekening")
        .delete()
        .eq("id", id);

      if (error) throw error;
      alert("✅ Rekening berhasil dihapus!");
      await fetchRekenings();
    } catch (error: any) {
      alert("❌ Gagal: " + error.message);
    }
  }

  async function toggleActive(id: string, currentStatus: boolean) {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from("platform_rekening")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      await fetchRekenings();
    } catch (error: any) {
      alert("❌ Gagal: " + error.message);
    }
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
          <h2 className="fw-bold">💳 Rekening Platform (Rekber)</h2>
          <p className="text-muted">
            Kelola rekening tujuan customer saat transfer ke Rekening Bersama.
            Customer akan melihat rekening ini saat checkout.
          </p>
        </div>

        {/* Add Button */}
        <div className="mb-4">
          <button className="btn btn-primary" onClick={openAddForm}>
            <FaPlus className="me-2" /> Tambah Rekening Baru
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingId ? "✏️ Edit Rekening" : "➕ Tambah Rekening"}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Nama Bank *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Contoh: BCA, Mandiri, BNI"
                      value={formData.bank}
                      onChange={(e) => setFormData({...formData, bank: e.target.value})}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Nomor Rekening *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Contoh: 1234567890"
                      value={formData.nomor}
                      onChange={(e) => setFormData({...formData, nomor: e.target.value})}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Atas Nama *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Contoh: PT Homebite Indonesia"
                      value={formData.atas_nama}
                      onChange={(e) => setFormData({...formData, atas_nama: e.target.value})}
                    />
                  </div>
                  <div className="form-check mb-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="isActive"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    />
                    <label className="form-check-label" htmlFor="isActive">
                      Aktif (customer bisa melihat & transfer ke rekening ini)
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                    Batal
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <><span className="spinner-border spinner-border-sm me-2" /> Menyimpan...</>
                    ) : (
                      <><FaSave className="me-1" /> {editingId ? "Update" : "Simpan"}</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rekening List */}
        {rekenings.length === 0 ? (
          <div className="card shadow-sm text-center py-5">
            <FaPlus size={48} className="text-muted mb-3" />
            <h5 className="text-muted">Belum ada rekening platform</h5>
            <p className="text-muted small">Tambahkan rekening tujuan untuk customer transfer</p>
            <button className="btn btn-primary" onClick={openAddForm}>
              <FaPlus className="me-2" /> Tambah Rekening Sekarang
            </button>
          </div>
        ) : (
          <div className="row">
            {rekenings.map((rek) => (
              <div key={rek.id} className="col-md-6 mb-3">
                <div className={`card shadow-sm h-100 ${rek.is_active ? 'border-success' : 'border-secondary'}`}>
                  <div className="card-header bg-white d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      {rek.is_active ? (
                        <FaCheckCircle className="text-success me-2" />
                      ) : (
                        <FaTimes className="text-secondary me-2" />
                      )}
                      <h5 className="mb-0">{rek.bank}</h5>
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => openEditForm(rek)}
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(rek.id)}
                        title="Hapus"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="mb-2">
                      <small className="text-muted d-block">Nomor Rekening</small>
                      <strong className="fs-5">{rek.nomor}</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Atas Nama</small>
                      <strong>{rek.atas_nama}</strong>
                    </div>
                    <div className="mb-0">
                      <small className="text-muted d-block">Status</small>
                      <button
                        className={`btn btn-sm ${rek.is_active ? 'btn-success' : 'btn-secondary'}`}
                        onClick={() => toggleActive(rek.id, rek.is_active)}
                      >
                        {rek.is_active ? "✅ Aktif" : "⏸️ Nonaktif"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Card */}
        <div className="card shadow-sm mt-4 border-info">
          <div className="card-body">
            <h6 className="fw-bold text-info">ℹ️ Info Rekening Platform</h6>
            <p className="small mb-2">
              Rekening yang <strong>aktif</strong> akan ditampilkan kepada customer saat checkout sebagai tujuan transfer Escrow.
            </p>
            <p className="small mb-2">
              Customer akan transfer ke rekening ini, dan dana akan ditahan oleh platform sampai pesanan selesai.
            </p>
            <p className="small mb-0">
              Setelah pesanan selesai, dana akan masuk ke saldo mitra (setelah potong komisi).
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
