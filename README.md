# 🍽️ Homebite - Marketplace Makanan Rumahan UMKM

> Platform marketplace khusus makanan rumahan yang menghubungkan UMKM dengan konsumen, sekaligus menyediakan sistem laporan keuangan sederhana otomatis untuk membantu mitra mengelola usahanya.

## ✨ Fitur Utama

### 🛒 Marketplace
- **Katalog produk makanan rumahan** dari berbagai UMKM mitra
- **Sistem tier mitra** (Silver, Gold, Platinum) untuk meningkatkan kepercayaan
- **Pencarian & filter** berdasarkan kategori, harga, rating
- **Keranjang belanja** dengan penyimpanan lokal
- **Checkout** dengan form pengiriman & pembayaran

### 👥 Autentikasi User
- **Login & Register** dengan validasi
- **Profil user** dengan statistik
- **Riwayat pesanan** lengkap

### 📊 Dashboard UMKM
- **Laporan keuangan otomatis** (pemasukan & pengeluaran)
- **Statistik bisnis** (pendapatan, laba, pesanan)
- **Produk terlaris** analytics
- **Laporan bulanan** dalam tabel

### 🎨 User Experience
- **Responsive design** - optimal di mobile & desktop
- **Toast notification** untuk feedback user
- **Error boundary** untuk handling error
- **Loading states** di semua form
- **Bahasa Indonesia** penuh

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm atau yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### Production Build

```bash
# Build untuk production
npm run build

# Start production server
npm start
```

## 📁 Struktur Project

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Beranda
│   ├── produk/            # Halaman produk
│   ├── keranjang/         # Keranjang belanja
│   ├── checkout/          # Checkout & sukses
│   ├── login/             # Login
│   ├── register/          # Register
│   ├── profil/            # Profil user
│   ├── pesanan/           # Riwayat pesanan
│   ├── dashboard/         # Dashboard UMKM
│   ├── mitra/             # Info & daftar mitra
│   ├── tentang/           # Tentang Kami
│   ├── faq/               # FAQ
│   └── ...                # Halaman lainnya
├── components/            # React components
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── KartuProduk.tsx
│   ├── ToastNotification.tsx
│   └── ErrorBoundary.tsx
├── context/               # React Context
│   ├── KeranjangContext.tsx
│   └── AuthContext.tsx
├── data/                  # Data statis
│   └── produk.ts
└── types/                 # TypeScript types
    ├── index.ts
    └── auth.ts
```

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Bootstrap 5
- **Icons:** React Icons (Font Awesome)
- **State Management:** React Context API

### Backend
- **API:** Next.js API Routes
- **Database:** JSON File Storage (dev) → PostgreSQL/MongoDB (production)
- **Authentication:** JWT (JSON Web Tokens)
- **Password:** Bcrypt hashing

---

## 🔌 API Endpoints

Homebite memiliki REST API lengkap:

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/auth` | Login & Register |
| GET | `/api/produk` | Get semua produk (dengan filter & search) |
| POST | `/api/produk` | Tambah produk baru |
| PUT | `/api/produk` | Update produk |
| DELETE | `/api/produk` | Hapus produk |
| GET | `/api/orders` | Get pesanan user |
| POST | `/api/orders` | Buat pesanan baru |
| GET | `/api/laporan` | Get laporan keuangan |
| POST | `/api/laporan` | Tambah laporan keuangan |

📖 **Dokumentasi API lengkap:** [API_DOCS.md](./API_DOCS.md)

## 🌐 Deployment

Lihat panduan lengkap di [DEPLOYMENT.md](./DEPLOYMENT.md)

**Quick deploy ke Vercel:**
```bash
git push origin main
# Lalu auto-deploy di Vercel
```

## 📝 Environment Variables

Buat file `.env.local` untuk development:

```env
# Contoh (belum digunakan di versi ini)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🎨 Brand Colors

- **Primary:** Orange `#e67e22` - Makanan, kehangatan, energi
- **Secondary:** Dark Blue `#2c3e50` - Profesional, terpercaya

## 📱 Pages

| Route | Deskripsi |
|-------|-----------|
| `/` | Beranda - Hero, keunggulan, tier, produk unggulan |
| `/produk` | Katalog semua produk dengan filter & search |
| `/produk/[id]` | Detail produk + info mitra |
| `/keranjang` | Keranjang belanja |
| `/checkout` | Form checkout |
| `/checkout/sukses` | Konfirmasi pesanan |
| `/login` | Login user |
| `/register` | Register user baru |
| `/profil` | Profil user |
| `/pesanan` | Riwayat pesanan |
| `/dashboard` | Dashboard UMKM (laporan keuangan) |
| `/mitra` | Info & pendaftaran mitra |
| `/tentang` | Tentang Homebite |
| `/faq` | FAQ |
| `/syarat-ketentuan` | Terms & Conditions |
| `/kebijakan-privasi` | Privacy Policy |

## 🔮 Roadmap

### Phase 1 - Frontend (✅ DONE)
- [x] Semua halaman utama
- [x] Autentikasi (simulasi)
- [x] Keranjang & checkout
- [x] Dashboard UMKM
- [x] Error handling & notifications

### Phase 2 - Backend (TODO)
- [ ] Database integration (PostgreSQL)
- [ ] Real authentication (JWT/NextAuth)
- [ ] API routes untuk CRUD
- [ ] Image upload

### Phase 3 - Payment (TODO)
- [ ] Midtrans integration
- [ ] QRIS, e-wallet, bank transfer
- [ ] Payment webhook

### Phase 4 - Advanced (TODO)
- [ ] Review & rating system
- [ ] Chat system
- [ ] Email notifications
- [ ] Admin dashboard
- [ ] Export laporan ke PDF/Excel

## 🤝 Contributing

Contributions welcome! Silakan buat issue atau pull request.

## 📄 License

MIT License - lihat [LICENSE](./LICENSE) untuk detail.

## 📞 Contact

- **Email:** halo@homebite.id
- **WhatsApp:** +62 812-3456-7890
- **Instagram:** @homebite.id

---

**Dibuat dengan ❤️ untuk memberdayakan UMKM makanan rumahan Indonesia**
