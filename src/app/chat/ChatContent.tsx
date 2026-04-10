"use client";

import { useState, useEffect } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaComments, FaUser, FaStore, FaShieldAlt, FaSearch, FaDownload, FaStar } from "react-icons/fa";
import { sendNotification } from "@/lib/notifications";
import ChatBoxUltimate from "@/components/ChatBoxUltimate";
import ForwardModal from "@/components/ForwardModal";
import { exportChatToPDF } from "@/lib/chatExport";

function ChatInner() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mitraIdFromUrl = searchParams.get("mitra_id");
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [messageToForward, setMessageToForward] = useState<any>(null);
  const [showStarredOnly, setShowStarredOnly] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else fetchConversations();
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages();

      const markUnreadAsRead = async () => {
        if (!supabase || !user?.id || !selectedChat) return;

        let query = supabase
          .from("chat_messages")
          .select("id")
          .eq("receiver_id", user.id)
          .eq("sender_id", selectedChat.partnerId)
          .eq("dibaca", false);

        if (selectedChat.orderId) {
          query = query.eq("order_id", selectedChat.orderId);
        }

        const { data } = await query;

        if (data && data.length > 0) {
          const unreadIds = data.map(m => m.id);
          await supabase
            .from("chat_messages")
            .update({ dibaca: true })
            .in("id", unreadIds);

          fetchConversations();
        }
      };

      markUnreadAsRead();

      const channel = supabase!
        .channel('chat-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `or(sender_id.eq.${user?.id},receiver_id.eq.${user?.id})`
          },
          (payload) => {
            const newMsg = payload.new;
            setMessages(prev => [...prev, newMsg]);

            if (newMsg.receiver_id === user?.id && !newMsg.dibaca) {
              supabase!
                .from('chat_messages')
                .update({ dibaca: true })
                .eq('id', newMsg.id);

              fetchConversations();
            }
          }
        )
        .subscribe();

      return () => {
        supabase!.removeChannel(channel);
      };
    }
  }, [selectedChat]);

  useEffect(() => {
    if (user) {
      const channel = supabase!
        .channel('new-conversations')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `receiver_id.eq.${user.id}`
          },
          () => {
            fetchConversations();
          }
        )
        .subscribe();

      return () => {
        supabase!.removeChannel(channel);
      };
    }
  }, [user]);

  useEffect(() => {
    if (mitraIdFromUrl && user) {
      handleMitraChatFromUrl(mitraIdFromUrl);
    }
  }, [mitraIdFromUrl, user]);

  async function handleMitraChatFromUrl(mitraId: string) {
    const { data } = await supabase
      .from("users")
      .select("nama, role")
      .eq("id", mitraId)
      .single();

    if (data) {
      startChat(mitraId, data.role);
    }
  }

  async function fetchConversations() {
    if (!supabase || !user || !user.id) return;

    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      return;
    }

    const convMap: Record<string, any> = {};

    if (data) {
      for (const msg of data) {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;

        if (!convMap[partnerId]) {
          convMap[partnerId] = {
            partnerId,
            lastMessage: msg.pesan,
            lastTime: msg.created_at,
            unread: 0,
            chatType: msg.chat_type || 'order',
            orderId: msg.order_id,
          };
        }

        if (msg.receiver_id === user.id && !msg.dibaca) {
          convMap[partnerId].unread += 1;
        }
      }

      const partnerIds = Object.keys(convMap);
      if (partnerIds.length > 0) {
        const { data: partners } = await supabase
          .from("users")
          .select("id, nama, role")
          .in("id", partnerIds);

        if (partners) {
          partners.forEach(p => {
            if (convMap[p.id]) {
              convMap[p.id].partnerName = p.nama;
              convMap[p.id].partnerRole = p.role;
            }
          });
        }
      }

      setConversations(Object.values(convMap).sort((a, b) =>
        new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
      ));
    }
  }

  async function fetchMessages() {
    if (!supabase || !selectedChat) return;

    let query = supabase
      .from("chat_messages")
      .select("*")
      .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${selectedChat.partnerId}),and(sender_id.eq.${selectedChat.partnerId},receiver_id.eq.${user?.id})`);

    if (selectedChat.orderId) {
      query = query.eq("order_id", selectedChat.orderId);
    }

    const { data } = await query.order("created_at", { ascending: true });
    if (data) {
      setMessages(data);

      const unreadIds = data.filter(m => m.receiver_id === user?.id && !m.dibaca).map(m => m.id);
      if (unreadIds.length > 0) {
        await supabase.from("chat_messages").update({ dibaca: true }).in("id", unreadIds);
        fetchConversations();
      }
    }
  }

  async function sendMessage() {
    if (!supabase || !user || !newMessage.trim() || !selectedChat) return;

    const { error } = await supabase.from("chat_messages").insert({
      sender_id: user.id,
      receiver_id: selectedChat.partnerId,
      order_id: selectedChat.orderId || null,
      chat_type: selectedChat.chatType || 'support',
      pesan: newMessage,
      dibaca: false,
    });

    if (!error) {
      await sendNotification(
        selectedChat.partnerId,
        "💬 Pesan Baru",
        `${user.nama}: ${newMessage.substring(0, 50)}${newMessage.length > 50 ? '...' : ''}`,
        "info",
        "/chat"
      );

      setNewMessage("");
      fetchMessages();
      fetchConversations();
    }
  }

  function handleForwardMessage(message: any) {
    setMessageToForward(message);
    setShowForwardModal(true);
  }

  async function handleExportChat() {
    if (!selectedChat || messages.length === 0) return;

    const exportMessages = messages.map(msg => ({
      id: msg.id,
      sender_name: msg.sender_id === user?.id ? "You" : selectedChat.partnerName,
      sender_role: msg.sender_id === user?.id ? user.role : selectedChat.partnerRole,
      pesan: msg.pesan,
      created_at: msg.created_at,
      attachment_url: msg.attachment_url,
      attachment_type: msg.attachment_type,
      voice_url: msg.voice_url,
      voice_duration: msg.voice_duration,
      is_deleted: msg.is_deleted,
      is_edited: msg.is_edited,
      reactions: msg.reactions || [],
      reply_to: msg.replied_message_preview ? {
        sender_name: msg.replied_message_preview.sender_name,
        pesan: msg.replied_message_preview.pesan
      } : undefined
    }));

    const dateRange = {
      start: new Date(messages[0].created_at).toLocaleDateString('id-ID'),
      end: new Date(messages[messages.length - 1].created_at).toLocaleDateString('id-ID')
    };

    await exportChatToPDF(selectedChat.partnerName, exportMessages, dateRange);
  }

  const filteredConversations = showStarredOnly
    ? conversations.filter(c => c.hasStarred)
    : conversations;

  async function startChat(partnerId: string, partnerRole: string, orderId?: string) {
    if (!user) return;

    let actualPartnerId = partnerId;
    if (partnerId === "admin-id") {
      const { data: adminData } = await supabase
        .from("users")
        .select("id")
        .eq("role", "admin")
        .limit(1)
        .single();

      if (!adminData) {
        console.error("No admin user found in database");
        return;
      }
      actualPartnerId = adminData.id;
    }

    const existing = conversations.find(c => c.partnerId === actualPartnerId && c.orderId === orderId);
    if (existing) {
      setSelectedChat(existing);
      return;
    }

    if (supabase) {
      const { data } = await supabase.from("users").select("nama, role").eq("id", actualPartnerId).single();
      if (data) {
        const newChat = {
          partnerId: actualPartnerId,
          partnerName: data.nama,
          partnerRole: data.role,
          lastMessage: "",
          lastTime: new Date().toISOString(),
          unread: 0,
          chatType: orderId ? 'order' : (partnerRole === 'admin' ? 'admin' : 'support'),
          orderId: orderId || null,
        };
        setSelectedChat(newChat);
      }
    }
  }

  if (loading) return <div className="container py-5 text-center">Loading...</div>;
  if (!user) return null;

  return (
    <section className="py-5 bg-light">
      <div className="container">
        <div className="mb-4">
          <Link href="/" className="btn btn-outline-secondary btn-sm mb-2">
            <FaArrowLeft className="me-1" /> Kembali
          </Link>
          <h2 className="fw-bold"><FaComments className="me-2" /> Pesan</h2>
        </div>

        <div className="row">
          <div className="col-lg-4 mb-3">
            <div className="card shadow-sm">
              <div className="card-header bg-white">
                <h6 className="mb-0">Percakapan</h6>
              </div>
              <div className="list-group list-group-flush" style={{ maxHeight: "600px", overflowY: "auto" }}>
                {conversations.length === 0 ? (
                  <div className="p-4 text-center text-muted">
                    <FaComments size={32} className="mb-2" />
                    <p className="small mb-0">Belum ada percakapan</p>
                  </div>
                ) : (
                  conversations
                    .filter(c => c.partnerName?.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((conv, idx) => (
                      <button
                        key={idx}
                        className={`list-group-item list-group-item-action ${selectedChat?.partnerId === conv.partnerId ? 'active' : ''}`}
                        onClick={() => setSelectedChat(conv)}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center">
                            <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2" style={{ width: '40px', height: '40px' }}>
                              {conv.partnerRole === 'admin' ? <FaShieldAlt /> : conv.partnerRole === 'mitra' ? <FaStore /> : <FaUser />}
                            </div>
                            <div>
                              <div className="fw-bold small">{conv.partnerName || "User"}</div>
                              <div className="text-muted small" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {conv.lastMessage || "Mulai percakapan..."}
                              </div>
                            </div>
                          </div>
                          <div className="text-end">
                            <div className="small text-muted">{new Date(conv.lastTime).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}</div>
                            {conv.unread > 0 && (
                              <span className="badge bg-danger rounded-pill">{conv.unread}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                )}
              </div>
            </div>

            <div className="card shadow-sm mt-3">
              <div className="card-body">
                <h6 className="fw-bold mb-3">Mulai Chat Baru</h6>
                {user.role === "customer" && (
                  <button className="btn btn-outline-primary btn-sm w-100 mb-2" onClick={() => router.push("/chat/support")}>
                    <FaShieldAlt className="me-2" /> Hubungi Admin
                  </button>
                )}
                {user.role === "mitra" && (
                  <button className="btn btn-outline-primary btn-sm w-100 mb-2" onClick={() => startChat("admin-id", "admin")}>
                    <FaShieldAlt className="me-2" /> Hubungi Admin
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            {selectedChat ? (
              <div className="card shadow-sm">
                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2" style={{ width: '35px', height: '35px' }}>
                      {selectedChat.partnerRole === 'admin' ? <FaShieldAlt /> : selectedChat.partnerRole === 'mitra' ? <FaStore /> : <FaUser />}
                    </div>
                    <div>
                      <h6 className="mb-0">{selectedChat.partnerName}</h6>
                      <small className="text-muted">{selectedChat.partnerRole === 'admin' ? 'Admin Homebite' : selectedChat.partnerRole === 'mitra' ? 'Mitra Penjual' : 'Customer'}</small>
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setShowStarredOnly(!showStarredOnly)}
                      title="Show starred messages"
                    >
                      <FaStar className={showStarredOnly ? "text-warning" : ""} /> Starred
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={handleExportChat}
                      title="Export chat to PDF"
                    >
                      <FaDownload /> Export
                    </button>
                  </div>
                </div>

                <ChatBoxUltimate
                  partnerId={selectedChat.partnerId}
                  partnerName={selectedChat.partnerName}
                  partnerRole={selectedChat.partnerRole}
                  orderId={selectedChat.orderId}
                  chatType={selectedChat.chatType}
                  onForwardMessage={handleForwardMessage}
                />
              </div>
            ) : (
              <div className="card shadow-sm text-center py-5" style={{ height: "70vh" }}>
                <div className="d-flex flex-column align-items-center justify-content-center h-100">
                  <FaComments size={64} className="text-muted mb-3" />
                  <h5 className="text-muted">Pilih percakapan untuk memulai</h5>
                  <p className="text-muted small">atau mulai chat baru dari menu di samping</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ForwardModal
        isOpen={showForwardModal}
        onClose={() => setShowForwardModal(false)}
        messageToForward={messageToForward}
      />
    </section>
  );
}

export default function ChatPage() {
  return (
    <ChatInner />
  );
}
