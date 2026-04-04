"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { FaUser, FaEnvelope, FaLock, FaExclamationCircle, FaShieldAlt, FaUserPlus } from "react-icons/fa";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [role, setRole] = useState("customer"); // Default customer
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false); // True jika belum ada admin

  // Cek apakah sudah ada admin saat halaman dimuat
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const res = await fetch('/api/check-admin');
        const data = await res.json();
        // Jika belum ada admin (hasAdmin: false), aktifkan mode setup
        if (!data.hasAdmin) {
          setIsSetupMode(true);
          setRole("admin"); // Auto select admin role
        }
      } catch (error) {
        console.error("Gagal cek status admin:", error);
      }
    };
    checkAdminStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Password tidak cocok");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password minimal 6 karakter");
      setIsLoading(false);
      return;
    }

    // Gunakan role yang dipilih (admin jika setup mode, customer jika biasa)
    const result = await register(formData.nama, formData.email, formData.password, role);

    if (result.success) {
      router.push("/login?registered=1");
    } else {
      setError(result.error || "Registrasi gagal");
    }

    setIsLoading(false);
  };

  return (
    <section className="py-5" style={{ backgroundColor: "#f8f9fa" }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card shadow">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <h2 className="fw-bold" style={{ color: "#e67e22" }}>Homebite</h2>
                  
                  {isSetupMode ? (
                    // Tampilan jika BELUM ADA ADMIN (Mode Setup)
                    <div>
                      <div className="badge bg-danger mb-2"><FaShieldAlt className="me-1" /> SETUP MODE</div>
                      <h4 className="fw-bold">Buat Akun Admin Pertama</h4>
                      <p className="text-muted small">
                        Tidak ada akun admin di database. Gunakan form ini untuk membuat admin pertama.
                      </p>
                    </div>
                  ) : (
                    // Tampilan Normal
                    <div>
                      <h4 className="fw-bold">
                        Daftar sebagai Customer
                      </h4>
                      <p className="text-muted">Buat akun baru untuk mulai belanja makanan rumahan</p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    <FaExclamationCircle className="me-2" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Nama Lengkap</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <FaUser />
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.nama}
                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                        placeholder="Nama lengkap Anda"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Email</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <FaEnvelope />
                      </span>
                      <input
                        type="email"
                        className="form-control"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@contoh.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Password</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <FaLock />
                      </span>
                      <input
                        type="password"
                        className="form-control"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Minimal 6 karakter"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Konfirmasi Password</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <FaLock />
                      </span>
                      <input
                        type="password"
                        className="form-control"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="Ulangi password"
                        required
                      />
                    </div>
                  </div>

                  <div className="d-grid">
                    <button
                      type="submit"
                      className={`btn btn-lg text-white ${isSetupMode ? 'bg-danger' : ''}`}
                      style={!isSetupMode ? { backgroundColor: "#e67e22" } : {}}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Memproses...
                        </>
                      ) : (
                        <>
                          {isSetupMode ? <FaShieldAlt className="me-2" /> : <FaUserPlus className="me-2" />}
                          {isSetupMode ? "Setup Admin" : "Daftar Sekarang"}
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <hr className="my-4" />

                <p className="text-center mb-0">
                  Sudah punya akun?{" "}
                  <Link href="/login" className="fw-bold" style={{ color: "#e67e22" }}>
                    Masuk
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
