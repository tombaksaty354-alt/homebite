"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useKeranjang } from "@/context/KeranjangContext";
import { FaTrash, FaShoppingCart, FaArrowRight, FaMinus, FaPlus, FaImage, FaCheckCircle } from "react-icons/fa";
import Image from "next/image";

export default function HalamanKeranjang() {
  const router = useRouter();
  const { keranjang, updateJumlah, getTotalKeranjang, kosongkanKeranjang } = useKeranjang();

  // Removed fake loading state - cart is synchronously available from context
  if (keranjang.length === 0) {
    return (
      <section className="py-5" style={{ background: '#fafafa', minHeight: '100vh' }}>
        <div className="container">
          <div className="text-center py-5">
            <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '120px', height: '120px', background: 'rgba(230, 126, 34, 0.08)' }}>
              <FaShoppingCart size={56} style={{ color: '#e67e22', opacity: 0.6 }} />
            </div>
            <h2 className="fw-bold mb-3">Keranjang Anda Kosong</h2>
            <p className="text-muted mb-4 lead">Yuk, jelajahi makanan rumahan lezat dari UMKM kami!</p>
            <Link href="/produk" className="btn btn-lg d-inline-flex align-items-center gap-2" style={{ background: '#e67e22', color: 'white', borderRadius: '12px', padding: '14px 32px', fontWeight: 700, border: 'none' }}>
              Jelajahi Makanan
              <FaArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const totalItems = keranjang.reduce((acc, item) => acc + item.jumlah, 0);
  const totalPrice = getTotalKeranjang();

  return (
    <section className="py-5" style={{ background: '#fafafa', minHeight: '100vh' }}>
      <div className="container">
        {/* Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
          <div>
            <h1 className="fw-bold mb-1">Keranjang Belanja</h1>
            <p className="text-muted mb-0">{totalItems} item dalam keranjang Anda</p>
          </div>
          <button
            className="btn"
            onClick={kosongkanKeranjang}
            style={{ background: 'rgba(231, 76, 60, 0.08)', color: '#e74c3c', borderRadius: '10px', padding: '10px 20px', fontWeight: 600, fontSize: '14px', border: 'none' }}
          >
            <FaTrash className="me-2" size={14} />
            Kosongkan Keranjang
          </button>
        </div>

        <div className="row g-4">
          {/* Cart Items */}
          <div className="col-lg-8">
            {keranjang.map((item) => (
              <div key={item.id} className="card-modern mb-3 p-3">
                <div className="row align-items-center g-3">
                  {/* Product Image */}
                  <div className="col-md-2">
                    <div className="position-relative rounded overflow-hidden" style={{ height: '100px', background: '#f5f5f5' }}>
                      {item.gambar ? (
                        <Image src={item.gambar} alt={item.nama} fill style={{ objectFit: "cover" }} />
                      ) : (
                        <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                          <FaImage size={32} style={{ color: '#e0e0e0' }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="col-md-5">
                    <h5 className="fw-bold mb-1">{item.nama}</h5>
                    <small className="text-muted">oleh {item.mitraNama}</small>
                    <div className="mt-2">
                      <span className="fw-bold" style={{ color: '#e67e22' }}>Rp{item.harga.toLocaleString("id-ID")}</span>
                      <span className="text-muted small ms-2">/ item</span>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="col-md-3">
                    <div className="d-flex align-items-center gap-2">
                      <button
                        className="btn btn-sm"
                        onClick={() => updateJumlah(item.id, item.jumlah - 1)}
                        style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(230, 126, 34, 0.08)', color: '#e67e22', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <FaMinus size={12} />
                      </button>
                      <span className="fw-bold mx-2" style={{ fontSize: '18px', minWidth: '30px', textAlign: 'center' }}>{item.jumlah}</span>
                      <button
                        className="btn btn-sm"
                        onClick={() => updateJumlah(item.id, item.jumlah + 1)}
                        style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(230, 126, 34, 0.08)', color: '#e67e22', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <FaPlus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="col-md-2">
                    <div className="text-end">
                      <span className="fw-bold fs-5" style={{ color: '#e67e22' }}>
                        Rp{(item.harga * item.jumlah).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <button
                      className="btn btn-sm mt-2 w-100"
                      onClick={() => updateJumlah(item.id, 0)}
                      style={{ background: 'rgba(231, 76, 60, 0.08)', color: '#e74c3c', borderRadius: '8px', padding: '6px', fontSize: '12px', fontWeight: 600, border: 'none' }}
                    >
                      <FaTrash size={12} className="me-1" /> Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="col-lg-4">
            <div className="card-modern p-4" style={{ position: 'sticky', top: '80px' }}>
              <h4 className="fw-bold mb-4 d-flex align-items-center gap-2">
                <FaCheckCircle style={{ color: '#27ae60' }} />
                Ringkasan Pesanan
              </h4>

              <div className="mb-3">
                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">Subtotal ({totalItems} item)</span>
                  <span className="fw-bold">Rp{totalPrice.toLocaleString("id-ID")}</span>
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">Ongkir</span>
                  <span className="fw-bold text-success">Akan ditentukan</span>
                </div>
              </div>

              <div className="p-3 rounded-3 mb-4" style={{ background: '#f8f9fa' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold fs-6">Total</span>
                  <span className="fw-bold fs-4" style={{ color: '#e67e22' }}>
                    Rp{totalPrice.toLocaleString("id-ID")}
                  </span>
                </div>
                <small className="text-muted d-block mt-1">*Ongkir & jasa platform akan ditentukan oleh admin</small>
              </div>

              <button
                className="btn w-100 d-flex align-items-center justify-content-center gap-2 mb-3"
                onClick={() => router.push('/checkout')}
                style={{ background: '#e67e22', color: 'white', borderRadius: '12px', padding: '14px', fontWeight: 700, fontSize: '15px', border: 'none' }}
              >
                Lanjut ke Checkout
                <FaArrowRight size={16} />
              </button>

              <small className="text-muted d-block text-center">
                Admin akan menetapkan ongkir & jasa platform setelah Anda memesan sebelum pembayaran dilakukan.
              </small>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
