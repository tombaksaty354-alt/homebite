"use client";

import { useState, useEffect } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaSave, FaEnvelope, FaPhone, FaInstagram, FaFacebook } from "react-icons/fa";

export default function AdminPengaturanPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    instagram: "",
    facebook: "",
    copyright_text: "© 2026 Homebite. All rights reserved."
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.role !== "admin") router.push("/");
      else fetchSettings();
    }
  }, [user, loading, router]);

  async function fetchSettings() {
    if (!supabase) return;
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (data) {
      setFormData({
        email: data.email || "",
        phone: data.phone || "",
        instagram: data.instagram || "",
        facebook: data.facebook || "",
        copyright_text: data.copyright_text || ""
      });
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      if (!supabase) throw new Error("Supabase not initialized");
      
      const { error } = await supabase
        .from("site_settings")
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq("id", 1);

      if (error) throw error;

      setMessage({ type: "success", text: "✅ Pengaturan berhasil disimpan! Footer akan terupdate otomatis." });
    } catch (error: any) {
      setMessage({ type: "error", text: "❌ Gagal menyimpan: " + error.message });
    } finally {
      setIsSaving(false);
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
          <h2 className="fw-bold">⚙️ Pengaturan Website (Footer)</h2>
          <p className="text-muted">Ubah informasi kontak yang muncul di bagian bawah website (Footer).</p>
        </div>

        <div className="card shadow-sm">
          <div className="card-body">
            {message.text && (
              <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} mb-3`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold"><FaEnvelope className="me-2 text-primary" /> Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="halo@homebite.id"
                    required
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold"><FaPhone className="me-2 text-success" /> No. WhatsApp / Telepon</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+62 812-3456-7890"
                    required
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold"><FaInstagram className="me-2 text-danger" /> Instagram</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    placeholder="@homebite.id"
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold"><FaFacebook className="me-2 text-primary" /> Facebook</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.facebook}
                    onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                    placeholder="Homebite Indonesia"
                  />
                </div>

                <div className="col-12 mb-4">
                  <label className="form-label fw-bold">Teks Copyright</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.copyright_text}
                    onChange={(e) => setFormData({ ...formData, copyright_text: e.target.value })}
                  />
                  <small className="text-muted">Teks ini muncul di baris paling bawah.</small>
                </div>
              </div>

              <div className="d-grid gap-2 col-md-3">
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  <FaSave className="me-2" /> {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}