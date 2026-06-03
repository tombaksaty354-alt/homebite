"use client";

import { useState, useEffect } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { FaPlus, FaEdit, FaTrash, FaArrowLeft, FaImage, FaUpload } from "react-icons/fa";
import { uploadImage } from "@/lib/upload";
import StockToggle from "@/components/StockToggle";

interface Produk {
  id: string;
  nama: string;
  deskripsi: string;
  harga: number;
  gambar?: string;
  kategori: string;
  porsi?: string;
  stok: number;
  tersedia: boolean;
}

export default function MitraProduk() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editProduk, setEditProduk] = useState<Produk | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    nama: "",
    deskripsi: "",
    harga: "",
    kategori: "Makanan Berat",
    porsi: "",
    stok: "0",
  });

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== "mitra") {
        router.push("/login");
      } else {
        fetchProduk();
      }
    }
  }, [user, loading, router]);

  async function fetchProduk() {
    if (!supabase || !user) return;

    const { data, error } = await supabase
      .from("produk")
      .select("*")
      .eq("mitra_id", user.id)
      .order("created_at", { ascending: false });

    if (data && !error) {
      setProdukList(data as Produk[]);
    }
  }

  function handleEdit(p: Produk) {
    setEditProduk(p);
    setFormData({
      nama: p.nama,
      deskripsi: p.deskripsi,
      harga: p.harga.toString(),
      kategori: p.kategori,
      porsi: p.porsi || "",
      stok: p.stok.toString(),
    });
    const imgs = [p.gambar, ...(p as any).gambar_ke || []].filter(Boolean);
    setImagePreviews(imgs);
    setImageFiles([]);
    setShowForm(true);
  }

  function handleNew() {
    setEditProduk(null);
    setFormData({
      nama: "",
      deskripsi: "",
      harga: "",
      kategori: "Makanan Berat",
      porsi: "",
      stok: "0",
    });
    setImageFiles([]);
    setImagePreviews([]);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !user) return;
    setIsLoading(true);

    try {
      // Upload semua gambar baru
      let uploadedUrls: string[] = [...imagePreviews];
      
      for (const file of imageFiles) {
        const url = await uploadImage(file);
        if (url) uploadedUrls.push(url);
      }

      const gambarUtama = uploadedUrls[0] || null;
      const gambarLainnya = uploadedUrls.slice(1, 5); // Max 5 foto

      const produkData = {
        nama: formData.nama,
        deskripsi: formData.deskripsi,
        harga: parseInt(formData.harga),
        gambar: gambarUtama,
        gambar_ke: gambarLainnya,
        kategori: formData.kategori,
        porsi: formData.porsi || null,
        stok: parseInt(formData.stok),
        tersedia: true,
        mitra_id: user.id,
      };

      let error;
      if (editProduk) {
        const res = await supabase.from("produk").update(produkData).eq("id", editProduk.id);
        error = res.error;
      } else {
        const res = await supabase.from("produk").insert({
          ...produkData,
          mitra_nama: user.nama,
          mitra_tier: user.tier || "silver",
        });
        error = res.error;
      }

      if (error) throw error;
      
      fetchProduk();
      setShowForm(false);
      setEditProduk(null);
      setImageFiles([]);
      setImagePreviews([]);
      alert("✅ Produk berhasil disimpan!");
    } catch (error: any) {
      alert("Gagal menyimpan: " + error.message);
      console.error("Produk error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!supabase) return;
    if (!confirm("Yakin hapus produk ini?")) return;

    const { error } = await supabase.from("produk").delete().eq("id", id);
    if (!error) {
      fetchProduk();
    } else {
      alert("Gagal menghapus: " + error.message);
    }
  }

  async function handleStockToggle(produkId: string, newState: boolean) {
    if (!supabase) return;
    const { error } = await supabase
      .from("produk")
      .update({ tersedia: newState })
      .eq("id", produkId);

    if (!error) {
      setProdukList((prev) =>
        prev.map((p) => (p.id === produkId ? { ...p, tersedia: newState } : p))
      );
    } else {
      alert("Gagal mengubah status: " + error.message);
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newFiles = [...imageFiles, ...files].slice(0, 5); // Max 5 foto
      setImageFiles(newFiles);
      
      // Preview semua file
      const previews: string[] = [...imagePreviews];
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          previews.push(reader.result as string);
          if (previews.length === newFiles.length + (editProduk ? 1 : 0)) {
            setImagePreviews(previews);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }

  function removeImage(index: number) {
    const isExisting = index < (editProduk ? [editProduk.gambar, ...(editProduk as any).gambar_ke || []].filter(Boolean).length : 0);
    if (isExisting && editProduk) {
      const allImgs = [editProduk.gambar, ...(editProduk as any).gambar_ke || []].filter(Boolean);
      allImgs.splice(index, 1);
      setImagePreviews(allImgs);
    } else {
      const fileIndex = index - (editProduk ? [editProduk.gambar, ...(editProduk as any).gambar_ke || []].filter(Boolean).length : 0);
      const newFiles = imageFiles.filter((_, i) => i !== fileIndex);
      setImageFiles(newFiles);
      const newPreviews = imagePreviews.filter((_, i) => i !== index);
      setImagePreviews(newPreviews);
    }
  }

  if (loading) return <div className="container py-5 text-center">Loading...</div>;
  if (!user || user.role !== "mitra") return null;

  return (
    <section className="py-5" style={{ backgroundColor: "#f5f6fa" }}>
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <button className="btn btn-outline-secondary btn-sm mb-2" onClick={() => router.push("/mitra-dashboard")}>
              <FaArrowLeft className="me-1" /> Kembali
            </button>
            <h2 className="fw-bold">Kelola Produk</h2>
          </div>
          <button className="btn text-white" style={{ backgroundColor: "#e67e22" }} onClick={handleNew}>
            <FaPlus className="me-2" /> Tambah Produk
          </button>
        </div>

        {showForm && (
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="fw-bold mb-3">{editProduk ? "Edit Produk" : "Tambah Produk Baru"}</h5>
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Nama Produk</label>
                    <input type="text" className="form-control" value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} required />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">Kategori</label>
                    <select className="form-select" value={formData.kategori} onChange={(e) => setFormData({...formData, kategori: e.target.value})}>
                      <option>Makanan Berat</option>
                      <option>Kue & Dessert</option>
                      <option>Sambal & Saus</option>
                      <option>Minuman</option>
                      <option>Snack</option>
                    </select>
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">Harga (Rp)</label>
                    <input type="number" className="form-control" value={formData.harga} onChange={(e) => setFormData({...formData, harga: e.target.value})} required />
                  </div>
                  <div className="col-12 mb-3">
                    <label className="form-label">Deskripsi</label>
                    <textarea className="form-control" rows={3} value={formData.deskripsi} onChange={(e) => setFormData({...formData, deskripsi: e.target.value})} required />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Upload Gambar (Maks 5 Foto)</label>
                    <div className="input-group">
                      <input type="file" className="form-control" accept="image/*" onChange={handleImageChange} multiple />
                      <span className="input-group-text"><FaUpload /></span>
                    </div>
                    <small className="text-muted">Format: JPG, PNG. Foto pertama jadi foto utama.</small>
                    
                    {imagePreviews.length > 0 && (
                      <div className="d-flex flex-wrap gap-2 mt-2">
                        {imagePreviews.map((img, idx) => (
                          <div key={idx} className="position-relative" style={{ width: '100px', height: '100px' }}>
                            <img src={img} alt={`Preview ${idx+1}`} className="img-thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            {idx === 0 && <span className="badge bg-primary position-absolute top-0 start-0">Utama</span>}
                            <button
                              type="button"
                              className="btn btn-danger btn-sm position-absolute top-0 end-0 p-0"
                              style={{ width: '24px', height: '24px', lineHeight: '1' }}
                              onClick={() => removeImage(idx)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">Porsi</label>
                    <input type="text" className="form-control" value={formData.porsi} onChange={(e) => setFormData({...formData, porsi: e.target.value})} placeholder="1-2 orang" />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">Stok</label>
                    <input type="number" className="form-control" value={formData.stok} onChange={(e) => setFormData({...formData, stok: e.target.value})} required />
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

        <div className="row">
          {produkList.length === 0 ? (
            <div className="col-12 text-center py-5">
              <FaImage size={48} className="text-muted mb-3" />
              <h5 className="text-muted">Belum ada produk</h5>
              <p className="text-muted">Klik "Tambah Produk" untuk mulai berjualan</p>
            </div>
          ) : (
            produkList.map((p) => (
              <div key={p.id} className="col-md-4 mb-4">
                <div className="card shadow-sm h-100">
                  {p.gambar ? (
                    <img src={p.gambar} className="card-img-top" alt={p.nama} style={{ height: "200px", objectFit: "cover" }} />
                  ) : (
                    <div className="card-img-top d-flex align-items-center justify-content-center bg-light" style={{ height: "200px" }}>
                      <FaImage size={48} className="text-muted" />
                    </div>
                  )}
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="fw-bold mb-0">{p.nama}</h5>
                      <StockToggle
                        isActive={p.tersedia}
                        onToggle={(state) => handleStockToggle(p.id, state)}
                      />
                    </div>
                    <p className="text-muted small mb-2">{p.kategori}</p>
                    <h4 className="fw-bold mb-2" style={{ color: "#e67e22" }}>Rp{p.harga.toLocaleString("id-ID")}</h4>
                    <p className="text-muted small mb-2">Stok: {p.stok}</p>
                    {!p.tersedia && (
                      <div className="alert alert-warning py-1 px-2 small mb-2">
                        ⚠️ Produk ini tidak tampil di katalog
                      </div>
                    )}
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(p)}>
                        <FaEdit className="me-1" /> Edit
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p.id)}>
                        <FaTrash className="me-1" /> Hapus
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
