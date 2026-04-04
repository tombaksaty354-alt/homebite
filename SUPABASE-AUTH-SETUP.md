# ⚙️ SETUP SUPABASE AUTHENTICATION

## PENTING: Enable Email Auth di Supabase

Agar login/register berfungsi, Anda perlu mengaktifkan Email Auth di Supabase Dashboard.

### Langkah-langkah:

#### 1. Buka Supabase Dashboard
- Login ke https://supabase.com
- Pilih project `homebite`

#### 2. Ke Authentication Settings
- Di menu kiri, klik **"Authentication"** (icon orang)
- Klik **"Providers"**
- Cari **"Email"** dan klik

#### 3. Aktifkan Email Auth
- Toggle **"Enable Sign up"** → **ON** (hijau)
- **Email confirmations**: **MATIKAN** untuk development
  - Scroll ke bawah → **"Confirm email"** → **MATIKAN**
  - Ini agar user bisa langsung login tanpa konfirmasi email
- Klik **"Save"**

#### 4. Setup Redirect URLs
- Masih di Authentication settings
- Klik **"URL Configuration"** atau **"Redirect URLs"**
- Tambah URL: `http://localhost:3000/auth/callback`
- Tambah URL: `https://YOUR-VERCEL-URL.vercel.app/auth/callback` (nanti setelah deploy)

---

## 🧪 TEST AUTH

### Test Register:
1. Buka http://localhost:3000/register
2. Pilih role: **Customer** atau **Mitra**
3. Isi form dengan email & password
4. Klik "Daftar Sekarang"
5. Harusnya redirect ke /login

### Test Login:
1. Buka http://localhost:3000/login
2. Masukkan email & password yang sudah didaftarkan
3. Harusnya redirect ke beranda
4. Nama Anda akan muncul di navbar

---

## ❌ TROUBLESHOOTING

### Error: "Invalid login credentials"
- Pastikan email & password benar
- Pastikan user sudah terdaftar

### Error: "Email not confirmed"
- Anda perlu mematikan email confirmation di Supabase (lihat step 3 di atas)

### Error lainnya
- Cek browser console (F12)
- Cek Supabase logs di dashboard

---

**Setelah auth berhasil, kita lanjut buat dashboard untuk masing-masing role!**
