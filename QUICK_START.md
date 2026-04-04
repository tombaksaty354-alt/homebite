# 🚀 QUICK START - HOMEBITE DENGAN SUPABASE

## ✅ YANG SUDAH SELESAI

- ✅ Supabase client library installed
- ✅ Database schema SQL siap (`supabase/setup.sql`)
- ✅ Supabase client setup (`lib/supabase.ts`)
- ✅ Environment variables template (`.env`)
- ✅ Panduan lengkap (`SETUP_GUIDE.md`)

---

## 📝 YANG PERLU ANDA LAKUKAN (5 LANGKAH MUDAH)

### STEP 1: Buat Supabase Account (2 menit)
1. Buka https://supabase.com
2. Sign up/Login
3. Klik **"New Project"**
4. Isi:
   - Name: `homebite`
   - Password: (buat yang kuat)
   - Region: **Singapore** (tercepat untuk Indonesia)
5. Tunggu ~2 menit

### STEP 2: Copy Credentials (1 menit)
1. Buka **Settings** (icon gear) → **API**
2. Copy 3 hal ini:
   ```
   Project URL: https://xxxxx.supabase.co
   anon public: eyJhbGci...
   service_role: eyJhbGci... (klik reveal)
   ```

### STEP 3: Run SQL Schema (2 menit)
1. Buka **SQL Editor** di Supabase
2. Buka file `supabase/setup.sql` dari project ini
3. **Copy semua isi file**
4. **Paste** ke SQL Editor
5. Klik **"Run"** (atau Ctrl+Enter)
6. ✅ Database siap!

### STEP 4: Update .env (1 menit)
Buka file `.env`, ganti 4 baris ini:

```env
NEXT_PUBLIC_SUPABASE_URL=https://GANTI-DENGAN-URL-ANDA.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=GANTI-DENGAN-ANON-KEY-ANDA
SUPABASE_SERVICE_ROLE_KEY=GANTI-DENGAN-SERVICE-ROLE-KEY-ANDA
JWT_SECRET=ganti-dengan-random-string-yang-kuat
```

### STEP 5: Test Lokal (1 menit)
```bash
npm run dev
```
Buka http://localhost:3000

---

## 🎯 DEPLOY KE VERCEL (5 MENIT)

### Option A: Via Vercel Dashboard (Paling Mudah)
1. **Push ke GitHub:**
   ```bash
   git add .
   git commit -m "Homebite siap deploy dengan Supabase"
   git push
   ```

2. **Deploy:**
   - Buka https://vercel.com
   - Login dengan GitHub
   - "Add New Project"
   - Pilih repository `homebite`
   - Isi **Environment Variables** (4 variabel dari .env)
   - Klik **"Deploy"**
   - Tunggu 2-3 menit
   - ✅ **Website LIVE!**

---

## 📋 CHECKLIST

- [ ] Buat Supabase account & project
- [ ] Copy credentials (URL, anon key, service role)
- [ ] Run SQL schema di Supabase
- [ ] Update file `.env` dengan credentials
- [ ] Test lokal (`npm run dev`)
- [ ] Push ke GitHub
- [ ] Deploy ke Vercel
- [ ] Test production URL

---

## 🆘 BUTUH BANTUAN?

Jika ada yang kurang jelas, lihat:
- **Panduan Lengkap**: `SETUP_GUIDE.md`
- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs

---

**Total waktu setup: ~15 menit** ⏱️
