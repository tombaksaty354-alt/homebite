"use client";

import Link from "next/link";
import { FaStar, FaStarHalfAlt, FaRegStar, FaHeart, FaShoppingCart, FaImage } from "react-icons/fa";
import { BsShieldCheck } from "react-icons/bs";
import { useKeranjang } from "@/context/KeranjangContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { showToast } from "@/components/ToastNotification";

interface ProdukCardProps {
  produk: any;
}

function StarRating({ rating }: { rating?: number }) {
  if (!rating) return null;
  const bintang = [];
  const penuh = Math.floor(rating);
  const setengah = rating % 1 !== 0;
  for (let i = 0; i < penuh; i++) bintang.push(<FaStar key={`f${i}`} className="text-warning" />);
  if (setengah) bintang.push(<FaStarHalfAlt key="h" className="text-warning" />);
  const kosong = 5 - bintang.length;
  for (let i = 0; i < kosong; i++) bintang.push(<FaRegStar key={`e${i}`} className="text-warning" />);
  return <div className="mb-2">{bintang}</div>;
}

export default function ProdukCard({ produk }: ProdukCardProps) {
  const { tambahKeKeranjang } = useKeranjang();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(isInWishlist(produk.id));

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      showToast("info", "Silakan login untuk menyimpan wishlist");
      return;
    }
    
    if (isWishlisted) {
      await removeFromWishlist(produk.id);
      setIsWishlisted(false);
      showToast("info", "Dihapus dari wishlist");
    } else {
      await addToWishlist(produk.id);
      setIsWishlisted(true);
      showToast("success", "Ditambahkan ke wishlist ❤️");
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!produk.tersedia) {
      showToast("error", "Stok produk habis");
      return;
    }
    tambahKeKeranjang(produk);
    showToast("success", `${produk.nama} ditambahkan ke keranjang`);
  };

  const tierBadge = (tier: string) => {
    const colors: any = {
      Silver: { bg: 'bg-secondary', text: 'text-white' },
      Gold: { bg: 'bg-warning', text: 'text-dark' },
      Platinum: { bg: 'bg-dark', text: 'text-warning' }
    };
    const c = colors[tier] || colors.Silver;
    return <span className={`badge ${c.bg} ${c.text} d-inline-flex align-items-center gap-1 mb-2`}><BsShieldCheck /> {tier}</span>;
  };

  return (
    <div className="card h-100 shadow-sm hover-shadow transition-shadow position-relative">
      {/* Wishlist Button */}
      <button
        className="btn btn-sm position-absolute top-0 end-0 m-2 rounded-circle bg-white shadow-sm"
        style={{ zIndex: 10, width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={handleWishlist}
      >
        <FaHeart className={isWishlisted ? "text-danger" : "text-muted"} />
      </button>

      <Link href={`/produk/${produk.id}`} className="text-decoration-none">
        {produk.gambar ? (
          <img 
            src={produk.gambar} 
            className="card-img-top" 
            alt={produk.nama} 
            loading="lazy"
            style={{ height: "220px", objectFit: "cover", width: '100%' }} 
          />
        ) : (
          <div className="card-img-top d-flex align-items-center justify-content-center bg-light" style={{ height: "220px" }}>
            <FaImage size={48} className="text-muted" />
          </div>
        )}
      </Link>
      
      <div className="card-body d-flex flex-column p-3">
        {tierBadge(produk.mitraTier)}
        <small className="text-muted text-uppercase mb-1">{produk.kategori}</small>
        
        <Link href={`/produk/${produk.id}`} className="text-decoration-none text-dark">
          <h6 className="card-title fw-bold mb-1">{produk.nama}</h6>
        </Link>
        
        <small className="text-muted mb-2">oleh {produk.mitraNama}</small>
        <StarRating rating={produk.rating} />
        
        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-center">
            <span className="fs-5 fw-bold" style={{ color: "#e67e22" }}>
              Rp{produk.harga.toLocaleString("id-ID")}
            </span>
          </div>
          
          <div className="d-grid gap-2 mt-2">
            {user?.role === 'customer' && (
              <button
                className={`btn btn-sm ${produk.tersedia ? 'btn-outline-primary' : 'btn-outline-secondary disabled'}`}
                onClick={handleAddToCart}
              >
                <FaShoppingCart className="me-1" /> {produk.tersedia ? 'Tambah' : 'Habis'}
              </button>
            )}
            {user?.role === 'mitra' && (
              <div className="alert alert-info small mb-0 py-2 text-center">
                <small>Khusus Customer</small>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
