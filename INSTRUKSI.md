# 🚀 INSTRUKSI LENGKAP - SETUP & REVISI HOMEBITE

## ✅ YANG SUDAH SELESAI

### File-file yang sudah dibuat:
1. ✅ `supabase/migrate.sql` - Database schema baru dengan:
   - Role system (customer, mitra, admin)
   - Chat system antara customer & mitra
   - Order flow 2-step (pesan → ongkir → bayar)
   - Review system setelah pesanan selesai
   - Auto-update rating produk
   - Dashboard admin ready
   - RLS policies untuk keamanan

2. ✅ `lib/supabase.ts` - Supabase client ready
3. ✅ `.env` - Credentials sudah diisi

---

## 📋 STEP YANG PERLU ANDA LAKUKAN

### STEP 1: Jalankan Migrasi Database (2 menit)

1. Buka **Supabase Dashboard** → **SQL Editor**
2. Buka file `supabase/migrate.sql` dari komputer Anda
3. **Copy semua isi file** (Ctrl+A, Ctrl+C)
4. **Paste** ke SQL Editor di Supabase
5. Klik **"Run"** (pojok kanan bawah)
6. Tunggu sampai muncul **"Success. No rows returned"**
7. Klik **"Table Editor"** untuk cek apakah 8 tables sudah ada:
   - users
   - produk
   - orders
   - order_items
   - chat_messages
   - reviews
   - wishlist
   - laporan_keuangan

**Kalau sudah ada semua → LANJUT!**

---

### STEP 2: Install Dependencies Baru

Di terminal/command prompt, jalankan:

```bash
npm install
```

---

### STEP 3: Test Lokal

```bash
npm run dev
```

Buka http://localhost:3000

---

### STEP 4: Deploy ke Vercel (Nanti)

Setelah semua fitur selesai kita test, baru deploy ke Vercel.

---

## 🎯 FITUR YANG AKAN DIBUAT (SECARA URUT)

1. ✅ Database Schema (DONE!)
2. ⏳ Sistem Auth dengan Role (Customer/Mitra/Admin)
3. ⏳ Dashboard Customer (Pesanan, Chat, Profil)
4. ⏳ Dashboard Mitra (CRUD Produk, Orders Masuk, Input Ongkir, Chat, Laporan)
5. ⏳ Dashboard Admin (Rekap Mitra, Grafik, Statistik)
6. ⏳ Review System setelah pesanan selesai
7. ⏳ Flow Pembayaran 2-Step
8. ⏳ Test semua fitur

---

## ⚠️ PENTING

- Database yang lama akan di-DROP dan diganti yang baru
- Semua data lama akan hilang (tapi database masih kosong jadi aman)
- Setelah migrasi, website perlu di-restart

---

**Silakan jalankan STEP 1 (migrasi database), lalu beri tahu hasilnya!**

Setelah migrasi selesai, saya akan lanjut implementasikan semua fitur satu per satu. 😊
