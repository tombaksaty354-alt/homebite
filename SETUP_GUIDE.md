# 🚀 PANDUAN SETUP HOMEBITE - SUPABASE + VERCEL

## 📋 OVERVIEW
1. Setup Supabase Project
2. Run SQL Schema
3. Get Credentials
4. Update .env
5. Deploy ke Vercel
6. Test

---

## 🔷 STEP 1: SETUP SUPABASE PROJECT

### 1.1 Buat Account Supabase
1. Buka https://supabase.com
2. Klik **"Start your project"** atau **"Sign In"**
3. Login dengan GitHub/Google/Email

### 1.2 Create New Project
1. Klik **"New Project"**
2. Isi:
   - **Organization**: Pilih atau buat baru
   - **Project name**: `homebite`
   - **Database Password**: Buat password kuat (SIMPAN!)
   - **Region**: `Southeast Asia (Singapore)` - terdekat dari Indonesia
3. Klik **"Create new project"**
4. Tunggu ~2 menit sampai database ready

### 1.3 Get Credentials
1. Buka https://app.supabase.com/project/YOUR-PROJECT/settings/api
2. Copy **Project URL** → simpan
3. Copy **anon public key** → simpan
4. Copy **service_role key** (klik "reveal") → simpan

---

## 🗄️ STEP 2: RUN SQL SCHEMA

### 2.1 Buka SQL Editor
1. Di Supabase Dashboard, klik **"SQL Editor"** di sidebar kiri
2. Klik **"New query"**

### 2.2 Execute SQL
1. Buka file `supabase/setup.sql` dari project ini
2. **Copy SEMUA isi file**
3. **Paste** ke SQL Editor di Supabase
4. Klik **"Run"** atau tekan `Ctrl+Enter`
5. Tunggu sampai selesai (~5 detik)
6. ✅ Selesai! Database siap digunakan!

### 2.3 Verify Tables
1. Klik **"Table Editor"** di sidebar
2. Harus ada 7 tables:
   - ✅ users
   - ✅ produk
   - ✅ orders
   - ✅ order_items
   - ✅ reviews
   - ✅ wishlist
   - ✅ laporan_keuangan

---

## 🔧 STEP 3: UPDATE .ENV FILE

### 3.1 Edit File `.env`
Buka file `.env` di root project, ganti credentials dengan milik Anda:

```env
# Ganti dengan URL dari Supabase Dashboard
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co

# Ganti dengan anon key dari Supabase Dashboard
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Ganti dengan service role key dari Supabase Dashboard
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT Secret (ganti dengan random string)
JWT_SECRET=my-super-secret-key-change-this-12345
```

### 3.2 Dimana Dapat Credentials?
- **URL**: Settings → API → Project URL
- **anon key**: Settings → API → anon public
- **service_role key**: Settings → API → service_role (klik reveal)

---

## 🧪 STEP 4: TEST LOKAL

### 4.1 Install Dependencies
```bash
npm install
```

### 4.2 Run Development Server
```bash
npm run dev
```

### 4.3 Test di Browser
Buka http://localhost:3000

**Test Checklist:**
- [ ] Beranda bisa dibuka
- [ ] Produk halaman loading dari Supabase (akan kosong)
- [ ] Register user baru (halaman /register)
- [ ] Login dengan user yang baru dibuat
- [ ] Dashboard bisa diakses setelah login

---

## 🚀 STEP 5: DEPLOY KE VERCEL

### 5.1 Push ke GitHub
```bash
# Inisialisasi git (jika belum)
git init
git add .
git commit -m "feat: Homebite dengan Supabase - siap deploy"

# Buat repository di GitHub, lalu:
git remote add origin https://github.com/USERNAME-ANDA/homebite.git
git branch -M main
git push -u origin main
```

### 5.2 Deploy ke Vercel

#### Opsi A: Via Vercel Dashboard (Termudah)
1. Buka https://vercel.com
2. Login dengan **GitHub**
3. Klik **"Add New Project"**
4. Import repository **homebite**
5. **Konfigurasi:**
   - Framework Preset: `Next.js` (auto-detect)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

6. **Environment Variables** - Tambah 4 variabel:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY = eyJhbGc...
   JWT_SECRET = my-super-secret-key...
   ```

7. Klik **"Deploy"**
8. Tunggu 2-3 menit
9. ✅ **Website live!**

#### Opsi B: Via CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Ikuti prompt:
# - Set up and deploy? Y
# - Which scope? (pilih akun Anda)
# - Link to existing project? N
# - Project name? homebite
# - Directory? ./
```

---

## ✅ STEP 6: POST-DEPLOYMENT

### 6.1 Test Production URL
Buka URL yang diberikan Vercel (contoh: `https://homebite.vercel.app`)

### 6.2 Test di Production
- [ ] Beranda load
- [ ] Register user baru
- [ ] Login
- [ ] Dashboard bisa diakses
- [ ] Data tersimpan ke Supabase (cek Table Editor)

### 6.3 Custom Domain (Opsional)
1. Beli domain (homebite.id / homebite.com)
2. Di Vercel: Project Settings → Domains
3. Tambah domain: `homebite.id`
4. Ikuti instruksi DNS configuration
5. Tunggu DNS propagate (bisa 1-24 jam)

---

## 📊 MONITORING

### Supabase Dashboard
- **Database**: https://app.supabase.com/project/YOUR-PROJECT/editor
- **Logs**: Monitor → Logs
- **API Usage**: Settings → API → Usage

### Vercel Dashboard
- **Analytics**: Project → Analytics
- **Deployments**: Project → Deployments
- **Logs**: Project → Logs

---

## 🐛 TROUBLESHOOTING

### Error: "Supabase credentials not found"
**Solusi:**
1. Pastikan `.env` sudah benar
2. Restart dev server: `npm run dev`
3. Di Vercel: cek Environment Variables sudah benar

### Error: "Table doesn't exist"
**Solusi:**
1. Pastikan SQL schema sudah di-execute di Supabase
2. Cek di Table Editor apakah semua tables ada
3. Re-run SQL schema jika perlu

### Build Failed di Vercel
**Solusi:**
```bash
# Test build lokal dulu
npm run build

# Jika ada error, fix lalu push lagi
git add .
git commit -m "fix: perbaikan build"
git push
```

### Data tidak tersimpan
**Solusi:**
1. Cek browser console (F12) untuk error
2. Cek Supabase Logs di dashboard
3. Pastikan RLS policies sudah benar

---

## 🔐 SECURITY CHECKLIST

- [x] Environment variables di `.env` (tidak commit ke git!)
- [x] Row Level Security (RLS) enabled
- [x] Service role key TIDAK di-expose ke frontend
- [x] JWT secret sudah diganti dari default
- [ ] Password database kuat (min 12 karakter)
- [ ] API keys di-rotate secara berkala

---

## 📝 FILE PENTING

| File | Deskripsi |
|------|-----------|
| `.env` | Environment variables (JANGAN COMMIT!) |
| `.env.example` | Template .env (aman untuk commit) |
| `lib/supabase.ts` | Supabase client setup |
| `supabase/setup.sql` | Database schema SQL |
| `src/app/api/*/route.ts` | API routes |

---

## 🎯 NEXT STEPS SETELAH DEPLOY

### Phase 2 - Fitur Lanjutan
- [ ] Upload gambar produk (Supabase Storage)
- [ ] Payment gateway (Midtrans)
- [ ] Email notifications (SendGrid)
- [ ] Real-time chat
- [ ] Admin dashboard
- [ ] Export laporan PDF/Excel

### Phase 3 - Optimization
- [ ] Setup CDN untuk gambar
- [ ] Database indexing optimization
- [ ] Caching strategy
- [ ] Performance monitoring

---

## 📞 BANTUAN

Jika ada masalah:
1. Cek Supabase Docs: https://supabase.com/docs
2. Cek Vercel Docs: https://vercel.com/docs
3. Cek browser console (F12)
4. Cek Vercel deployment logs
5. Cek Supabase logs

---

**Dibuat untuk Homebite - Marketplace Makanan Rumahan UMKM** 🍽️
