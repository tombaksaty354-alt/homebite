"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaPaperPlane, FaComments, FaUser, FaStore } from "react-icons/fa";

export default function ChatOrderPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params?.orderId as string;
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [partnerName, setPartnerName] = useState("Loading...");
  const [partnerRole, setPartnerRole] = useState("");
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && user && orderId) {
      initChat();
    }
  }, [user, authLoading, orderId]);

  useEffect(() => {
    if (receiverId && orderId && user?.id) {
      fetchMessages();
      
      // Subscribe to real-time messages
      const channel = supabase
        ?.channel(`chat:${orderId}`)
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'chat_messages',
            filter: `order_id=eq.${orderId}`
          },
          (payload) => {
            setMessages(prev => {
              // Prevent duplicates
              if (prev.some(m => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
            // Auto scroll
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
          }
        )
        .subscribe();

      return () => {
        if (channel) {
          supabase?.removeChannel(channel);
        }
      };
    }
  }, [receiverId, orderId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  async function fetchMessages() {
    if (!supabase || !orderId) return;

    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
      
      // Mark as read
      if (user) {
        const unreadIds = data.filter((m: any) => m.receiver_id === user.id && !m.dibaca).map((m: any) => m.id);
        if (unreadIds.length > 0) {
          await supabase.from("chat_messages").update({ dibaca: true }).in("id", unreadIds);
        }
      }
    }
  }

  async function sendMessage() {
    if (!supabase || !user || !newMessage.trim() || !receiverId || !orderId) return;

    const { error } = await supabase.from("chat_messages").insert({
      sender_id: user.id,
      receiver_id: receiverId,
      order_id: orderId,
      chat_type: "order",
      pesan: newMessage.trim(),
      dibaca: false,
    });

    if (error) {
      alert("Gagal mengirim pesan: " + error.message);
    } else {
      setNewMessage("");
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
            <div className="card shadow-sm" style={{ height: "70vh" }}>
              <div className="card-header bg-white">
                <div className="d-flex align-items-center">
                  <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2" style={{ width: '40px', height: '40px' }}>
                    {partnerRole === "mitra" ? <FaStore /> : <FaUser />}
                  </div>
                  <div>
                    <h6 className="mb-0">{partnerName}</h6>
                    <small className="text-muted">Online</small>
                  </div>
                </div>
              </div>
              <div className="card-body overflow-auto" style={{ height: "calc(70vh - 130px)" }}>
                {messages.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <FaComments size={48} className="mb-3" />
                    <p>Mulai percakapan tentang pesanan ini...</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} className={`mb-3 ${msg.sender_id === user.id ? "text-end" : "text-start"}`}>
                      <div className={`d-inline-block p-3 rounded ${msg.sender_id === user.id ? "bg-primary text-white" : "bg-light"}`} style={{ maxWidth: '70%' }}>
                        <p className="mb-0">{msg.pesan}</p>
                      </div>
                      <div className="small text-muted mt-1">
                        {new Date(msg.created_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="card-footer bg-white">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ketik pesan..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  />
                  <button className="btn btn-primary" onClick={sendMessage} disabled={!newMessage.trim()}>
                    <FaPaperPlane />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
