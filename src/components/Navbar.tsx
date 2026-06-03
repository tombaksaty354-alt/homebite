"use client";

import Link from "next/link";
import { useKeranjang } from "@/context/KeranjangContext";
import { useAuth } from "@/context/AuthContext";
import { FaShoppingCart, FaStore, FaChartLine, FaUserCircle, FaSignOutAlt, FaSearch, FaCog, FaHeart, FaComments, FaTruck, FaStar, FaExclamationTriangle } from "react-icons/fa";
import NotificationBell from "@/components/NotificationBell";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const { getJumlahKeranjang } = useKeranjang();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const jumlahKeranjang = getJumlahKeranjang();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) router.push(`/produk?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light sticky-top shadow-sm" style={{ backgroundColor: "white", borderBottom: "1px solid #e0e0e0" }}>
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" href="/" style={{ color: "#e67e22" }}>
          <div className="d-flex align-items-center justify-content-center me-2 rounded-circle" style={{ width: 36, height: 36, backgroundColor: "#e67e22" }}>
            <FaStore className="text-white" size={16} />
          </div>
          <strong>Homebite</strong>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <form onSubmit={handleSearch} className="d-flex ms-auto mx-lg-3 my-2 my-lg-0">
            <div className="input-group">
              <input className="form-control" type="search" placeholder="Cari makanan..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <button className="btn" type="submit" style={{ backgroundColor: "#e67e22", color: "white" }}><FaSearch /></button>
            </div>
          </form>

          <ul className="navbar-nav me-auto">
            <li className="nav-item"><Link className="nav-link" href="/">Beranda</Link></li>
            <li className="nav-item"><Link className="nav-link" href="/produk">Produk UMKM</Link></li>
            <li className="nav-item"><Link className="nav-link" href="/tentang">Tentang Kami</Link></li>
            {!user && (
              <li className="nav-item"><Link className="nav-link fw-semibold" href="/mitra" style={{ color: "#e67e22" }}>Jadi Mitra</Link></li>
            )}
            {user && user.role === "admin" && (
              <>
                <li className="nav-item"><Link className="nav-link" href="/admin"><FaChartLine className="me-1" /> Dashboard</Link></li>
                <li className="nav-item"><Link className="nav-link" href="/admin/logistik"><FaTruck className="me-1" /> Logistik</Link></li>
                <li className="nav-item"><Link className="nav-link" href="/admin/chat"><FaComments className="me-1" /> Chat</Link></li>
              </>
            )}
          </ul>

          <div className="d-flex align-items-center gap-2">
            {user && <NotificationBell />}

            {user && user.role === "customer" && (
              <Link href="/keranjang" className="btn position-relative" style={{ color: "#e67e22" }}>
                <FaShoppingCart size={20} />
                {jumlahKeranjang > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: "10px", padding: "3px 5px" }}>{jumlahKeranjang}</span>}
              </Link>
            )}

            {user ? (
              <div className="dropdown">
                <button className="btn dropdown-toggle d-flex align-items-center gap-2" type="button" data-bs-toggle="dropdown" style={{ border: "1px solid #e0e0e0" }}>
                  {user.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt={user.nama}
                      className="rounded-circle"
                      style={{ width: 28, height: 28, objectFit: 'cover' }}
                    />
                  ) : (
                    <FaUserCircle size={20} />
                  )}
                  <span className="d-none d-lg-inline">{user.nama}</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li><Link className="dropdown-item" href="/profil"><FaUserCircle className="me-2" /> Profil Saya</Link></li>
                  {user.role === "customer" && (
                    <>
                      <li><Link className="dropdown-item" href="/wishlist"><FaHeart className="me-2 text-danger" /> Wishlist</Link></li>
                      <li><Link className="dropdown-item" href="/chat"><FaComments className="me-2" /> Chat Saya</Link></li>
                      <li><Link className="dropdown-item" href="/pesanan">📦 Pesanan Saya</Link></li>
                      <li><Link className="dropdown-item" href="/pelacakan"><FaTruck className="me-2" style={{color: '#e67e22'}} /> Lacak Pesanan</Link></li>
                      <li><Link className="dropdown-item" href="/alamat">📍 Alamat Saya</Link></li>
                      <li><Link className="dropdown-item" href="/customer-rekening">🏦 Rekening Bank Saya</Link></li>
                    </>
                  )}
                  {user.role === "mitra" && (
                    <>
                      <li><Link className="dropdown-item" href="/mitra-dashboard">📊 Dashboard Mitra</Link></li>
                      <li><Link className="dropdown-item" href="/chat">💬 Chat Saya</Link></li>
                      <li><Link className="dropdown-item" href="/mitra-dashboard/tagihan">💰 Tagihan Komisi</Link></li>
                      <li><Link className="dropdown-item" href="/mitra-dashboard/pengaturan"><FaCog className="me-2" /> Pengaturan Rekening</Link></li>
                    </>
                  )}
                  <li><hr className="dropdown-divider" /></li>
                  <li><button className="dropdown-item text-danger" onClick={handleLogout}><FaSignOutAlt className="me-2" /> Keluar</button></li>
                </ul>
              </div>
            ) : (
              <Link href="/login" className="btn" style={{ backgroundColor: "#e67e22", color: "white" }}>Masuk</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
