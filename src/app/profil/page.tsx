"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/context/AuthContext";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";
import { FaUserCircle, FaEnvelope, FaIdBadge, FaPhone, FaMapMarkerAlt, FaSave } from "react-icons/fa";

export default function HalamanProfil() {
  const { user, loading } = useAuth();
  const [formData, setFormData] = useState({
    nama: "",
    telepon: "",
    alamat: "",
    kota: "",
    provinsi: "",
    kodePos: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        nama: user.nama || "",
        telepon: user.telepon || "",
        alamat: user.alamat || "",
        kota: user.kota || "",
        provinsi: user.provinsi || "",
        kodePos: "",
      });
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      if (!supabase) throw new Error("Supabase tidak tersedia");

      const { error } = await supabase
        .from("users")
        .update({
          nama: formData.nama,
          telepon: formData.telepon,
          alamat: formData.alamat,
          kota: formData.kota,
          provinsi: formData.provinsi,
        })
        .eq("id", user?.id);

      if (error) throw error;
      setMessage("success");
    } catch (error: any) {
      setMessage("error");
      console.error("Error updating profile:", error);
    }
    setIsSaving(false);
  };

  if (loading) return <div className="container py-5 text-center">Loading...</div>;
  if (!user) {
    return (
      <section className="py-5">
        <div className="container text-center py-5">
          <FaUserCircle size={80} className="text-muted mb-4" />
          <h2 className="fw-bold mb-3">Silakan Masuk Terlebih Dahulu</h2>
          <Link href="/login" className="btn btn-lg text-white" style={{ backgroundColor: "#e67e22" }}>
            Masuk Sekarang
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="py-5" style={{ backgroundColor: "#f8f9fa" }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-sm">
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  {/* Profile Picture Upload */}
                  <div className="mb-3">
                    <ProfilePictureUpload size={120} showEditControls={true} />
                  </div>
                  <h4 className="fw-bold mb-1">{user.nama}</h4>
                  <p className="text-muted mb-2">{user.email}</p>
                  <span className={`badge ${user.role === "admin" ? "bg-danger" : user.role === "mitra" ? "bg-dark" : "bg-primary"}`}>
                    {user.role === "customer" ? "Customer" : user.role === "mitra" ? "Mitra UMKM" : "Admin"}
                  </span>
                </div>

                {message === "success" && (
                  <div className="alert alert-success">Profil berhasil diperbarui!</div>
                )}
                {message === "error" && (
                  <div className="alert alert-danger">Gagal memperbarui profil.</div>
                )}

                <form onSubmit={handleSave}>
                  <h5 className="fw-bold mb-3">Informasi Pribadi</h5>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Nama Lengkap</label>
                      <div className="input-group">
                        <span className="input-group-text"><FaUserCircle /></span>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.nama}
                          onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Email</label>
                      <div className="input-group">
                        <span className="input-group-text"><FaEnvelope /></span>
                        <input type="email" className="form-control" value={user.email} disabled />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Nomor Telepon</label>
                      <div className="input-group">
                        <span className="input-group-text"><FaPhone /></span>
                        <input
                          type="tel"
                          className="form-control"
                          value={formData.telepon}
                          onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                          placeholder="0812xxxxxxxxx"
                        />
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Kota</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.kota}
                        onChange={(e) => setFormData({ ...formData, kota: e.target.value })}
                        placeholder="Contoh: Surabaya, Jakarta"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Provinsi</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.provinsi}
                        onChange={(e) => setFormData({ ...formData, provinsi: e.target.value })}
                        placeholder="Contoh: Jawa Timur, DKI Jakarta"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Alamat Lengkap</label>
                    <div className="input-group">
                      <span className="input-group-text"><FaMapMarkerAlt /></span>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={formData.alamat}
                        onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                        placeholder="Jalan, No. Rumah, RT/RW, Kelurahan, Kecamatan"
                      />
                    </div>
                  </div>
                  <div className="d-grid">
                    <button type="submit" className="btn text-white" disabled={isSaving} style={{ backgroundColor: "#e67e22" }}>
                      {isSaving ? "Menyimpan..." : <><FaSave className="me-2" /> Simpan Perubahan</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
