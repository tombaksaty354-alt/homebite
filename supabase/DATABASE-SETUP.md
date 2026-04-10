# Setup Database Functions & Tables

## 1. process_payout RPC Function

File SQL sudah dibuat di: `supabase/migrations/001_create_process_payout_rpc.sql`

### Cara Deploy ke Supabase:

**Option A: Via Dashboard (Manual)**
1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Klik **SQL Editor** di sidebar kiri
4. Copy isi file `supabase/migrations/001_create_process_payout_rpc.sql`
5. Paste ke SQL Editor
6. Klik **Run** atau tekan `Ctrl+Enter`
7. Pastikan muncul notifikasi "Success. No rows returned"

**Option B: Via Supabase CLI (Recommended)**
```bash
# Install Supabase CLI jika belum
npm install -g supabase

# Login ke Supabase
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy migrations
supabase db push
```

### Verifikasi Function Ter-deploy:

```sql
-- Test function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'process_payout';

-- Test function works (replace UUID with actual mitra_id)
SELECT public.process_payout(
  'YOUR_MITRA_ID_HERE'::UUID, 
  10000::NUMERIC
);
```

---

## 2. Required Tables

Pastikan table-table berikut sudah ada:

### mitra_saldo
```sql
CREATE TABLE IF NOT EXISTS public.mitra_saldo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mitra_id UUID REFERENCES public.users(id) UNIQUE NOT NULL,
  saldo_pending NUMERIC DEFAULT 0,
  saldo_tersedia NUMERIC DEFAULT 0,
  total_pencairan NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_mitra_saldo_mitra_id ON public.mitra_saldo(mitra_id);
```

### riwayat_pencairan
```sql
CREATE TABLE IF NOT EXISTS public.riwayat_pencairan (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mitra_id UUID REFERENCES public.users(id) NOT NULL,
  jumlah NUMERIC NOT NULL,
  saldo_sebelum NUMERIC NOT NULL,
  saldo_sesudah NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_riwayat_pencairan_mitra_id ON public.riwayat_pencairan(mitra_id);
CREATE INDEX idx_riwayat_pencairan_created_at ON public.riwayat_pencairan(created_at DESC);
```

---

## 3. site_settings Table

```sql
CREATE TABLE IF NOT EXISTS public.site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  nama_platform TEXT DEFAULT 'Homebite',
  url_logo TEXT,
  email_kontak TEXT,
  telepon_kontak TEXT,
  alamat_kontak TEXT,
  komisi_per_item NUMERIC DEFAULT 500,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default row
INSERT INTO public.site_settings (id, nama_platform, komisi_per_item)
VALUES (1, 'Homebite', 500)
ON CONFLICT (id) DO NOTHING;
```

---

## Troubleshooting

### Error: "function process_payout does not exist"
- Function belum di-deploy ke Supabase
- Jalankan SQL dari file `001_create_process_payout_rpc.sql`

### Error: "relation mitra_saldo does not exist"
- Table `mitra_saldo` belum dibuat
- Buat table terlebih dahulu (lihat SQL di atas)

### Error: "permission denied for function process_payout"
- User tidak punya permission
- Pastikan GRANT EXECUTE sudah dijalankan
- Atau gunakan service role key di API route
