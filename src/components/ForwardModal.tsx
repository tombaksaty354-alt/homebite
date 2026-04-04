"use client";

import { useState, useEffect } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
import { FaTimes, FaUser, FaStore, FaShieldAlt, FaForward } from "react-icons/fa";

interface Message {
  id: string;
  pesan: string;
  sender_id: string;
  attachment_url?: string;
  attachment_type?: string;
  voice_url?: string;
  voice_duration?: number;
}

interface ForwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageToForward: Message | null;
}

export default function ForwardModal({ isOpen, onClose, messageToForward }: ForwardModalProps) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [includeMessage, setIncludeMessage] = useState(true);
  const [forwardMessage, setForwardMessage] = useState("");
  const [isForwarding, setIsForwarding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchContacts();
      setSelectedContacts([]);
      setForwardMessage("");
      setIncludeMessage(true);
    }
  }, [isOpen]);

  async function fetchContacts() {
    if (!supabase || !user) return;

    // Get all users except current user
    const { data } = await supabase
      .from("users")
      .select("id, nama, role")
      .neq("id", user.id);

    if (data) {
      setContacts(data);
    }
  }

  function toggleContact(userId: string) {
    setSelectedContacts(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  }

  function selectAll() {
    setSelectedContacts(contacts.map(c => c.id));
  }

  async function handleForward() {
    if (!supabase || !user || !messageToForward || selectedContacts.length === 0) return;

    setIsForwarding(true);

    try {
      const forwardPromises = selectedContacts.map(async (contactId) => {
        const messageContent = includeMessage 
          ? forwardMessage 
            ? `${forwardMessage}\n\n--- Forwarded Message ---\n${messageToForward.pesan}`
            : `--- Forwarded Message ---\n${messageToForward.pesan}`
          : forwardMessage || messageToForward.pesan;

        const { error } = await supabase.from("chat_messages").insert({
          sender_id: user.id,
          receiver_id: contactId,
          order_id: null,
          chat_type: 'support',
          pesan: messageContent,
          attachment_url: messageToForward.attachment_url || null,
          attachment_type: messageToForward.attachment_type || null,
          voice_url: messageToForward.voice_url || null,
          voice_duration: messageToForward.voice_duration || null,
          forwarded_from_id: messageToForward.id,
          is_forwarded: true,
          dibaca: false,
        });

        if (error) throw error;
      });

      await Promise.all(forwardPromises);

      alert(`Pesan berhasil di-forward ke ${selectedContacts.length} kontak`);
      onClose();
    } catch (error) {
      console.error("Error forwarding message:", error);
      alert("Gagal forward pesan");
    } finally {
      setIsForwarding(false);
    }
  }

  const filteredContacts = contacts.filter(c => 
    c.nama?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen || !messageToForward) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center"
      style={{ zIndex: 9998 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded shadow-lg w-100"
        style={{ maxWidth: '600px', maxHeight: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <FaForward className="me-2" />
            Forward Pesan
          </h5>
          <button className="btn btn-sm btn-link" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Message Preview */}
        <div className="p-3 border-bottom bg-light">
          <small className="text-muted">Pesan yang akan di-forward:</small>
          <div className="mt-2 p-2 bg-white rounded">
            {messageToForward.attachment_type === 'image' && (
              <div className="mb-2 text-muted small">📎 Gambar</div>
            )}
            {messageToForward.voice_url && (
              <div className="mb-2 text-muted small">🎤 Voice Message ({messageToForward.voice_duration}s)</div>
            )}
            <div>{messageToForward.pesan}</div>
          </div>
        </div>

        {/* Contacts List */}
        <div className="p-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">Pilih Kontak ({selectedContacts.length} dipilih)</h6>
            <button className="btn btn-sm btn-outline-primary" onClick={selectAll}>
              Pilih Semua
            </button>
          </div>

          <input
            type="text"
            className="form-control mb-3"
            placeholder="Cari kontak..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {filteredContacts.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <FaUser size={32} className="mb-2" />
              <p>Tidak ada kontak ditemukan</p>
            </div>
          ) : (
            <div className="list-group">
              {filteredContacts.map((contact) => {
                const isSelected = selectedContacts.includes(contact.id);
                return (
                  <button
                    key={contact.id}
                    className={`list-group-item list-group-item-action d-flex align-items-center ${isSelected ? 'active' : ''}`}
                    onClick={() => toggleContact(contact.id)}
                  >
                    <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2" style={{ width: '35px', height: '35px' }}>
                      {contact.role === 'admin' ? <FaShieldAlt /> : contact.role === 'mitra' ? <FaStore /> : <FaUser />}
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-bold small">{contact.nama}</div>
                      <div className="text-muted small">{contact.role === 'admin' ? 'Admin' : contact.role === 'mitra' ? 'Mitra' : 'Customer'}</div>
                    </div>
                    {isSelected && (
                      <span className="badge bg-primary rounded-pill">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Optional Message */}
        <div className="p-3 border-top">
          <div className="form-check mb-2">
            <input
              type="checkbox"
              className="form-check-input"
              id="includeMessage"
              checked={includeMessage}
              onChange={(e) => setIncludeMessage(e.target.checked)}
            />
            <label className="form-check-label small" htmlFor="includeMessage">
              Sertakan pesan tambahan
            </label>
          </div>
          {includeMessage && (
            <textarea
              className="form-control"
              rows={2}
              placeholder="Tambahkan pesan (opsional)..."
              value={forwardMessage}
              onChange={(e) => setForwardMessage(e.target.value)}
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="card-footer bg-white d-flex justify-content-end gap-2">
          <button className="btn btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleForward}
            disabled={selectedContacts.length === 0 || isForwarding}
          >
            {isForwarding ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Forwarding...
              </>
            ) : (
              <>
                <FaForward className="me-1" />
                Forward ke {selectedContacts.length} kontak
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
