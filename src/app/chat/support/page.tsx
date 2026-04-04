"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaPaperPlane, FaShieldAlt, FaComments } from "react-icons/fa";

export default function ChatSupportPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [adminId, setAdminId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else {
        fetchAdmin();
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (adminId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [adminId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchAdmin() {
    if (!supabase) return;
    // Get first admin user
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("role", "admin")
      .limit(1)
      .single();

    if (data) {
      setAdminId(data.id);
    }
  }

  async function fetchMessages() {
    if (!supabase || !user || !adminId) return;

    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${adminId}),and(sender_id.eq.${adminId},receiver_id.eq.${user.id})`)
      .eq("chat_type", "admin")
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data);
      
      // Mark as read
      const unreadIds = data.filter(m => m.receiver_id === user?.id && !m.dibaca).map(m => m.id);
      if (unreadIds.length > 0) {
        await supabase.from("chat_messages").update({ dibaca: true }).in("id", unreadIds);
      }
    }
  }

  async function sendMessage() {
    if (!supabase || !user || !newMessage.trim() || !adminId) return;

    const { error } = await supabase.from("chat_messages").insert({
      sender_id: user.id,
      receiver_id: adminId,
      chat_type: "admin",
      pesan: newMessage,
      dibaca: false,
    });

    if (!error) {
      setNewMessage("");
      fetchMessages();
    }
  }

  if (loading) return <div className="container py-5 text-center">Loading...</div>;
  if (!user) return null;

  return (
    <section className="py-5 bg-light">
      <div className="container">
        <div className="mb-4">
          <Link href="/chat" className="btn btn-outline-secondary btn-sm mb-2">
            <FaArrowLeft className="me-1" /> Kembali
          </Link>
          <h2 className="fw-bold"><FaShieldAlt className="me-2" /> Chat dengan Admin</h2>
          <p className="text-muted">Hubungi tim support Homebite untuk bantuan atau komplain</p>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-sm" style={{ height: "70vh" }}>
              <div className="card-header bg-white d-flex align-items-center">
                <div className="rounded-circle bg-danger text-white d-flex align-items-center justify-content-center me-2" style={{ width: '40px', height: '40px' }}>
                  <FaShieldAlt />
                </div>
                <div>
                  <h6 className="mb-0">Admin Homebite</h6>
                  <small className="text-muted">Online</small>
                </div>
              </div>
              <div className="card-body overflow-auto" style={{ height: "calc(70vh - 130px)" }}>
                {messages.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <FaComments size={48} className="mb-3" />
                    <p>Selamat datang! Ada yang bisa kami bantu?</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} className={`mb-3 ${msg.sender_id === user?.id ? "text-end" : "text-start"}`}>
                      <div className={`d-inline-block p-3 rounded ${msg.sender_id === user?.id ? "bg-primary text-white" : "bg-light"}`} style={{ maxWidth: '70%' }}>
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
                    placeholder="Ketik pesan untuk admin..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  />
                  <button className="btn btn-primary" onClick={sendMessage}>
                    <FaPaperPlane />
                  </button>
                </div>
                <small className="text-muted mt-2 d-block">Admin akan merespons dalam waktu 1x24 jam</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
