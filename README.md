# DEVVAULT

> Personal Developer Knowledge Workspace & Coding Documentation Vault

DEVVAULT adalah aplikasi dokumentasi kode personal bergaya Notion + VS Code + GitBook yang dibangun dengan HTML, CSS, dan Vanilla JavaScript, menggunakan Supabase sebagai backend.

---

## Daftar Isi

1. [Tentang DEVVAULT](#tentang-devvault)
2. [Fitur Lengkap](#fitur-lengkap)
3. [Tech Stack](#tech-stack)
4. [Struktur Folder](#struktur-folder)
5. [Setup Supabase](#setup-supabase)
6. [Konfigurasi supabase.js](#konfigurasi-supabasejs)
7. [Setup Admin User](#setup-admin-user)
8. [Deploy ke GitHub & Vercel](#deploy-ke-github--vercel)
9. [Mode Admin](#mode-admin)
10. [Mode Guest](#mode-guest)
11. [Sistem Kategori](#sistem-kategori)
12. [Sistem Halaman](#sistem-halaman)
13. [Sistem Blok](#sistem-blok)
14. [Sistem Snippet](#sistem-snippet)
15. [Sistem Pencarian](#sistem-pencarian)
16. [Keyboard Shortcuts](#keyboard-shortcuts)
17. [Troubleshooting](#troubleshooting)
18. [Responsive Behavior](#responsive-behavior)
19. [Keamanan](#keamanan)
20. [Versi](#versi)

---

## Tentang DEVVAULT

DEVVAULT adalah personal developer knowledge base yang dirancang untuk:

- Menyimpan catatan koding, dokumentasi, dan referensi pribadi
- Membuat dokumentasi terstruktur dengan sistem kategori dan halaman
- Mengelola snippet kode yang dapat digunakan ulang
- Berbagi dokumentasi publik dengan guest/pengunjung
- Bekerja dengan UI yang bersih, gelap, dan professional seperti VS Code

---

## Fitur Lengkap

### Autentikasi
- Login admin menggunakan Supabase Auth
- Sesi persisten (tetap login setelah refresh)
- Redirect ke login jika akses admin tanpa autentikasi
- Error message yang jelas jika login gagal

### Manajemen Halaman
- Buat, edit, hapus halaman
- Status: draft / published
- Visibility: public / private
- Pin/unpin halaman
- Duplikat halaman
- Soft delete dengan sistem Trash
- Restore halaman dari Trash
- Hapus permanen dari Trash
- Reorder halaman (move up/down)
- Template halaman

### Sistem Blok
- Blok Heading (H1-H3 dengan anchor otomatis)
- Blok Text (paragraf)
- Blok Code (dengan syntax highlighting Prism.js)
- Blok Quote/Warning/Info
- Blok Link (dengan metadata)
- Blok Checklist
- Blok Snippet Embed

### Code Block
- Syntax highlighting dengan Prism.js
- Line numbers
- Tombol copy dengan feedback
- Tombol fullscreen
- Tombol collapse/expand
- Font JetBrains Mono
- Toolbar sticky untuk kode panjang
- Horizontal scroll di mobile
- Language selector
- Permission copy (public/admin)

### Sistem Snippet
- Buat, edit, hapus snippet
- Kategorisasi snippet
- Embed snippet ke halaman
- Visibility: public/private
- Copy permission: public/admin

### Tabel of Contents
- Otomatis dari heading blocks
- Sticky di desktop
- Active section highlight saat scroll
- Smooth scroll ke heading
- Anchor link

### Pencarian
- Pencarian di dalam halaman yang sedang dibuka
- Suggestion dropdown real-time
- Highlight kata yang cocok
- Auto-scroll ke hasil
- ENTER = hasil berikutnya
- SHIFT + ENTER = hasil sebelumnya
- Fullscreen search modal di mobile

### Command Palette
- CTRL + K
- Navigasi cepat ke halaman/kategori/settings

### Multi-tab System
- Buka beberapa halaman sebagai tab
- Indikator unsaved changes (*)

### Dashboard
- Sambutan admin/guest
- Pinned pages
- Recent pages
- Quick actions (admin)
- Statistik konten
- App version badge

### Settings
- Toggle dark/light theme
- Preferensi sidebar
- Ukuran font kode
- Reading width preference
- Status koneksi Supabase
- Tombol logout

### Notifikasi Admin
- Bell notification center
- Tipe: success/warning/error/info
- Riwayat notifikasi
- Mark as read

### Export JSON
- Export halaman beserta blok sebagai JSON
- Filename: page-slug-devvault-backup.json
- Admin only

### Keyboard Shortcuts
- 20+ shortcuts tersedia
- Modal bantuan CTRL + /

### Tema
- Dark mode (default)
- Light mode (di Settings)
- Disimpan di localStorage

---

## Tech Stack

| Teknologi | Versi/CDN | Fungsi |
|-----------|-----------|--------|
| HTML5 | - | Struktur |
| CSS3 | - | Styling |
| Vanilla JavaScript | ES6+ | Logic |
| Supabase JS | v2 CDN | Backend/Auth/Database |
| Prism.js | 1.29.0 CDN | Syntax Highlighting |
| Lucide Icons | Latest CDN | Icons |
| Inter Font | Google Fonts | UI Font |
| JetBrains Mono | Google Fonts | Code Font |

---

## Struktur Folder

```
devvault/
│
├── index.html          # Entry point aplikasi
├── README.md           # Dokumentasi ini
├── shortcut.txt        # Referensi keyboard shortcuts
├── sql-editor.txt      # SQL setup lengkap untuk Supabase
├── supabase.js         # Konfigurasi Supabase (isi URL dan key di sini)
│
├── assets/
│   ├── icons/          # Custom icons jika ada
│   ├── images/         # Gambar statis
│   └── favicon/        # Favicon files
│
├── css/
│   ├── style.css       # Styles utama
│   ├── themes.css      # Dark/light theme variables
│   ├── responsive.css  # Media queries
│   └── code-theme.css  # Prism.js code theme
│
├── js/
│   ├── app.js          # Bootstrap dan inisialisasi
│   ├── auth.js         # Autentikasi Supabase
│   ├── router.js       # Hash-based SPA routing
│   ├── sidebar.js      # Sidebar logic
│   ├── pages.js        # CRUD pages
│   ├── blocks.js       # Block system
│   ├── snippets.js     # Snippet management
│   ├── search.js       # Page search
│   ├── toc.js          # Table of contents
│   ├── shortcuts.js    # Keyboard shortcuts
│   ├── settings.js     # Settings page
│   ├── notifications.js # Notification system
│   ├── export-json.js  # JSON export
│   ├── supabase-api.js # Supabase API calls
│   └── utils.js        # Helper functions
│
└── libs/
    ├── prism/          # Prism.js (opsional, bisa pakai CDN)
    └── lucide/         # Lucide icons (opsional, bisa pakai CDN)
```

---

## Setup Supabase

### 1. Buat Project Supabase
1. Buka [https://supabase.com](https://supabase.com)
2. Klik "Start your project" dan login
3. Klik "New project"
4. Isi nama project: `devvault`
5. Buat password database yang kuat
6. Pilih region terdekat
7. Klik "Create new project"

### 2. Jalankan SQL Schema
1. Di dashboard Supabase, klik "SQL Editor" di sidebar kiri
2. Klik "New query"
3. Buka file `sql-editor.txt`
4. Copy setiap blok SQL (BLOCK 1 sampai BLOCK 21) satu per satu
5. Paste ke SQL Editor dan klik "Run"
6. Pastikan tidak ada error sebelum lanjut ke blok berikutnya

### 3. Verifikasi Setup
Jalankan query verifikasi di SQL Editor:
```sql
-- Cek tabel
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Cek categories
SELECT * FROM categories ORDER BY sort_order;

-- Cek RLS aktif
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

---

## Konfigurasi supabase.js

1. Di dashboard Supabase, klik **Project Settings** > **API**
2. Copy **Project URL**
3. Copy **anon public** key (BUKAN service_role key!)
4. Buka file `supabase.js`
5. Ganti placeholder:

```javascript
const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key-here";
```

> ⚠️ **PENTING**: Jangan pernah menggunakan `service_role` key di frontend!

---

## Setup Admin User

Admin user HARUS dibuat melalui Supabase Dashboard, bukan via SQL.

### Langkah-langkah:
1. Di dashboard Supabase, klik **Authentication** di sidebar kiri
2. Klik tab **Users**
3. Klik tombol **Add user** > **Create new user**
4. Isi:
   - **Email**: `hasansyaifulhuda24@gmail.com`
   - **Password**: `Shannn24.`
5. Klik **Create user**

Trigger database akan otomatis membuat profil admin dengan `role = 'admin'`.

### Verifikasi:
```sql
SELECT * FROM profiles WHERE email = 'hasansyaifulhuda24@gmail.com';
-- role harus bernilai 'admin'
```

Jika role bukan admin, jalankan:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'hasansyaifulhuda24@gmail.com';
```

---

## Deploy ke GitHub & Vercel

### Upload ke GitHub:
```bash
git init
git add .
git commit -m "Initial DEVVAULT deployment"
git remote add origin https://github.com/username/devvault.git
git push -u origin main
```

### Deploy ke Vercel:
1. Buka [https://vercel.com](https://vercel.com)
2. Klik "New Project"
3. Import repository GitHub devvault
4. Framework Preset: **Other** (static site)
5. Build Command: (kosongkan)
6. Output Directory: `.` (root)
7. Klik "Deploy"

> **Catatan**: App menggunakan hash routing (#/) sehingga tidak perlu konfigurasi rewrite khusus di Vercel.

---

## Mode Admin

Admin dapat:
- Login dengan Supabase Auth
- Membuat, mengedit, menghapus halaman dan blok
- Mengelola kategori dan snippet
- Melihat semua halaman (draft, private, deleted)
- Export JSON backup
- Mengakses Settings lengkap
- Melihat notifikasi admin
- Menggunakan semua keyboard shortcuts

---

## Mode Guest

Guest dapat:
- Melihat halaman dengan status `published` dan visibility `public`
- Membaca dokumentasi
- Menggunakan sidebar navigasi
- Menggunakan table of contents
- Mencari di dalam halaman yang dibuka
- Copy code block yang ditandai public

Guest tidak dapat:
- Membuat atau mengedit konten
- Melihat draft/private pages
- Mengakses admin tools
- Melihat tombol admin
- Export JSON

---

## Sistem Kategori

Kategori default yang tersedia:
- **HTML** - icon: code
- **CSS** - icon: palette
- **JavaScript** - icon: zap
- **Supabase** - icon: database
- **GitHub** - icon: github
- **Snippets** - icon: scissors

Admin dapat menambah, mengedit, dan menghapus kategori.
Setiap kategori memiliki: id, name, slug, icon, sort_order.

---

## Sistem Halaman

Setiap halaman memiliki:
- **Status**: draft (hanya admin) atau published (bisa publik)
- **Visibility**: private (hanya admin) atau public (bisa dilihat guest)
- **Pin**: halaman yang dipinned muncul di dashboard dan sidebar
- **Soft delete**: halaman yang dihapus masuk Trash, bukan dihapus permanen

---

## Sistem Blok

Blok adalah unit konten di dalam setiap halaman.

Tipe blok yang didukung:
| Tipe | Deskripsi |
|------|-----------|
| `heading` | Judul H1/H2/H3 dengan anchor otomatis |
| `text` | Paragraf teks |
| `code` | Blok kode dengan syntax highlighting |
| `quote` | Kutipan/peringatan/info |
| `link` | Tautan eksternal dengan metadata |
| `checklist` | Daftar centang |
| `snippet_embed` | Embed snippet dari library |

---

## Sistem Snippet

Snippet adalah kode yang dapat digunakan ulang.

- Buat snippet sekali, embed ke banyak halaman
- Visibility: public/private
- Copy permission: public/admin
- Dapat dikategorikan

---

## Sistem Pencarian

Pencarian hanya bekerja di dalam halaman yang sedang dibuka.

- Ketik di search box di header
- Suggestion dropdown muncul otomatis
- ENTER = lompat ke hasil berikutnya
- SHIFT + ENTER = lompat ke hasil sebelumnya
- ESC = tutup pencarian
- Di mobile: fullscreen search modal

---

## Keyboard Shortcuts

Lihat file `shortcut.txt` untuk daftar lengkap.

Shortcuts utama:
- `CTRL + K` = Command Palette
- `CTRL + B` = Toggle Sidebar
- `CTRL + F` = Fokus Pencarian
- `CTRL + /` = Lihat Semua Shortcuts
- `CTRL + S` = Simpan Perubahan

---

## Troubleshooting

### Login gagal
- Pastikan admin user dibuat di Supabase Auth (bukan via SQL)
- Pastikan email dan password benar
- Cek koneksi ke Supabase

### Data tidak muncul
- Pastikan `supabase.js` sudah diisi dengan URL dan anon key yang benar
- Pastikan SQL sudah dijalankan semua
- Cek console browser untuk error

### Admin tidak bisa akses
- Cek apakah profil memiliki `role = 'admin'`
- Jalankan: `SELECT * FROM profiles;` di SQL Editor

### RLS blocking data
- Pastikan halaman memiliki `status = 'published'` dan `visibility = 'public'`
- Pastikan `deleted_at IS NULL`

### Deploy di Vercel gagal
- Pastikan tidak ada syntax error di file JavaScript
- Pastikan semua file ter-include di git
- Gunakan build output directory `.` (root)

---

## Responsive Behavior

| Device | Perilaku |
|--------|---------|
| Desktop (>1024px) | Sidebar permanent, TOC di kanan, full layout |
| Tablet (768-1024px) | Sidebar collapsible, TOC collapsible |
| Mobile (<768px) | Sidebar drawer, mobile bottom bar, fullscreen search |

---

## Keamanan

- **Jangan** menggunakan `service_role` key di frontend
- **Jangan** meng-hardcode password admin di JavaScript
- RLS (Row Level Security) aktif di semua tabel
- Autentikasi via Supabase Auth
- Aksi admin selalu memverifikasi session
- Guest tidak dapat melihat data private/draft

---

## Versi

**DEVVAULT v1.0.0**

- Build: 2026
- Author: DEVVAULT Team
- License: MIT
- Stack: HTML + CSS + Vanilla JS + Supabase

---

*Dibuat dengan ❤️ untuk developer Indonesia*
