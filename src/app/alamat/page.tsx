"use client";

import { useState, useEffect } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaMapMarkerAlt, FaPlus, FaEdit, FaTrash, FaCheckCircle } from "react-icons/fa";

interface Address {
  id: string;
  label: string;
  alamat: string;
  kota: string;
  provinsi: string;
  kode_pos: string;
  telepon: string;
  is_default: boolean;
}

export default function AlamatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editAddress, setEditAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState({
    label: "",
    alamat: "",
    kota: "",
    provinsi: "",
    kode_pos: "",
    telepon: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else fetchAddresses();
    }
  }, [user, loading, router]);

  async function fetchAddresses() {
    if (!supabase || !user) return;

    const { data, error } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false });

    if (!error && data) setAddresses(data);
  }

  function handleNew() {
    setEditAddress(null);
    setFormData({ label: "", alamat: "", kota: "", provinsi: "", kode_pos: "", telepon: "" });
    setShowForm(true);
  }

  function handleEdit(addr: Address) {
    setEditAddress(addr);
    setFormData({
      label: addr.label,
      alamat: addr.alamat,
      kota: addr.kota,
      provinsi: addr.provinsi,
      kode_pos: addr.kode_pos,
      telepon: addr.telepon || "",
    });
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus alamat ini?")) return;
    if (!supabase) return;

    const { error } = await supabase.from("user_addresses").delete().eq("id", id);
    if (!error) fetchAddresses();
  }

  async function handleSetDefault(id: string) {
    if (!supabase || !user) return;

    // Unset all defaults first
    await supabase.from("user_addresses").update({ is_default: false }).eq("user_id", user.id);
    
    // Set this one as default
    const { error } = await supabase.from("user_addresses").update({ is_default: true }).eq("id", id);
    if (!error) fetchAddresses();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !user) return;
    setIsLoading(true);

    try {
      const addressData = {
        user_id: user.id,
        ...formData,
        is_default: addresses.length === 0, // First address is default
      };

      let error;
      if (editAddress) {
        const res = await supabase.from("user_addresses").update(addressData).eq("id", editAddress.id);
        error = res.error;
      } else {
        const res = await supabase.from("user_addresses").insert(addressData);
        error = res.error;
      }

      if (error) throw error;

      fetchAddresses();
      setShowForm(false);
      setEditAddress(null);
    } catch (error: any) {
      alert("Gagal menyimpan: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }

  if (loading) return <div className="container py-5 text-center">Loading...</div>;
  if (!user) return null;

  return (
    <section className="py-5 bg-light">
      <div className="container">
        <div className="mb-4 d-flex justify-content-between align-items-center">
          <div>
            <Link href="/profil" className="btn btn-outline-secondary btn-sm mb-2">
              <FaArrowLeft className="me-1" /> Kembali
            </Link>
            <h2 className="fw-bold mb-0"><FaMapMarkerAlt className="me-2" /> Alamat Saya</h2>
            <p className="text-muted">Kelola alamat pengiriman Anda</p>
          </div>
          <button className="btn text-white" style={{ backgroundColor: "#e67e22" }} onClick={handleNew}>
            <FaPlus className="me-2" /> Tambah Alamat
          </button>
        </div>

        {showForm && (
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="fw-bold mb-3">{editAddress ? "Edit Alamat" : "Tambah Alamat Baru"}</h5>
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Label Alamat</label>
                    <input type="text" className="form-control" value={formData.label} onChange={(e) => setFormData({...formData, label: e.target.value})} placeholder="Rumah, Kantor, dll" required />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Nomor Telepon</label>
                    <input type="tel" className="form-control" value={formData.telepon} onChange={(e) => setFormData({...formData, telepon: e.target.value})} placeholder="0812xxxxxxxxx" required />
                  </div>
                  <div className="col-12 mb-3">
                    <label className="form-label fw-bold">Alamat Lengkap</label>
                    <textarea className="form-control" rows={3} value={formData.alamat} onChange={(e) => setFormData({...formData, alamat: e.target.value})} placeholder="Jalan, No. Rumah, RT/RW, Kelurahan, Kecamatan" required />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-bold">Kota / Kabupaten</label>
                    <input type="text" className="form-control" value={formData.kota} onChange={(e) => setFormData({...formData, kota: e.target.value})} required />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-bold">Provinsi</label>
                    <input type="text" className="form-control" value={formData.provinsi} onChange={(e) => setFormData({...formData, provinsi: e.target.value})} required />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-bold">Kode Pos</label>
                    <input type="text" className="form-control" value={formData.kode_pos} onChange={(e) => setFormData({...formData, kode_pos: e.target.value})} required />
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <button type="submit" className="btn text-white" disabled={isLoading} style={{ backgroundColor: "#27ae60" }}>
                    {isLoading ? "Menyimpan..." : "Simpan"}
                  </button>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>Batal</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {addresses.length === 0 ? (
          <div className="card shadow-sm text-center py-5">
            <FaMapMarkerAlt size={48} className="text-muted mb-3" />
            <h5 className="text-muted">Belum ada alamat tersimpan</h5>
            <p className="text-muted small">Tambahkan alamat pengiriman untuk checkout lebih cepat</p>
            <button className="btn text-white" style={{ backgroundColor: "#e67e22" }} onClick={handleNew}>
              <FaPlus className="me-2" /> Tambah Alamat Pertama
            </button>
          </div>
        ) : (
          <div className="row">
            {addresses.map((addr) => (
              <div key={addr.id} className="col-md-6 mb-3">
                <div className={`card shadow-sm h-100 ${addr.is_default ? 'border-primary border-2' : ''}`}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex align-items-center">
                        <FaMapMarkerAlt className="text-primary me-2" />
                        <h6 className="fw-bold mb-0">{addr.label}</h6>
                        {addr.is_default && (
                          <span className="badge bg-primary ms-2"><FaCheckCircle className="me-1" /> Default</span>
                        )}
                      </div>
                      <div className="d-flex gap-1">
                        {!addr.is_default && (
                          <button className="btn btn-sm btn-outline-primary" onClick={() => handleSetDefault(addr.id)} title="Jadi default">
                            <FaCheckCircle />
                          </button>
                        )}
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => handleEdit(addr)} title="Edit">
                          <FaEdit />
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(addr.id)} title="Hapus">
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    <p className="text-muted small mb-0">
                      {addr.alamat}<br />
                      {addr.kota}, {addr.provinsi} {addr.kode_pos}<br />
                      📞 {addr.telepon}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
