# Fitur Multiple Rekening Mitra

## 📋 Overview

Mitra sekarang dapat menambahkan **lebih dari satu rekening** bank/e-wallet untuk pencairan dana.

## ✨ Fitur Baru

### 1. **Tambah Multiple Rekening**
- Mitra bisa menambahkan beberapa rekening bank atau e-wallet
- Setiap rekening menyimpan: Bank, Nomor Rekening, Atas Nama

### 2. **Rekening Utama (Primary)**
- Satu rekening ditandai sebagai "Rekening Utama"
- Dana akan dicairkan ke rekening utama secara otomatis
- Bisa diganti kapan saja dengan menekan tombol "Jadikan Utama"

### 3. **Manajemen Rekening**
- ✅ Tambah rekening baru
- ✅ Lihat semua rekening yang terdaftar
- ✅ Ganti rekening utama
- ✅ Hapus rekening yang tidak diperlukan

## 🚀 Cara Menggunakan

### Setup Database

1. Buka **Supabase Dashboard** > SQL Editor
2. Copy-paste isi file `supabase/rekening-mitra.sql`
3. Klik **Run**

### Untuk Mitra

1. Login sebagai mitra
2. Buka **Dashboard Mitra** > **Pengaturan**
3. Isi form rekening:
   - **Nama Bank/E-Wallet**: BCA, Mandiri, GoPay, dll
   - **Nomor Rekening**: Nomor rekening atau telepon
   - **Atas Nama**: Nama sesuai rekening
4. Klik **Tambah Rekening**

### Mengganti Rekening Utama

1. Di bagian "Daftar Rekening Anda", cari rekening yang diinginkan
2. Klik tombol **Jadikan Utama**
3. Rekening tersebut akan ditandai dengan badge hijau

### Menghapus Rekening

1. Klik tombol **🗑️** (trash) di rekening yang ingin dihapus
2. Konfirmasi penghapusan

## 📊 Struktur Database

### Tabel: `rekening_mitra`

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key ke users(id) |
| `bank` | VARCHAR(100) | Nama bank/e-wallet |
| `nomor` | VARCHAR(100) | Nomor rekening/telepon |
| `nama` | VARCHAR(255) | Nama pemilik rekening |
| `is_primary` | BOOLEAN | Apakah ini rekening utama? |
| `created_at` | TIMESTAMP | Waktu dibuat |
| `updated_at` | TIMESTAMP | Waktu terakhir diupdate |

### Fitur Database

- ✅ **Row Level Security (RLS)**: Mitra hanya bisa akses rekening mereka sendiri
- ✅ **Auto Primary**: Rekening pertama otomatis jadi primary
- ✅ **Single Primary Enforcement**: Trigger memastikan hanya ada 1 primary per user
- ✅ **Auto Migration**: Data existing dari tabel `users` otomatis dimigrate

## 🔒 Keamanan

### RLS Policies

1. **Mitra - SELECT**: Hanya bisa lihat rekening sendiri
2. **Mitra - INSERT**: Hanya bisa tambah rekening untuk diri sendiri
3. **Mitra - UPDATE**: Hanya bisa edit rekening sendiri
4. **Mitra - DELETE**: Hanya bisa hapus rekening sendiri
5. **Admin - SELECT**: Admin bisa lihat semua rekening (untuk monitoring)

## 📝 Migration Data

Script SQL otomatis akan memigrate rekening existing dari tabel `users`:

```sql
-- Dari kolom users.rekening_bank, users.rekening_nomor, users.rekening_nama
-- Ke tabel rekening_mitra dengan is_primary = true
```

## 🎨 UI/UX

### Halaman Pengaturan Mitra

**Card 1: Form Tambah Rekening**
- Input: Bank, Nomor, Atas Nama
- Button: Tambah Rekening

**Card 2: Daftar Rekening**
- Loading spinner saat fetch data
- Empty state jika belum ada rekening
- List semua rekening dengan:
  - Badge "Rekening Utama" (hijau) untuk yang primary
  - Button "Jadikan Utama" untuk yang non-primary
  - Button Delete (merah)

## 💡 Best Practices

1. **Selalu punya minimal 1 rekening utama** - Dijaga oleh trigger database
2. **Backup rekening** - Tambahkan lebih dari 1 untuk antisipasi
3. **Update jika ada perubahan** - Hapus yang lama, tambah yang baru
4. **Verifikasi sebelum pencairan** - Admin harus cek rekening utama yang valid

## 🔄 Integration

Rekening ini akan digunakan di:
- Halaman **Pesanan** untuk menampilkan info transfer
- Proses **Pencairan Dana** oleh admin
- **Invoice/Tagihan** untuk info pembayaran

## 🐛 Troubleshooting

**Error: "insert or update on table violates foreign key constraint"**
- Pastikan user_id valid dan ada di tabel users

**Tidak bisa set primary**
- Trigger otomatis memastikan hanya ada 1 primary
- Jika masalah persists, cek RLS policies di Supabase

**Data tidak muncul**
- Cek console browser untuk error
- Pastikan RLS policies sudah di-setup dengan benar
- Verifikasi user_id di JWT match dengan user yang login
