"use client";

import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { FaHeart, FaShoppingBag } from "react-icons/fa";
import KartuProduk from "@/components/KartuProduk";
import Link from "next/link";

export default function WishlistPage() {
  const { user, loading } = useAuth();
  const { wishlist, loading: wishlistLoading } = useWishlist();
  const router = useRouter();

  if (loading) return <div className="container py-5 text-center">Loading...</div>;
  
  if (!user) {
    return (
      <section className="py-5">
        <div className="container text-center py-5">
          <FaHeart size={60} className="text-danger mb-3" />
          <h2 className="fw-bold">Silakan Login</h2>
          <p className="text-muted">Anda perlu login untuk melihat wishlist</p>
          <button className="btn text-white" style={{ backgroundColor: "#e67e22" }} onClick={() => router.push('/login')}>
            Masuk Sekarang
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="py-5 bg-light">
      <div className="container">
        <div className="d-flex align-items-center mb-4">
          <FaHeart className="text-danger me-2" size={24} />
          <h2 className="fw-bold mb-0">Wishlist Saya</h2>
        </div>

        {wishlistLoading ? (
          <div className="text-center py-5">Loading...</div>
        ) : wishlist.length === 0 ? (
          <div className="card shadow-sm text-center py-5">
            <FaHeart size={48} className="text-muted mb-3" />
            <h5 className="text-muted">Wishlist Anda masih kosong</h5>
            <p className="text-muted">Temukan produk favorit dan simpan di sini</p>
            <Link href="/produk" className="btn text-white" style={{ backgroundColor: "#e67e22" }}>
              <FaShoppingBag className="me-2" /> Jelajahi Produk
            </Link>
          </div>
        ) : (
          <>
            <p className="text-muted mb-3">{wishlist.length} produk disimpan</p>
            <div className="row">
              {wishlist.map((item) => (
                item.produk && (
                  <div key={item.id} className="col-md-6 col-lg-4 col-xl-3 mb-4">
                    <KartuProduk produk={item.produk} />
                  </div>
                )
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
