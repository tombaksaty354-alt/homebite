"use client";

import { useState, useEffect } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaPlus, FaEdit, FaTrash, FaSave, FaCheckCircle, FaTimes } from "react-icons/fa";

interface CustomerRekening {
  id: string;
  user_id: string;
  bank: string;
  nomor: string;
  atas_nama: string;
  is_primary: boolean;
  created_at: string;
}

export default function CustomerRekeningPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [rekenings, setRekenings] = useState<CustomerRekening[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    bank: "",
    nomor: "",
    atas_nama: "",
    is_primary: true
  });

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else fetchRekenings();
    }
  }, [user, loading, router]);

  async function fetchRekenings() {
    if (!supabase || !user) return;

    const { data, error } = await supabase
      .from("customer_rekening")
      .select("*")
      .eq("user_id", user.id)
      .order("is_primary", { ascending: false })
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
      is_primary: rekenings.length === 0 // Auto primary if first rekening
    });
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(rekening: CustomerRekening) {
    setFormData({
      bank: rekening.bank,
      nomor: rekening.nomor,
      atas_nama: rekening.atas_nama,
      is_primary: rekening.is_primary
    });
    setEditingId(rekening.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!supabase || !user || !formData.bank || !formData.nomor || !formData.atas_nama) {
      alert("⚠️ Semua field wajib diisi!");
      return;
    }

    setIsSaving(true);

    try {
      if (formData.is_primary) {
        // Unset all other rekening as primary
        await supabase
          .from("customer_rekening")
          .update({ is_primary: false })
          .eq("user_id", user.id);
      }

      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from("customer_rekening")
          .update({
            bank: formData.bank,
            nomor: formData.nomor,
            atas_nama: formData.atas_nama,
            is_primary: formData.is_primary
          })
          .eq("id", editingId);

        if (error) throw error;
        alert("✅ Rekening berhasil diupdate!");
      } else {
        // Add new
        const { error } = await supabase
          .from("customer_rekening")
          .insert({
            user_id: user.id,
            bank: formData.bank,
            nomor: formData.nomor,
            atas_nama: formData.atas_nama,
            is_primary: formData.is_primary
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
        .from("customer_rekening")
        .delete()
        .eq("id", id);

      if (error) throw error;
      alert("✅ Rekening berhasil dihapus!");
      await fetchRekenings();
    } catch (error: any) {
      alert("❌ Gagal: " + error.message);
    }
  }

  async function setAsPrimary(id: string) {
    if (!supabase || !user) return;

    try {
      // Unset all other rekening as primary
      await supabase
        .from("customer_rekening")
        .update({ is_primary: false })
        .eq("user_id", user.id);

      // Set this one as primary
      const { error } = await supabase
        .from("customer_rekening")
        .update({ is_primary: true })
        .eq("id", id);

      if (error) throw error;
      await fetchRekenings();
    } catch (error: any) {
      alert("❌ Gagal: " + error.message);
    }
  }

  if (loading) return <div className="container py-5 text-center">Loading...</div>;
  if (!user) return null;

  return (
    <section className="py-5 bg-light">
      <div className="container">
        <div className="mb-4">
          <Link href="/profil" className="btn btn-outline-secondary btn-sm mb-2">
            <FaArrowLeft className="me-1" /> Kembali
          </Link>
          <h2 className="fw-bold">🏦 Rekening Saya</h2>
          <p className="text-muted">
            Tambahkan rekening bank Anda untuk menerima refund jika pesanan dibatalkan.
            Dana refund akan ditransfer ke rekening ini.
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
                      placeholder="Contoh: BCA, Mandiri, BNI, BRI"
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
                      placeholder="Nama pemilik rekening"
                      value={formData.atas_nama}
                      onChange={(e) => setFormData({...formData, atas_nama: e.target.value})}
                    />
                  </div>
                  <div className="form-check mb-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="isPrimary"
                      checked={formData.is_primary}
                      onChange={(e) => setFormData({...formData, is_primary: e.target.checked})}
                    />
                    <label className="form-check-label" htmlFor="isPrimary">
                      Jadikan rekening utama (untuk refund otomatis)
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
            <h5 className="text-muted">Belum ada rekening tersimpan</h5>
            <p className="text-muted small">
              Tambahkan rekening bank Anda untuk menerima refund jika pesanan dibatalkan
            </p>
            <button className="btn btn-primary" onClick={openAddForm}>
              <FaPlus className="me-2" /> Tambah Rekening Sekarang
            </button>
          </div>
        ) : (
          <div className="row">
            {rekenings.map((rek) => (
              <div key={rek.id} className="col-md-6 mb-3">
                <div className={`card shadow-sm h-100 ${rek.is_primary ? 'border-primary border-2' : 'border-secondary'}`}>
                  <div className="card-header bg-white d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      {rek.is_primary ? (
                        <FaCheckCircle className="text-primary me-2" />
                      ) : (
                        <div className="me-2" style={{ width: '20px' }}></div>
                      )}
                      <h5 className="mb-0">{rek.bank}</h5>
                      {rek.is_primary && (
                        <span className="badge bg-primary ms-2">Utama</span>
                      )}
                    </div>
                    <div className="d-flex gap-2">
                      {!rek.is_primary && (
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => setAsPrimary(rek.id)}
                          title="Jadikan utama"
                        >
                          <FaCheckCircle />
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-outline-secondary"
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
                    <div className="mb-0">
                      <small className="text-muted d-block">Atas Nama</small>
                      <strong>{rek.atas_nama}</strong>
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
            <h6 className="fw-bold text-info">ℹ️ Info Rekening</h6>
            <p className="small mb-2">
              Rekening ini digunakan untuk menerima <strong>refund</strong> jika pesanan Anda dibatalkan.
            </p>
            <p className="small mb-2">
              Jika Anda membatalkan pesanan yang sudah dibayar, dana akan dikembalikan ke rekening utama Anda.
            </p>
            <p className="small mb-0">
              Pastikan nomor rekening dan atas nama sesuai dengan data bank Anda.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
