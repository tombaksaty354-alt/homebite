# Cara Menambahkan Environment Variables ke Vercel

## ⚠️ PENTING
Environment variables Supabase BELUM ditambahkan ke Vercel, sehingga build gagal.

## 📋 Environment Variables yang Diperlukan

Tambahkan variables berikut di **Vercel Dashboard → Settings → Environment Variables**:

### 1. NEXT_PUBLIC_SUPABASE_URL
```
https://wibsjoskduaqqvkywgsa.supabase.co
```

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpYnNqb3NrZHVhcXF2a3l3Z3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMDIwMjYsImV4cCI6MjA5MDc3ODAyNn0.yoVNvtZ2sW_oShgwdXLcoRZb-V_kUR1fLWoJ2VxtLcw
```

### 3. JWT_SECRET
```
ccadcbd8-b101-42bc-a0da-58f4cf85263c
```

---

## 🚀 Langkah-langkah Detail

### Opsi 1: Via Vercel Dashboard (RECOMMENDED)

1. **Buka Vercel Dashboard**
   - Kunjungi: https://vercel.com/dashboard

2. **Pilih Project Anda**
   - Klik project "homebite" atau sesuai nama project Anda

3. **Buka Settings**
   - Klik tab **Settings** di menu atas

4. **Environment Variables**
   - Klik **Environment Variables** di sidebar kiri
   - Atau langsung ke: `https://vercel.com/[your-org]/[project-name]/settings/environment-variables`

5. **Tambahkan Variables**
   - Klik tombol **Add New**
   - Isi:
     - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
     - **Value**: `https://wibsjoskduaqqvkywgsa.supabase.co`
     - **Environment**: Centang semua (Production, Preview, Development)
   - Ulangi untuk 2 variables lainnya

6. **Deploy Ulang**
   - Setelah menambahkan semua variables, trigger deployment baru:
     - **Opsi A**: Push commit baru ke GitHub
     - **Opsi B**: Redeploy dari Vercel Dashboard → Deployments → klik ⋮ → Redeploy

---

### Opsi 2: Via Vercel CLI (Alternative)

Jika Anda ingin menggunakan CLI, jalankan perintah berikut satu per satu:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste: https://wibsjoskduaqqvkywgsa.supabase.co
# Pilih: Production, Preview, Development (ketik semua)

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpYnNqb3NrZHVhcXF2a3l3Z3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMDIwMjYsImV4cCI6MjA5MDc3ODAyNn0.yoVNvtZ2sW_oShgwdXLcoRZb-V_kUR1fLWoJ2VxtLcw
# Pilih: Production, Preview, Development

vercel env add JWT_SECRET
# Paste: ccadcbd8-b101-42bc-a0da-58f4cf85263c
# Pilih: Production, Preview, Development
```

Kemudian deploy ulang:
```bash
vercel --prod
```

---

## ✅ Verifikasi

Setelah menambahkan environment variables dan redeploy:

1. Buka **Vercel Dashboard** → **Deployments**
2. Klik deployment terbaru
3. Cek **Build Logs** - harus tidak ada error "supabaseUrl is required"
4. Test website - chat harus berfungsi sekarang

---

## 🔒 Security Note

- JANGAN pernah commit `.env` file ke Git
- Environment variables di Vercel sudah terenkripsi dan aman
- `.env.example` aman untuk di-commit karena hanya berisi template (credentials bisa di-share untuk team)

---

## 🐛 Troubleshooting

Jika masih error setelah menambahkan environment variables:

1. **Pastikan memilih semua environments** (Production, Preview, Development)
2. **Redeploy dengan clean cache**: Vercel Dashboard → Deployments → ⋮ → Redeploy → centang "Use existing Build Cache" (UNCHECK)
3. **Cek di Vercel → Settings → Environment Variables** - pastikan variables sudah terdaftar
4. **Cek build logs** - error harus berubah jika environment variables sudah terbaca
