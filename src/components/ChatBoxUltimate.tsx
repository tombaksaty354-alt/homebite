"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
import { 
  FaPaperPlane, FaImage, FaFile, FaDownload, FaTimes, FaSearch, 
  FaCheck, FaCheckDouble, FaMicrophone, FaStop, FaEdit, FaTrash, 
  FaReply, FaShare, FaStar, FaStar as FaStarRegular,
  FaEllipsisV, FaPlay, FaForward, FaCopy
} from "react-icons/fa";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  pesan: string;
  attachment_url?: string;
  attachment_type?: string;
  voice_url?: string;
  voice_duration?: number;
  created_at: string;
  dibaca: boolean;
  read_at?: string;
  reply_to_id?: string;
  reply_to_message?: Message;
  is_edited?: boolean;
  is_deleted?: boolean;
  edited_at?: string;
  forwarded_from_id?: string;
  is_forwarded?: boolean;
  is_starred?: boolean;
  starred_by?: string[];
  reactions?: MessageReaction[];
  replied_message_preview?: ReplyMessage;
}

interface ReplyMessage {
  id: string;
  pesan: string;
  sender_name: string;
  attachment_type?: string;
  voice_duration?: number;
}

interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
  user_name?: string;
}

interface ChatBoxProps {
  partnerId: string;
  partnerName: string;
  partnerRole: string;
  orderId?: string;
  chatType?: string;
  isReadOnly?: boolean;
  onForwardMessage?: (message: Message) => void;
}

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export default function ChatBox({
  partnerId,
  partnerName,
  partnerRole,
  orderId,
  chatType,
  isReadOnly = false,
  onForwardMessage
}: ChatBoxProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<ReplyMessage | null>(null);
  const [showReactionsForMessage, setShowReactionsForMessage] = useState<string | null>(null);
  const [showMessageMenu, setShowMessageMenu] = useState<string | null>(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recordingRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Fetch messages
  useEffect(() => {
    fetchMessages();
  }, [partnerId, orderId]);

  // Real-time subscription for messages
  useEffect(() => {
    const channel = supabase!
      .channel('chat-box-messages-ultimate')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: orderId
            ? `order_id.eq.${orderId}`
            : `and(sender_id.eq.${partnerId},receiver_id.eq.${user?.id}),and(sender_id.eq.${user?.id},receiver_id.eq.${partnerId})`
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);

          if (newMsg.receiver_id === user?.id && !newMsg.dibaca) {
            supabase!
              .from('chat_messages')
              .update({ dibaca: true, read_at: new Date().toISOString() })
              .eq('id', newMsg.id);
          }

          scrollToBottom();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          const updatedMsg = payload.new as Message;
          setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions'
        },
        async () => {
          await fetchReactions();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_status',
          filter: `and(user_id.eq.${partnerId},conversation_partner_id.eq.${user?.id})`
        },
        (payload) => {
          setPartnerTyping(payload.new.is_typing);
        }
      )
      .subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  }, [partnerId, orderId, user?.id]);

  // Typing indicator handler
  useEffect(() => {
    if (!newMessage.trim()) {
      updateTypingStatus(false);
      return;
    }

    updateTypingStatus(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false);
    }, 2000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [newMessage]);

  async function updateTypingStatus(isTyping: boolean) {
    if (!supabase || !user) return;

    try {
      // Upsert typing status
      const { data: existing } = await supabase
        .from('typing_status')
        .select('id')
        .eq('user_id', user.id)
        .eq('conversation_partner_id', partnerId)
        .single();

      if (existing) {
        await supabase
          .from('typing_status')
          .update({ is_typing: isTyping, created_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('typing_status')
          .insert({
            user_id: user.id,
            conversation_partner_id: partnerId,
            is_typing: isTyping
          });
      }
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  }

  async function fetchMessages() {
    if (!supabase || !user || !partnerId) return;

    let query = supabase
      .from("chat_messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`);

    if (orderId) {
      query = query.eq("order_id", orderId);
    }

    if (chatType) {
      query = query.eq("chat_type", chatType);
    }

    const { data } = await query
      .order("created_at", { ascending: true })
      .limit(200);

    if (data) {
      // Fetch reply messages
      const replyIds = data.filter(m => m.reply_to_id).map(m => m.reply_to_id);
      if (replyIds.length > 0) {
        const { data: replyMessages } = await supabase
          .from("chat_messages")
          .select("id, pesan, sender_id, attachment_type, voice_duration")
          .in("id", replyIds);

        const { data: users } = await supabase
          .from("users")
          .select("id, nama")
          .in("id", replyMessages?.map(m => m.sender_id) || []);

        const replyMap: Record<string, ReplyMessage> = {};
        replyMessages?.forEach(rm => {
          const sender = users?.find(u => u.id === rm.sender_id);
          replyMap[rm.id] = {
            id: rm.id,
            pesan: rm.pesan,
            sender_name: sender?.nama || "Unknown",
            attachment_type: rm.attachment_type,
            voice_duration: rm.voice_duration
          };
        });

        const messagesWithReplies = data.map(m => ({
          ...m,
          replied_message_preview: m.reply_to_id ? replyMap[m.reply_to_id] : undefined
        }));

        setMessages(messagesWithReplies);
      } else {
        setMessages(data);
      }

      // Mark unread messages as read
      const unreadIds = data.filter(m => m.receiver_id === user?.id && !m.dibaca).map(m => m.id);
      if (unreadIds.length > 0) {
        await supabase
          .from("chat_messages")
          .update({ dibaca: true, read_at: new Date().toISOString() })
          .in("id", unreadIds);
      }
    }

    await fetchReactions();
    scrollToBottom();
  }

  async function fetchReactions() {
    if (!supabase || messages.length === 0) return;

    const messageIds = messages.map(m => m.id);
    const { data: reactions } = await supabase
      .from("message_reactions")
      .select(`
        *,
        users (nama)
      `)
      .in("message_id", messageIds);

    const reactionsMap: Record<string, MessageReaction[]> = {};
    reactions?.forEach(r => {
      if (!reactionsMap[r.message_id]) {
        reactionsMap[r.message_id] = [];
      }
      reactionsMap[r.message_id].push({
        id: r.id,
        message_id: r.message_id,
        user_id: r.user_id,
        reaction: r.reaction,
        user_name: (r as any).users?.nama || "Unknown"
      });
    });

    setMessages(prev => prev.map(m => ({
      ...m,
      reactions: reactionsMap[m.id] || []
    })));
  }

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  async function sendMessage() {
    if (!supabase || !user || !newMessage.trim() || !partnerId) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from("chat_messages").insert({
        sender_id: user.id,
        receiver_id: partnerId,
        order_id: orderId || null,
        chat_type: chatType || 'support',
        pesan: newMessage,
        reply_to_id: replyToMessage?.id || null,
        dibaca: false,
      });

      if (!error) {
        setNewMessage("");
        setReplyToMessage(null);
        updateTypingStatus(false);
        fetchMessages();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function editMessage(messageId: string, newText: string) {
    if (!supabase || !newText.trim()) return;

    try {
      const { error } = await supabase
        .from("chat_messages")
        .update({ 
          pesan: newText, 
          is_edited: true,
          edited_at: new Date().toISOString() 
        })
        .eq("id", messageId);

      if (!error) {
        setEditingMessage(null);
        fetchMessages();
      }
    } catch (error) {
      console.error("Error editing message:", error);
    }
  }

  async function deleteMessage(messageId: string) {
    if (!supabase) return;

    if (!confirm("Hapus pesan ini?")) return;

    try {
      const { error } = await supabase
        .from("chat_messages")
        .update({ is_deleted: true })
        .eq("id", messageId);

      if (!error) {
        fetchMessages();
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  }

  async function addReaction(messageId: string, emoji: string) {
    if (!supabase || !user) return;

    try {
      const { error } = await supabase
        .from("message_reactions")
        .insert({
          message_id: messageId,
          user_id: user.id,
          reaction: emoji
        });

      if (!error) {
        await fetchReactions();
      }
    } catch (error) {
      console.error("Error adding reaction:", error);
    }

    setShowReactionsForMessage(null);
  }

  async function removeReaction(messageId: string, emoji: string) {
    if (!supabase || !user) return;

    try {
      const { error } = await supabase
        .from("message_reactions")
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", user.id)
        .eq("reaction", emoji);

      if (!error) {
        await fetchReactions();
      }
    } catch (error) {
      console.error("Error removing reaction:", error);
    }
  }

  async function toggleStar(messageId: string) {
    if (!supabase || !user) return;

    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const starredBy = message.starred_by || [];
    const isStarred = starredBy.includes(user.id);

    let newStarredBy: string[];
    if (isStarred) {
      newStarredBy = starredBy.filter(id => id !== user.id);
    } else {
      newStarredBy = [...starredBy, user.id];
    }

    try {
      const { error } = await supabase
        .from("chat_messages")
        .update({ 
          is_starred: newStarredBy.length > 0,
          starred_by: newStarredBy,
          starred_at: newStarredBy.length > 0 ? new Date().toISOString() : null
        })
        .eq("id", messageId);

      if (!error) {
        fetchMessages();
      }
    } catch (error) {
      console.error("Error toggling star:", error);
    }

    setShowMessageMenu(null);
  }

  async function forwardMessage(message: Message) {
    if (onForwardMessage) {
      onForwardMessage(message);
    }
    setShowMessageMenu(null);
  }

  function handleReply(message: Message) {
    const senderName = message.sender_id === user?.id ? "You" : partnerName;
    setReplyToMessage({
      id: message.id,
      pesan: message.pesan,
      sender_name: senderName,
      attachment_type: message.attachment_type,
      voice_duration: message.voice_duration
    });
    setShowMessageMenu(null);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        await uploadVoice(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);

      recordingRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Tidak bisa mengakses mikrofon. Pastikan izin mikrofon sudah diberikan.");
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    setIsRecording(false);
    setRecordingTime(0);
    if (recordingRef.current) {
      clearInterval(recordingRef.current);
    }
  }

  async function uploadVoice(audioBlob: Blob) {
    if (!supabase || !user) return;

    setIsUploading(true);
    try {
      const fileExt = 'webm';
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('voice-messages')
        .upload(filePath, audioBlob);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('voice-messages')
        .getPublicUrl(filePath);

      // Calculate duration (approximate from recording time)
      const duration = recordingTime;

      await supabase.from("chat_messages").insert({
        sender_id: user.id,
        receiver_id: partnerId,
        order_id: orderId || null,
        chat_type: chatType || 'support',
        pesan: "🎤 Voice Message",
        voice_url: urlData.publicUrl,
        voice_duration: duration,
        dibaca: false,
      });

      fetchMessages();
    } catch (error) {
      console.error("Error uploading voice:", error);
      alert("Gagal upload voice message");
    } finally {
      setIsUploading(false);
    }
  }

  function playVoice(voiceUrl: string, messageId: string) {
    if (isPlayingVoice === messageId) {
      audioPlayerRef.current?.pause();
      setIsPlayingVoice(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      audioPlayerRef.current = new Audio(voiceUrl);
      audioPlayerRef.current.play();
      setIsPlayingVoice(messageId);
      audioPlayerRef.current.onended = () => {
        setIsPlayingVoice(null);
      };
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !supabase || !user) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert("Format file tidak didukung. Gunakan JPG, PNG, WebP, GIF, atau PDF");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file maksimal 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      const attachmentType = file.type.startsWith('image/') ? 'image' : 'file';

      await supabase.from("chat_messages").insert({
        sender_id: user.id,
        receiver_id: partnerId,
        order_id: orderId || null,
        chat_type: chatType || 'support',
        pesan: newMessage || `📎 ${file.name}`,
        attachment_url: urlData.publicUrl,
        attachment_type: attachmentType,
        reply_to_id: replyToMessage?.id || null,
        dibaca: false,
      });

      if (!newMessage) setNewMessage("");
      setReplyToMessage(null);
      fetchMessages();
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Gagal upload file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hari ini";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Kemarin";
    } else {
      return date.toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' });
    }
  }

  function groupMessagesByDate(messages: Message[]) {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";

    messages.forEach(msg => {
      const msgDate = formatDate(msg.created_at);
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  }

  function formatDuration(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  const filteredMessages = searchQuery
    ? messages.filter(m => m.pesan.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const groupedMessages = groupMessagesByDate(filteredMessages);

  return (
    <div className="d-flex flex-column" style={{ height: "70vh" }}>
      {/* Chat Header */}
      <div className="card-header bg-white border-bottom">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2" style={{ width: '40px', height: '40px' }}>
              {partnerRole === 'admin' ? '🛡️' : partnerRole === 'mitra' ? '🏪' : '👤'}
            </div>
            <div>
              <h6 className="mb-0">{partnerName}</h6>
              <small className="text-muted">
                {partnerRole === 'admin' ? 'Admin' : partnerRole === 'mitra' ? 'Mitra Penjual' : 'Customer'}
                {isReadOnly && <span className="badge bg-warning text-dark ms-2">👁️ Read-Only</span>}
                {partnerTyping && !isReadOnly && (
                  <span className="badge bg-info text-dark ms-2">✍️ Sedang mengetik...</span>
                )}
              </small>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setShowSearch(!showSearch)}
              title="Cari pesan"
            >
              <FaSearch />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="mt-2">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Cari dalam percakapan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <small className="text-muted">
                Ditemukan {filteredMessages.length} dari {messages.length} pesan
              </small>
            )}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="card-body overflow-auto flex-grow-1 bg-light" style={{ height: "calc(70vh - 130px)" }}>
        {groupedMessages.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <div style={{ fontSize: '48px' }} className="mb-3">💬</div>
            <p>Belum ada pesan. Mulai percakapan!</p>
          </div>
        ) : (
          groupedMessages.map((group, groupIdx) => (
            <div key={groupIdx}>
              {/* Date Separator */}
              <div className="text-center my-3">
                <span className="badge bg-secondary px-3 py-2">{group.date}</span>
              </div>

              {/* Messages */}
              {group.messages.map((msg, idx) => {
                if (msg.is_deleted) {
                  return (
                    <div key={msg.id} className="mb-2 text-center">
                      <small className="text-muted fst-italic">🗑️ Pesan telah dihapus</small>
                    </div>
                  );
                }

                const isFromMe = msg.sender_id === user?.id;
                const showAvatar = idx === 0 || group.messages[idx - 1].sender_id !== msg.sender_id;
                const messageReactions = msg.reactions || [];
                const isStarred = (msg.starred_by || []).includes(user?.id || '');

                return (
                  <div key={msg.id} className={`mb-2 ${isFromMe ? "text-end" : "text-start"}`}>
                    <div className={`d-inline-block ${isFromMe ? "me-2" : "ms-2"}`} style={{ maxWidth: '70%' }}>
                      {/* Message Bubble */}
                      <div className={`p-3 rounded position-relative ${isFromMe ? "bg-primary text-white" : "bg-white shadow-sm"}`}>
                        
                        {/* Reply Preview */}
                        {msg.replied_message_preview && (
                          <div 
                            className={`mb-2 p-2 rounded border-start border-3 ${isFromMe ? "bg-white bg-opacity-25 border-light" : "bg-primary bg-opacity-10 border-primary"} small`}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="fw-bold">↩️ {msg.replied_message_preview.sender_name}</div>
                            <div className="text-truncate" style={{ maxWidth: '250px' }}>
                              {msg.replied_message_preview.attachment_type === 'voice' 
                                ? `🎤 Voice ${msg.replied_message_preview.voice_duration}s`
                                : msg.replied_message_preview.pesan}
                            </div>
                          </div>
                        )}

                        {/* Forwarded Label */}
                        {msg.is_forwarded && (
                          <div className="mb-1 small fst-italic">
                            ↪️ Forwarded
                          </div>
                        )}

                        {/* Text Message */}
                        {msg.pesan && !msg.pesan.startsWith('📎') && msg.pesan !== '🎤 Voice Message' && (
                          editingMessage?.id === msg.id ? (
                            <div>
                              <input
                                type="text"
                                className="form-control form-control-sm mb-2"
                                value={editingMessage.pesan}
                                onChange={(e) => setEditingMessage({...editingMessage, pesan: e.target.value})}
                                onKeyPress={(e) => e.key === 'Enter' && editMessage(msg.id, editingMessage.pesan)}
                              />
                              <div className="d-flex gap-1">
                                <button className="btn btn-sm btn-success" onClick={() => editMessage(msg.id, editingMessage.pesan)}>Save</button>
                                <button className="btn btn-sm btn-secondary" onClick={() => setEditingMessage(null)}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <p className="mb-2" style={{ whiteSpace: 'pre-wrap' }}>{msg.pesan}</p>
                          )
                        )}

                        {/* Attachment */}
                        {msg.attachment_url && (
                          <div className="mt-2">
                            {msg.attachment_type === 'image' ? (
                              <div className="position-relative">
                                <img
                                  src={msg.attachment_url}
                                  alt="Attachment"
                                  className="img-fluid rounded cursor-pointer"
                                  style={{ maxHeight: '300px', cursor: 'pointer' }}
                                  onClick={() => setShowImagePreview(msg.attachment_url!)}
                                />
                                <button
                                  className="btn btn-sm btn-light position-absolute bottom-0 end-0 m-2"
                                  onClick={() => window.open(msg.attachment_url!, '_blank')}
                                  title="Download"
                                >
                                  <FaDownload />
                                </button>
                              </div>
                            ) : (
                              <a
                                href={msg.attachment_url}
                                target="_blank"
                                rel="noreferrer"
                                className={`d-flex align-items-center p-2 rounded ${isFromMe ? "bg-white text-dark" : "bg-light"}`}
                              >
                                <FaFile className="me-2" />
                                <span className="small">📎 Lampiran</span>
                                <FaDownload className="ms-auto" />
                              </a>
                            )}
                          </div>
                        )}

                        {/* Voice Message */}
                        {msg.voice_url && (
                          <div className="mt-2">
                            <button
                              className={`btn btn-sm d-flex align-items-center gap-2 ${isFromMe ? "btn-outline-light" : "btn-outline-primary"}`}
                              onClick={() => playVoice(msg.voice_url!, msg.id)}
                            >
                              {isPlayingVoice === msg.id ? <FaStop /> : <FaPlay />}
                              <span>🎤 Voice Message</span>
                              {msg.voice_duration && <small>({formatDuration(msg.voice_duration)})</small>}
                            </button>
                          </div>
                        )}

                        {/* Message Actions Menu */}
                        {!isReadOnly && (
                          <div className="position-absolute top-0 end-0 mt-1 me-1">
                            <button
                              className="btn btn-sm btn-link p-0"
                              onClick={() => setShowMessageMenu(showMessageMenu === msg.id ? null : msg.id)}
                              style={{ color: isFromMe ? 'white' : 'gray' }}
                            >
                              <FaEllipsisV />
                            </button>

                            {showMessageMenu === msg.id && (
                              <div className="dropdown-menu show position-absolute end-0" style={{ zIndex: 1050 }}>
                                {isFromMe && (
                                  <>
                                    <button className="dropdown-item" onClick={() => { setEditingMessage(msg); setShowMessageMenu(null); }}>
                                      <FaEdit className="me-2" /> Edit
                                    </button>
                                    <button className="dropdown-item text-danger" onClick={() => deleteMessage(msg.id)}>
                                      <FaTrash className="me-2" /> Delete
                                    </button>
                                  </>
                                )}
                                <button className="dropdown-item" onClick={() => handleReply(msg)}>
                                  <FaReply className="me-2" /> Reply
                                </button>
                                <button className="dropdown-item" onClick={() => forwardMessage(msg)}>
                                  <FaForward className="me-2" /> Forward
                                </button>
                                <button className="dropdown-item" onClick={() => toggleStar(msg.id)}>
                                  {isStarred ? <FaStar className="me-2 text-warning" /> : <FaStarRegular className="me-2" />} 
                                  {isStarred ? 'Unstar' : 'Star'}
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Reactions Display */}
                        {messageReactions.length > 0 && (
                          <div className="d-flex flex-wrap gap-1 mt-2">
                            {Object.entries(
                              messageReactions.reduce((acc: any, r) => {
                                if (!acc[r.reaction]) acc[r.reaction] = [];
                                acc[r.reaction].push(r);
                                return acc;
                              }, {})
                            ).map(([emoji, users]: [string, any]) => {
                              const hasUserReaction = users.some((u: any) => u.user_id === user?.id);
                              return (
                                <button
                                  key={emoji}
                                  className={`btn btn-sm rounded-pill ${hasUserReaction ? 'bg-primary text-white' : 'bg-light'}`}
                                  style={{ fontSize: '12px', padding: '2px 6px' }}
                                  onClick={() => hasUserReaction ? removeReaction(msg.id, emoji) : addReaction(msg.id, emoji)}
                                  title={users.map((u: any) => u.user_name).join(', ')}
                                >
                                  {emoji} {users.length}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Timestamp & Read Receipt */}
                        <div className={`d-flex align-items-center mt-2 ${isFromMe ? "justify-content-end" : ""}`}>
                          <small className={isFromMe ? "text-white-50" : "text-muted"}>
                            {formatTime(msg.created_at)}
                            {msg.is_edited && <span className="ms-1 fst-italic">(edited)</span>}
                          </small>
                          {isFromMe && (
                            <span className="ms-1">
                              {msg.dibaca ? (
                                <FaCheckDouble className="text-info" title="Sudah dibaca" />
                              ) : (
                                <FaCheck className="text-white-50" title="Terkirim" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Add Reaction Button */}
                      {!isReadOnly && (
                        <div className="position-relative d-inline-block">
                          <button
                            className="btn btn-sm btn-link p-0 ms-1"
                            onClick={() => setShowReactionsForMessage(showReactionsForMessage === msg.id ? null : msg.id)}
                            style={{ fontSize: '16px' }}
                          >
                            😊
                          </button>

                          {showReactionsForMessage === msg.id && (
                            <div className="position-absolute bg-white shadow-lg rounded p-1 d-flex gap-1" style={{ zIndex: 1050, bottom: '100%' }}>
                              {EMOJI_REACTIONS.map(emoji => {
                                const hasReaction = messageReactions.some(r => r.reaction === emoji && r.user_id === user?.id);
                                return (
                                  <button
                                    key={emoji}
                                    className={`btn btn-sm border-0 ${hasReaction ? 'bg-primary' : ''}`}
                                    onClick={() => hasReaction ? removeReaction(msg.id, emoji) : addReaction(msg.id, emoji)}
                                  >
                                    {emoji}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="card-footer bg-white border-top">
        {/* Reply Preview */}
        {replyToMessage && (
          <div className="mb-2 p-2 bg-light rounded border-start border-3 border-primary">
            <div className="d-flex justify-content-between align-items-center">
              <div className="small">
                <div className="fw-bold">↩️ Replying to {replyToMessage.sender_name}</div>
                <div className="text-muted text-truncate" style={{ maxWidth: '500px' }}>
                  {replyToMessage.attachment_type === 'voice' 
                    ? `🎤 Voice ${replyToMessage.voice_duration}s`
                    : replyToMessage.pesan}
                </div>
              </div>
              <button 
                className="btn btn-sm btn-link text-danger"
                onClick={() => setReplyToMessage(null)}
              >
                <FaTimes />
              </button>
            </div>
          </div>
        )}

        {isReadOnly && (
          <div className="alert alert-info small mb-2 py-2 text-center">
            🔒 Mode Monitoring: Anda hanya dapat melihat percakapan ini
          </div>
        )}

        <div className="input-group">
          {/* File Upload Button */}
          {!isReadOnly && (
            <>
              <button
                className="btn btn-outline-secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isRecording}
                title="Upload foto/file"
              >
                {isUploading ? (
                  <span className="spinner-border spinner-border-sm" />
                ) : (
                  <FaImage />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="d-none"
              />
            </>
          )}

          {/* Message Input */}
          <input
            type="text"
            className="form-control"
            placeholder={
              isRecording ? `Recording... ${formatDuration(recordingTime)}` :
              isReadOnly ? "Mode read-only..." : 
              replyToMessage ? "Reply with a message..." :
              "Ketik pesan..."
            }
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !isReadOnly && sendMessage()}
            disabled={isReadOnly || isLoading || isRecording}
          />

          {/* Voice Record Button */}
          {!isReadOnly && (
            <button
              className={`btn ${isRecording ? 'btn-danger' : 'btn-outline-secondary'}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isUploading}
              title={isRecording ? "Stop recording" : "Record voice"}
            >
              {isRecording ? <FaStop /> : <FaMicrophone />}
            </button>
          )}

          {/* Send Button */}
          <button
            className="btn btn-primary"
            onClick={sendMessage}
            disabled={isReadOnly || isLoading || !newMessage.trim() || isRecording}
          >
            {isLoading ? (
              <span className="spinner-border spinner-border-sm" />
            ) : (
              <FaPaperPlane />
            )}
          </button>
        </div>

        <small className="text-muted mt-1 d-block">
          📎 JPG, PNG, WebP, GIF, PDF • Max 5MB • 🎤 Voice messages supported
        </small>
      </div>

      {/* Image Preview Modal */}
      {showImagePreview && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center"
          style={{ zIndex: 9999 }}
          onClick={() => setShowImagePreview(null)}
        >
          <div className="position-relative">
            <button
              className="btn btn-light position-absolute top-0 end-0 m-2 rounded-circle"
              onClick={() => setShowImagePreview(null)}
              style={{ width: '40px', height: '40px' }}
            >
              <FaTimes />
            </button>
            <img
              src={showImagePreview}
              alt="Preview"
              className="img-fluid rounded"
              style={{ maxHeight: '90vh', maxWidth: '90vw' }}
              onClick={(e) => e.stopPropagation()}
            />
            <a
              href={showImagePreview}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary position-absolute bottom-0 end-0 m-2"
              onClick={(e) => e.stopPropagation()}
            >
              <FaDownload className="me-1" /> Download
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
