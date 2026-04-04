"use client";

import { ProdukMakanan } from "@/types";
import Link from "next/link";
import Image from "next/image";
import { FaStar, FaStarHalfAlt, FaRegStar, FaHeart, FaShoppingCart, FaImage } from "react-icons/fa";
import { useKeranjang } from "@/context/KeranjangContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { showToast } from "@/components/ToastNotification";
import { BsShieldCheck } from "react-icons/bs";

interface KartuProdukProps {
  produk: ProdukMakanan;
}

function BintangRating({ rating }: { rating?: number }) {
  if (!rating) return null;
  const bintang = [];
  const penuh = Math.floor(rating);
  const setengah = rating % 1 !== 0;

  for (let i = 0; i < penuh; i++) bintang.push(<FaStar key={`f${i}`} style={{ color: '#f39c12', fontSize: '13px' }} />);
  if (setengah) bintang.push(<FaStarHalfAlt key="h" style={{ color: '#f39c12', fontSize: '13px' }} />);
  const kosong = 5 - bintang.length;
  for (let i = 0; i < kosong; i++) bintang.push(<FaRegStar key={`e${i}`} style={{ color: '#f39c12', fontSize: '13px' }} />);

  return <div className="mb-2">{bintang}</div>;
}

export default function KartuProduk({ produk }: KartuProdukProps) {
  const { tambahKeKeranjang } = useKeranjang();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(isInWishlist(String(produk.id)));

  const handleWishlist = async () => {
    if (!user) {
      showToast("info", "Silakan login untuk menyimpan wishlist");
      return;
    }

    if (isWishlisted) {
      await removeFromWishlist(String(produk.id));
      setIsWishlisted(false);
      showToast("info", "Dihapus dari wishlist");
    } else {
      await addToWishlist(String(produk.id));
      setIsWishlisted(true);
      showToast("success", "Ditambahkan ke wishlist ❤️");
    }
  };

  const handleAddToCart = () => {
    if (!produk.tersedia) {
      showToast("error", "Stok produk habis");
      return;
    }
    tambahKeKeranjang(produk);
    showToast("success", `${produk.nama} ditambahkan ke keranjang`);
  };

  const tierBadge = (tier: string) => {
    const colors: any = {
      Silver: { bg: '#95a5a6', text: 'white' },
      Gold: { bg: '#f39c12', text: 'white' },
      Platinum: { bg: '#2c3e50', text: '#f39c12' }
    };
    const c = colors[tier] || colors.Silver;
    return (
      <span className="badge d-inline-flex align-items-center gap-1 mb-2" style={{ backgroundColor: c.bg, color: c.text }}>
        <BsShieldCheck size={10} /> {tier}
      </span>
    );
  };

  return (
    <Link href={`/produk/${produk.id}`} className="text-decoration-none">
      <div className="card-modern h-100">
        {/* Image */}
        <div style={{ height: '200px', overflow: 'hidden' }}>
          {produk.gambar ? (
            <Image
              src={produk.gambar}
              alt={produk.nama}
              width={400}
              height={300}
              style={{ objectFit: "cover", width: '100%', height: '100%' }}
              loading="lazy"
            />
          ) : (
            <div className="d-flex align-items-center justify-content-center" style={{ height: "200px", backgroundColor: '#f5f5f5' }}>
              <FaImage size={40} style={{ color: '#e0e0e0' }} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="card-body p-3">
          {tierBadge(produk.mitraTier)}
          <small className="text-muted text-uppercase" style={{ fontSize: '11px' }}>{produk.kategori}</small>

          <h6 className="fw-bold mb-2 mt-1" style={{ fontSize: '14px', lineHeight: '1.4', color: '#2c3e50' }}>
            {produk.nama}
          </h6>

          <small className="text-muted mb-2" style={{ fontSize: '12px' }}>oleh {produk.mitraNama}</small>
          <BintangRating rating={produk.rating} />

          <div className="mt-2">
            <span className="fw-bold" style={{ color: "#e67e22", fontSize: '16px' }}>
              Rp{produk.harga.toLocaleString("id-ID")}
            </span>
          </div>

          {/* Add to Cart Button */}
          {user?.role === 'customer' && (
            <button
              className={`btn w-100 mt-2 ${produk.tersedia ? '' : 'disabled'}`}
              style={{
                backgroundColor: produk.tersedia ? '#e67e22' : '#e0e0e0',
                color: 'white',
                fontSize: '13px',
                padding: '8px',
                borderRadius: '8px'
              }}
              onClick={(e) => {
                e.preventDefault();
                handleAddToCart();
              }}
            >
              <FaShoppingCart size={12} className="me-1" /> {produk.tersedia ? 'Tambah' : 'Habis'}
            </button>
          )}

          {user?.role === 'mitra' && (
            <div className="alert alert-info small mb-0 py-2 text-center mt-2">
              <small>Khusus Customer</small>
            </div>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          className="btn position-absolute top-0 end-0 m-2 rounded-circle bg-white shadow-sm"
          style={{ width: '36px', height: '36px', zIndex: 10 }}
          onClick={(e) => {
            e.preventDefault();
            handleWishlist();
          }}
        >
          <FaHeart size={14} className={isWishlisted ? "text-danger" : "text-muted"} />
        </button>
      </div>
    </Link>
  );
}
