# Setup Realtime Chat di Supabase

## Penting: Enable Realtime di Supabase Dashboard

Agar chat berfungsi **real-time tanpa delay**, Anda harus mengaktifkan Realtime di Supabase Dashboard:

### 1. Enable Realtime untuk Table `chat_messages`

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Klik **Database** di sidebar kiri
4. Klik table `chat_messages`
5. Klik tombol **Realtime** (toggle switch) di pojok kanan atas
6. **Aktifkan** toggle untuk enable realtime
7. Pilih **All changes** atau **Only inserts** (pilih "All changes" untuk fitur edit/delete)

### 2. Enable Realtime untuk Table `message_reactions`

Ulangi langkah di atas untuk table `message_reactions`:
- Klik table `message_reactions`
- Enable Realtime
- Pilih **All changes**

### 3. Enable Realtime untuk Table `typing_status`

Ulangi langkah di atas untuk table `typing_status`:
- Klik table `typing_status`
- Enable Realtime
- Pilih **All changes**

### 4. Enable Realtime untuk Table `notifications` (Opsional)

Untuk notifikasi real-time:
- Klik table `notifications`
- Enable Realtime
- Pilih **All changes**

---

## Cara Test Realtime Berfungsi

1. Buka aplikasi di **2 browser berbeda** (Chrome & Firefox) atau **2 window**
2. Login sebagai **user A** di browser 1
3. Login sebagai **user B** di browser 2
4. Kirim pesan dari user A
5. **Pesan harus muncul INSTAN** di user B (tanpa refresh)
6. Test emoji reaction - harus muncul langsung
7. Test typing indicator - harus muncul "sedang mengetik..." langsung

---

## Troubleshooting

### Pesan masih delay/muncul setelah refresh?

**Penyebab:** Realtime belum enabled di Supabase

**Solusi:**
1. Pastikan table `chat_messages` sudah di-enable realtime-nya
2. Check browser console untuk error
3. Pastikan tidak ada filter yang terlalu ketat

### Emoji reaction tidak muncul real-time?

**Penyebab:** Table `message_reactions` belum enabled realtime

**Solusi:**
1. Enable realtime untuk table `message_reactions`
2. Refresh halaman setelah enable

### Typing indicator tidak muncul?

**Penyebab:** Table `typing_status` belum enabled realtime

**Solusi:**
1. Enable realtime untuk table `typing_status`

---

## Verifikasi di Console

Buka **Browser Console** (F12) dan Anda harus melihat log seperti ini:

```
Setting up real-time subscription {userId: "...", partnerId: "...", orderId: undefined}
✅ Real-time subscription active
⚡ Received new message via realtime: message-id-123
📝 Message updated: message-id-123
❤️ New reaction: {...}
```

Jika Anda melihat log ini, berarti realtime berfungsi dengan baik! ✅

---

## Performa

Setelah setup realtime dengan benar:
- ✅ Pesan muncul **< 100ms** setelah dikirim
- ✅ Emoji reaction muncul **instan**
- ✅ Typing indicator muncul **real-time**
- ✅ Edit/hapus pesan update **langsung**
- ✅ Tidak perlu refresh halaman

---

## Catatan Tambahan

Jika Anda menggunakan **Supabase Free Tier**:
- Realtime terbatas pada **200 concurrent connections**
- Cukup untuk testing dan MVP
- Untuk production, upgrade ke **Pro Plan** ($25/bulan)
