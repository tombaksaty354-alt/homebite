"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaComments, FaUser, FaStore, FaSearch, FaShieldAlt, FaEye, FaUsers, FaDownload, FaStar } from "react-icons/fa";
import { sendNotification } from "@/lib/notifications";
import ChatBoxUltimate from "@/components/ChatBoxUltimate";
import ForwardModal from "@/components/ForwardModal";
import { exportChatToPDF } from "@/lib/chatExport";

export default function AdminChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showAllChats, setShowAllChats] = useState(false);
  const [allUserChats, setAllUserChats] = useState<any[]>([]);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [messageToForward, setMessageToForward] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.role !== "admin") router.push("/");
      else {
        fetchAllConversations();
        fetchAllUserChats();
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
      
      // Real-time subscription for messages
      const channel = supabase!
        .channel('admin-chat-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `or(sender_id.eq.${user?.id},receiver_id.eq.${user?.id},sender_id.eq.${selectedChat.userId},receiver_id.eq.${selectedChat.userId})`
          },
          (payload) => {
            const newMsg = payload.new;
            setMessages(prev => [...prev, newMsg]);
            
            if (newMsg.receiver_id === user?.id && !newMsg.dibaca) {
              supabase!
                .from('chat_messages')
                .update({ dibaca: true })
                .eq('id', newMsg.id);
            }
            
            fetchAllConversations();
          }
        )
        .subscribe();

      return () => {
        supabase!.removeChannel(channel);
      };
    }
  }, [selectedChat]);

  useEffect(() => {
    // Real-time for all conversations
    const channel = supabase!
      .channel('admin-all-chats')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        () => {
          fetchAllConversations();
          fetchAllUserChats();
        }
      )
      .subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  }, []);

  async function fetchAllConversations() {
    if (!supabase) return;

    // Get all messages
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      const convMap: Record<string, any> = {};

      for (const msg of data) {
        const otherUserId = msg.receiver_id === user?.id ? msg.sender_id : msg.receiver_id;

        if (!convMap[otherUserId]) {
          convMap[otherUserId] = {
            userId: otherUserId,
            lastMessage: msg.pesan,
            lastTime: msg.created_at,
            unread: 0,
            chatType: msg.chat_type || 'order',
            orderId: msg.order_id,
          };
        }

        if (msg.receiver_id === user?.id && !msg.dibaca) {
          convMap[otherUserId].unread += 1;
        }
      }

      const userIds = Object.keys(convMap);
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from("users")
          .select("id, nama, role")
          .in("id", userIds);

        if (users) {
          users.forEach(u => {
            if (convMap[u.id]) {
              convMap[u.id].userName = u.nama;
              convMap[u.id].userRole = u.role;
            }
          });
        }
      }

      setConversations(Object.values(convMap).sort((a, b) =>
        new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
      ));
    }
  }

  async function fetchAllUserChats() {
    if (!supabase) return;

    // Get ALL conversations between any users (for monitoring)
    const { data: allMessages } = await supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (allMessages) {
      const chatMap: Record<string, any> = {};

      for (const msg of allMessages) {
        // Create unique key for each conversation pair
        const participants = [msg.sender_id, msg.receiver_id].sort();
        const chatKey = `${participants[0]}_${participants[1]}${msg.order_id ? `_order_${msg.order_id}` : ''}`;

        if (!chatMap[chatKey]) {
          chatMap[chatKey] = {
            chatKey,
            senderId: msg.sender_id,
            receiverId: msg.receiver_id,
            lastMessage: msg.pesan,
            lastTime: msg.created_at,
            chatType: msg.chat_type || 'order',
            orderId: msg.order_id,
            messageCount: 0,
          };
        }

        chatMap[chatKey].messageCount++;
      }

      // Fetch all user names
      const allUserIds = [...new Set(allMessages.flatMap(m => [m.sender_id, m.receiver_id]))];
      const { data: users } = await supabase
        .from("users")
        .select("id, nama, role")
        .in("id", allUserIds);

      const userMap: Record<string, any> = {};
      users?.forEach(u => {
        userMap[u.id] = u;
      });

      // Enrich with user info
      const enrichedChats = Object.values(chatMap).map(chat => ({
        ...chat,
        senderName: userMap[chat.senderId]?.nama || 'Unknown',
        senderRole: userMap[chat.senderId]?.role || 'unknown',
        receiverName: userMap[chat.receiverId]?.nama || 'Unknown',
        receiverRole: userMap[chat.receiverId]?.role || 'unknown',
      }));

      setAllUserChats(enrichedChats.sort((a, b) =>
        new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
      ));
    }
  }

  async function fetchMessages() {
    if (!supabase || !selectedChat || !user) return;

    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedChat.userId}),and(sender_id.eq.${selectedChat.userId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data);
      
      // Mark as read
      const unreadIds = data.filter(m => m.receiver_id === user?.id && !m.dibaca).map(m => m.id);
      if (unreadIds.length > 0) {
        await supabase.from("chat_messages").update({ dibaca: true }).in("id", unreadIds);
        fetchAllConversations();
      }
    }
  }

  async function sendMessage() {
    if (!supabase || !user || !newMessage.trim() || !selectedChat) return;

    const { error } = await supabase.from("chat_messages").insert({
      sender_id: user.id,
      receiver_id: selectedChat.userId,
      chat_type: selectedChat.chatType || 'admin',
      pesan: newMessage,
      dibaca: false,
    });

    if (!error) {
      // Send notification
      await sendNotification(
        selectedChat.userId,
        "💬 Pesan dari Admin",
        `${user.nama}: ${newMessage.substring(0, 50)}${newMessage.length > 50 ? '...' : ''}`,
        "info",
        "/chat"
      );
      
      setNewMessage("");
      fetchMessages();
      fetchAllConversations();
    }
  }

  async function viewUserChat(chat: any) {
    setSelectedChat({
      userId: chat.senderId === user?.id ? chat.receiverId : chat.senderId,
      userName: chat.senderId === user?.id ? chat.receiverName : chat.senderName,
      userRole: chat.senderId === user?.id ? chat.receiverRole : chat.senderRole,
      chatType: chat.chatType,
      orderId: chat.orderId,
    });
  }

  function handleForwardMessage(message: any) {
    setMessageToForward(message);
    setShowForwardModal(true);
  }

  async function handleExportChat() {
    if (!selectedChat || messages.length === 0) return;

    const exportMessages = messages.map(msg => ({
      id: msg.id,
      sender_name: msg.sender_id === user?.id ? "You (Admin)" : selectedChat.userName,
      sender_role: msg.sender_id === user?.id ? "admin" : selectedChat.userRole,
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

    await exportChatToPDF(selectedChat.userName, exportMessages, dateRange);
  }

  if (loading) return <div className="container py-5 text-center">Loading...</div>;
  if (!user || user.role !== "admin") return null;

  const filteredConvs = conversations.filter(c => {
    const matchSearch = c.userName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = filterType === "all" || c.chatType === filterType;
    return matchSearch && matchFilter;
  });

  return (
    <section className="py-5 bg-light">
      <div className="container">
        <div className="mb-4">
          <Link href="/admin" className="btn btn-outline-secondary btn-sm mb-2">
            <FaArrowLeft className="me-1" /> Kembali ke Dashboard
          </Link>
          <h2 className="fw-bold"><FaComments className="me-2" /> Manajemen & Monitoring Chat</h2>
          <p className="text-muted">Kelola percakapan dan monitor semua chat antar user</p>
        </div>

        {/* Tabs */}
        <div className="card shadow-sm mb-4">
          <div className="card-body p-2">
            <div className="d-flex gap-2">
              <button 
                className={`btn ${!showAllChats ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setShowAllChats(false)}
              >
                <FaComments className="me-2" /> Chat Saya
              </button>
              <button 
                className={`btn ${showAllChats ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setShowAllChats(true)}
              >
                <FaEye className="me-2" /> Monitor Semua Chat
              </button>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Conversation List */}
          <div className="col-lg-4 mb-3">
            <div className="card shadow-sm">
              <div className="card-header bg-white">
                {!showAllChats ? (
                  <>
                    <div className="input-group input-group-sm mb-2">
                      <span className="input-group-text"><FaSearch /></span>
                      <input type="text" className="form-control" placeholder="Cari user..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <div className="d-flex gap-2">
                      <button className={`btn btn-sm ${filterType === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setFilterType("all")}>Semua</button>
                      <button className={`btn btn-sm ${filterType === 'admin' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setFilterType("admin")}>Support</button>
                    </div>
                  </>
                ) : (
                  <div className="d-flex align-items-center">
                    <FaUsers className="me-2" />
                    <strong>Semua Percakapan User</strong>
                  </div>
                )}
              </div>
              <div className="list-group list-group-flush" style={{ maxHeight: "600px", overflowY: "auto" }}>
                {!showAllChats ? (
                  // Admin's own conversations
                  filteredConvs.length === 0 ? (
                    <div className="p-4 text-center text-muted">
                      <FaComments size={32} className="mb-2" />
                      <p className="small mb-0">Belum ada percakapan</p>
                    </div>
                  ) : (
                    filteredConvs.map((conv, idx) => (
                      <button
                        key={idx}
                        className={`list-group-item list-group-item-action ${selectedChat?.userId === conv.userId ? 'active' : ''}`}
                        onClick={() => setSelectedChat(conv)}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center">
                            <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2" style={{ width: '40px', height: '40px' }}>
                              {conv.userRole === 'admin' ? <FaShieldAlt /> : conv.userRole === 'mitra' ? <FaStore /> : <FaUser />}
                            </div>
                            <div>
                              <div className="fw-bold small">{conv.userName || "User"}</div>
                              <div className="text-muted small">{conv.userRole === 'mitra' ? 'Mitra' : 'Customer'}</div>
                            </div>
                          </div>
                          <div className="text-end">
                            <div className="small text-muted">{new Date(conv.lastTime).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}</div>
                            {conv.unread > 0 && (
                              <span className="badge bg-danger rounded-pill">{conv.unread}</span>
                            )}
                          </div>
                        </div>
                        <div className="small text-muted mt-1" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {conv.lastMessage}
                        </div>
                      </button>
                    ))
                  )
                ) : (
                  // All user-to-user conversations (monitoring)
                  allUserChats.length === 0 ? (
                    <div className="p-4 text-center text-muted">
                      <FaUsers size={32} className="mb-2" />
                      <p className="small mb-0">Belum ada percakapan</p>
                    </div>
                  ) : (
                    allUserChats.map((chat, idx) => (
                      <button
                        key={idx}
                        className="list-group-item list-group-item-action"
                        onClick={() => viewUserChat(chat)}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="small">
                            <span className="badge bg-primary me-1">
                              {chat.senderRole === 'admin' ? 'Admin' : chat.senderRole === 'mitra' ? 'Mitra' : 'Customer'}
                            </span>
                            <strong>{chat.senderName}</strong>
                          </div>
                          <span className="text-muted small">→</span>
                          <div className="small text-end">
                            <span className="badge bg-secondary me-1">
                              {chat.receiverRole === 'admin' ? 'Admin' : chat.receiverRole === 'mitra' ? 'Mitra' : 'Customer'}
                            </span>
                            <strong>{chat.receiverName}</strong>
                          </div>
                        </div>
                        <div className="small text-muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {chat.lastMessage}
                        </div>
                        <div className="d-flex justify-content-between mt-1">
                          <small className="text-muted">{chat.messageCount} pesan</small>
                          <small className="text-muted">{new Date(chat.lastTime).toLocaleString("id-ID")}</small>
                        </div>
                      </button>
                    ))
                  )
                )}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="col-lg-8">
            {selectedChat ? (
              <div className="card shadow-sm">
                {/* Chat Header with Actions */}
                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2" style={{ width: '40px', height: '40px' }}>
                      {selectedChat.userRole === 'mitra' ? <FaStore /> : selectedChat.userRole === 'admin' ? <FaShieldAlt /> : <FaUser />}
                    </div>
                    <div>
                      <h6 className="mb-0">{selectedChat.userName}</h6>
                      <small className="text-muted">
                        {selectedChat.userRole === 'admin' ? 'Admin' : selectedChat.userRole === 'mitra' ? 'Mitra Penjual' : 'Customer'}
                        {showAllChats && <span className="badge bg-info ms-2">🔍 Monitoring</span>}
                      </small>
                    </div>
                  </div>
                  <div className="d-flex gap-2 align-items-center">
                    {showAllChats && (
                      <span className="badge bg-warning text-dark">
                        <FaEye className="me-1" /> Mode Monitor
                      </span>
                    )}
                    <button 
                      className="btn btn-sm btn-outline-secondary"
                      onClick={handleExportChat}
                      title="Export chat to PDF"
                    >
                      <FaDownload /> Export
                    </button>
                  </div>
                </div>
                
                {/* ChatBoxUltimate Component */}
                <ChatBoxUltimate
                  partnerId={selectedChat.userId}
                  partnerName={selectedChat.userName}
                  partnerRole={selectedChat.userRole}
                  chatType={selectedChat.chatType}
                  isReadOnly={showAllChats}
                  onForwardMessage={handleForwardMessage}
                />
              </div>
            ) : (
              <div className="card shadow-sm text-center" style={{ height: "70vh" }}>
                <div className="d-flex flex-column align-items-center justify-content-center h-100">
                  <FaComments size={64} className="text-muted mb-3" />
                  <h5 className="text-muted">Pilih percakapan</h5>
                  <p className="text-muted small">Pilih user di sebelah kiri untuk melihat dan membalas pesan</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Forward Modal */}
      <ForwardModal
        isOpen={showForwardModal}
        onClose={() => setShowForwardModal(false)}
        messageToForward={messageToForward}
      />
    </section>
  );
}
