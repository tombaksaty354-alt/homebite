"use client";

import { useState, useEffect } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaComments } from "react-icons/fa";
import ChatBoxUltimate from "@/components/ChatBoxUltimate";

export default function ChatOrderPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params?.orderId as string;
  
  const [partnerName, setPartnerName] = useState("Loading...");
  const [partnerRole, setPartnerRole] = useState("");
  const [receiverId, setReceiverId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user && orderId) {
      initChat();
    }
  }, [user, authLoading, orderId]);

  async function initChat() {
    try {
      if (!supabase || !user || !user.id || !orderId) return;

      // Get order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError || !order) {
        alert("Pesanan tidak ditemukan");
        router.push(user.role === "customer" ? "/pesanan" : "/mitra-dashboard/pesanan");
        return;
      }

      // Determine partner
      let partnerId: string;
      if (user.role === "customer") {
        partnerId = order.mitra_id;
        setPartnerRole("mitra");
      } else if (user.role === "mitra") {
        partnerId = order.customer_id;
        setPartnerRole("customer");
      } else {
        alert("Role tidak valid");
        router.push("/");
        return;
      }

      setReceiverId(partnerId);

      // Get partner info
      const { data: partner } = await supabase
        .from("users")
        .select("nama, role")
        .eq("id", partnerId)
        .single();

      if (partner) {
        setPartnerName(partner.nama || "User");
      }

    } catch (err: any) {
      console.error("Init chat error:", err);
      alert("Gagal setup chat: " + err.message);
      router.back();
    }
  }

  if (authLoading) return <div className="container py-5 text-center">Loading...</div>;
  if (!user) return null;

  return (
    <section className="py-5 bg-light">
      <div className="container">
        <div className="mb-4">
          <Link href={user.role === "customer" ? "/pesanan" : "/mitra-dashboard/pesanan"} className="btn btn-outline-secondary btn-sm mb-2">
            <FaArrowLeft className="me-1" /> Kembali
          </Link>
          <h2 className="fw-bold"><FaComments className="me-2" /> Chat Pesanan</h2>
          <p className="text-muted">
            Berbicara dengan <strong>{partnerName}</strong> ({partnerRole === "mitra" ? "Mitra Penjual" : "Customer"})
          </p>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-sm">
              {receiverId && partnerName !== "Loading..." && partnerRole ? (
                <ChatBoxUltimate
                  partnerId={receiverId}
                  partnerName={partnerName}
                  partnerRole={partnerRole}
                  orderId={orderId}
                  chatType="order"
                />
              ) : (
                <div className="card-body text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading chat...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
