"use client";

import { useState, useEffect } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaSave, FaEnvelope, FaPhone, FaInstagram, FaFacebook, FaAlignLeft } from "react-icons/fa";

export default function AdminPengaturanPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    nama_platform: "Homebite",
    email_kontak: "",
    telepon_kontak: "",
    whatsapp_number: "",
    instagram_url: "",
    facebook_url: "",
    footer_description: "",
    copyright_text: ""
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
        nama_platform: data.nama_platform || "Homebite",
        email_kontak: data.email_kontak || "",
        telepon_kontak: data.telepon_kontak || "",
        whatsapp_number: data.whatsapp_number || "",
        instagram_url: data.instagram_url || "",
        facebook_url: data.facebook_url || "",
        footer_description: data.footer_description || "",
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
                {/* Platform Name */}
                <div className="col-12 mb-3">
                  <label className="form-label fw-bold">Nama Platform</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.nama_platform}
                    onChange={(e) => setFormData({ ...formData, nama_platform: e.target.value })}
                    placeholder="Homebite"
                    required
                  />
                </div>

                {/* Email */}
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold"><FaEnvelope className="me-2 text-primary" /> Email Kontak</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email_kontak}
                    onChange={(e) => setFormData({ ...formData, email_kontak: e.target.value })}
                    placeholder="halo@homebite.id"
                    required
                  />
                </div>

                {/* Phone */}
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold"><FaPhone className="me-2 text-success" /> No. WhatsApp</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.whatsapp_number}
                    onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                    placeholder="+62 812-3456-7890"
                    required
                  />
                </div>

                {/* Instagram */}
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold"><FaInstagram className="me-2 text-danger" /> URL Instagram</label>
                  <input
                    type="url"
                    className="form-control"
                    value={formData.instagram_url}
                    onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                    placeholder="https://instagram.com/homebite.id"
                  />
                </div>

                {/* Facebook */}
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold"><FaFacebook className="me-2 text-primary" /> URL Facebook</label>
                  <input
                    type="url"
                    className="form-control"
                    value={formData.facebook_url}
                    onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                    placeholder="https://facebook.com/homebite"
                  />
                </div>

                {/* Footer Description */}
                <div className="col-12 mb-3">
                  <label className="form-label fw-bold"><FaAlignLeft className="me-2 text-info" /> Deskripsi Footer</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={formData.footer_description}
                    onChange={(e) => setFormData({ ...formData, footer_description: e.target.value })}
                    placeholder="Marketplace khusus makanan rumahan..."
                    required
                  />
                  <small className="text-muted">Deskripsi singkat platform yang muncul di footer.</small>
                </div>

                {/* Copyright */}
                <div className="col-12 mb-4">
                  <label className="form-label fw-bold">Teks Copyright</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.copyright_text}
                    onChange={(e) => setFormData({ ...formData, copyright_text: e.target.value })}
                    placeholder="© 2026 Homebite. Dibuat dengan ❤ untuk UMKM Indonesia"
                    required
                  />
                  <small className="text-muted">Teks ini muncul di baris paling bawah footer.</small>
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