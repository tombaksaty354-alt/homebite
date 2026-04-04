// Chat Export Utility - Export chat to PDF
export interface ExportMessage {
  id: string;
  sender_name: string;
  sender_role: string;
  pesan: string;
  created_at: string;
  attachment_url?: string;
  attachment_type?: string;
  voice_url?: string;
  voice_duration?: number;
  is_deleted?: boolean;
  is_edited?: boolean;
  reactions?: { emoji: string; count: number }[];
  reply_to?: {
    sender_name: string;
    pesan: string;
  };
}

export async function exportChatToPDF(
  partnerName: string,
  messages: ExportMessage[],
  dateRange: { start: string; end: string }
) {
  try {
    // Create HTML content for PDF
    const htmlContent = generateChatHTML(partnerName, messages, dateRange);
    
    // Create a blob from the HTML
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Open in new window for printing
    const printWindow = window.open(url, '_blank');
    
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error exporting chat:', error);
    return { success: false, error };
  }
}

function generateChatHTML(
  partnerName: string,
  messages: ExportMessage[],
  dateRange: { start: string; end: string }
) {
  const messagesHTML = messages.map(msg => {
    if (msg.is_deleted) {
      return `<div class="deleted-message">🗑️ Pesan telah dihapus</div>`;
    }

    const isFromPartner = msg.sender_name !== 'You';
    const time = new Date(msg.created_at).toLocaleString('id-ID');
    
    let content = '';
    
    // Reply preview
    if (msg.reply_to) {
      content += `<div class="reply-preview">↩️ Membalas ${msg.reply_to.sender_name}: ${msg.reply_to.pesan}</div>`;
    }
    
    // Message content
    if (msg.voice_url) {
      content += `<div class="voice-message">🎤 Voice Message (${msg.voice_duration}s) <em>[Audio tidak dapat diekspor]</em></div>`;
    } else if (msg.attachment_url) {
      if (msg.attachment_type === 'image') {
        content += `<div class="image-attachment">📎 Gambar: <a href="${msg.attachment_url}" target="_blank">Lihat gambar</a></div>`;
      } else {
        content += `<div class="file-attachment">📎 File: <a href="${msg.attachment_url}" target="_blank">Download file</a></div>`;
      }
    }
    
    if (msg.pesan && !msg.pesan.startsWith('📎') && msg.pesan !== '🎤 Voice Message') {
      content += `<div class="message-text">${escapeHtml(msg.pesan)}</div>`;
    }
    
    // Edited label
    if (msg.is_edited) {
      content += `<span class="edited-label">(diedit)</span>`;
    }
    
    // Reactions
    if (msg.reactions && msg.reactions.length > 0) {
      const reactionsHTML = msg.reactions.map(r => 
        `<span class="reaction">${r.emoji} ${r.count}</span>`
      ).join(' ');
      content += `<div class="reactions">${reactionsHTML}</div>`;
    }
    
    return `
      <div class="message ${isFromPartner ? 'from-partner' : 'from-you'}">
        <div class="message-header">
          <span class="sender-name">${msg.sender_name}</span>
          <span class="timestamp">${time}</span>
        </div>
        ${content}
      </div>
    `;
  }).join('\n');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Chat Export - ${partnerName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 30px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .-header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    
    .header p {
      font-size: 14px;
      opacity: 0.9;
    }
    
    .messages-container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .message {
      margin-bottom: 20px;
      padding: 15px;
      border-radius: 8px;
      page-break-inside: avoid;
    }
    
    .message.from-you {
      background: #e3f2fd;
      margin-left: 50px;
      border-left: 4px solid #2196f3;
    }
    
    .message.from-partner {
      background: #f5f5f5;
      margin-right: 50px;
      border-left: 4px solid #9e9e9e;
    }
    
    .message-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 12px;
    }
    
    .sender-name {
      font-weight: bold;
      color: #666;
    }
    
    .timestamp {
      color: #999;
    }
    
    .message-text {
      font-size: 14px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    
    .reply-preview {
      background: rgba(0,0,0,0.05);
      padding: 8px;
      border-left: 3px solid #2196f3;
      margin-bottom: 8px;
      font-size: 12px;
      border-radius: 4px;
    }
    
    .voice-message,
    .image-attachment,
    .file-attachment {
      background: rgba(0,0,0,0.05);
      padding: 10px;
      border-radius: 5px;
      margin-bottom: 8px;
      font-size: 13px;
    }
    
    .edited-label {
      font-size: 11px;
      color: #999;
      font-style: italic;
    }
    
    .reactions {
      margin-top: 8px;
      display: flex;
      gap: 5px;
      flex-wrap: wrap;
    }
    
    .reaction {
      background: rgba(0,0,0,0.08);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
    }
    
    .deleted-message {
      text-align: center;
      color: #999;
      font-style: italic;
      padding: 10px;
      font-size: 13px;
    }
    
    .footer {
      text-align: center;
      margin-top: 40px;
      padding: 20px;
      color: #999;
      font-size: 12px;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .messages-container {
        box-shadow: none;
      }
      
      .message {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>💬 Chat Export</h1>
    <p>Percakapan dengan <strong>${partnerName}</strong></p>
    <p>${dateRange.start} - ${dateRange.end}</p>
    <p>Total: ${messages.length} pesan</p>
  </div>
  
  <div class="messages-container">
    ${messagesHTML}
  </div>
  
  <div class="footer">
    <p>Diekspor pada: ${new Date().toLocaleString('id-ID')}</p>
    <p>Homebite Chat System</p>
  </div>
</body>
</html>
  `;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
