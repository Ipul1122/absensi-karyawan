# Sistem Informasi Absensi Karyawan (Laravel & React SPA)

Aplikasi fullstack modern untuk pencatatan kehadiran karyawan berbasis lokasi (GPS) dan sistem perhitungan gaji (payroll) otomatis. Aplikasi ini menggunakan **Laravel 13** sebagai API Backend dan **React 19 + TypeScript + Vite** dengan **Tailwind CSS v4** sebagai Single Page Application (SPA) Frontend.

---

## 🚀 Fitur Utama

1. **Dashboard Karyawan**:
   - **Presensi GPS & Radius**: Melakukan *Check-In* dan *Check-Out* menggunakan deteksi lokasi geografis (latitude & longitude) dengan verifikasi radius aman dari kantor (menggunakan Leaflet Map).
   - **Pengajuan Cuti**: Formulir pengajuan cuti beserta riwayat status persetujuan.
   - **Slip Gaji Digital**: Mengunduh dan melihat rekap slip gaji bulanan yang diterbitkan oleh Admin.
   - **Riwayat Absensi**: Melihat kalender kehadiran lengkap dengan status kehadiran (Tepat Waktu, Telat, Cuti).

2. **Dashboard Admin**:
   - **Manajemen Karyawan**: Kelola akun karyawan (tambah, edit, hapus) serta generate password acak/bawaan.
   - **Manajemen Absensi**: Rekap kehadiran seluruh karyawan, penginputan absensi manual jika terjadi kendala teknis, serta ekspor rekap.
   - **Manajemen Cuti**: Menyetujui (*approve*) atau menolak (*reject*) pengajuan cuti karyawan.
   - **Konfigurasi Kantor**: Mengatur lokasi titik koordinat kantor (latitude & longitude) dan radius jangkauan absensi aman (dalam meter) secara dinamis.
   - **Sistem Payroll & Penggajian**: Mengatur konfigurasi gaji pokok, tunjangan kehadiran per hari, tunjangan cuti, serta potongan keterlambatan per hari. Generate slip gaji otomatis bulanan untuk seluruh karyawan.

---

## 🛠️ Spesifikasi Teknologi (Tech Stack)

- **Backend API**:
  - Framework: Laravel 13 (PHP 8.3+)
  - Autentikasi: Laravel Sanctum (Token-based)
  - Database: SQLite (Lokal) / MySQL atau MariaDB (Produksi)
- **Frontend SPA**:
  - Framework: React 19 + TypeScript + Vite
  - Styling: Tailwind CSS v4 (Modern & responsive UI)
  - Peta: React Leaflet / Leaflet JS (untuk visualisasi peta absensi)
  - Alert: SweetAlert2 (untuk notifikasi pop-up yang interaktif)
  - Ikon: Lucide React

---

## 💻 Panduan Menjalankan Project Secara Lokal (Development)

### 📋 Prasyarat Sistem
Pastikan komputer Anda sudah terinstall:
- PHP >= 8.3
- Composer (Dependency Manager untuk PHP)
- Node.js >= 18.x & NPM
- XAMPP / Laragon (jika ingin menggunakan database MySQL di lokal, namun default project menggunakan SQLite sehingga tidak wajib).

---

### 1. Menjalankan Backend (Laravel)

1. Buka terminal Anda, lalu masuk ke folder `backend`:
   ```bash
   cd backend
   ```
2. Install semua dependencies PHP menggunakan Composer:
   ```bash
   composer install
   ```
3. Salin file konfigurasi `.env`:
   ```bash
   copy .env.example .env
   ```
4. Generate Application Key Laravel:
   ```bash
   php artisan key:generate
   ```
5. Siapkan database SQLite bawaan:
   - Buat file database kosong bernama `database.sqlite` di dalam folder `backend/database/` (atau biarkan Laravel membuatnya otomatis saat migrasi).
6. Jalankan migrasi database beserta data awal (seeding):
   ```bash
   php artisan migrate --seed
   ```
7. Jalankan server Laravel:
   ```bash
   php artisan serve
   ```
   *Secara default, backend akan berjalan di alamat:* `http://localhost:8000`

---

### 2. Menjalankan Frontend (React)

1. Buka terminal baru, masuk ke folder `frontend`:
   ```bash
   cd frontend
   ```
2. Install dependencies JavaScript menggunakan NPM:
   ```bash
   npm install
   ```
3. Jalankan server development Vite:
   ```bash
   npm run dev
   ```
   *Secara default, frontend akan berjalan di alamat:* `http://localhost:5173` (atau port terdekat yang tersedia).
4. Buka browser Anda dan akses `http://localhost:5173`.

---

### 🔑 Akun Demo Pengujian

Aplikasi telah dilengkapi dengan data contoh (*seeder*) yang dapat langsung Anda gunakan untuk login:

| Peran (Role) | Email | Password | Kegunaan |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@absen.com` | `password` | Mengelola data karyawan, konfigurasi kantor, payroll, dan persetujuan cuti. |
| **Karyawan** | `karyawan@absen.com` | `password` | Melakukan simulasi absen check-in/out, mengajukan cuti, dan melihat slip gaji. |

---

## 🌐 Panduan Hosting di Rumahweb (Shared Hosting cPanel)

Rumahweb adalah salah satu provider hosting paling populer di Indonesia. Untuk menghosting aplikasi dengan arsitektur terpisah (Laravel API + React SPA) di layanan Shared Hosting cPanel, ikuti langkah-langkah di bawah ini.

### 📌 Skema Domain yang Direkomendasikan
Untuk hasil terbaik dan menghindari konflik routing, gunakan skema subdomain:
- **Frontend (React)**: Domain Utama (misalnya: `absensikaryawan.com` atau `absensi.domainanda.com`)
- **Backend (Laravel API)**: Subdomain (misalnya: `api.absensikaryawan.com` atau `api.domainanda.com`)

---

### Langkah 1: Build dan Deploy Frontend (React SPA)

Karena React adalah Single Page Application (SPA), browser memproses halamannya secara dinamis. Kita harus mengubah URL API dari localhost ke domain server sebelum melakukan kompilasi.

1. **Ubah Endpoint API ke Alamat Produksi**:
   Lakukan pencarian (*Find & Replace*) kata `http://localhost:8000/api` di seluruh folder `frontend/src` menggunakan text editor Anda (seperti VS Code), dan ganti menjadi URL subdomain API produksi Anda (misalnya `https://api.domainanda.com/api`).
   
   > [!TIP]
   > Jika ingin lebih rapi di masa mendatang, buatlah file `.env` di folder frontend dengan variabel `VITE_API_URL` dan panggil menggunakan `import.meta.env.VITE_API_URL`.

2. **Jalankan Perintah Build**:
   Di terminal folder `frontend`, jalankan perintah:
   ```bash
   npm run build
   ```
   Perintah ini akan menghasilkan folder baru bernama `dist` berisi file statis HTML, CSS, JS, dan Aset yang teroptimasi.

3. **Unggah file ke cPanel**:
   - Kompres (zip) isi di dalam folder `frontend/dist/` (bukan folder dist-nya, tapi file di dalamnya).
   - Masuk ke cPanel Rumahweb > **File Manager**.
   - Buka folder domain utama Anda (biasanya `public_html`) atau folder subdomain frontend Anda.
   - Unggah file zip tadi, lalu **Extract** di sana.

4. **Konfigurasi `.htaccess` untuk React Router (PENTING)**:
   Karena React menggunakan client-side routing (`react-router-dom`), merefresh halaman selain beranda akan memicu error `404 Not Found` dari server Apache.
   - Di dalam folder tempat Anda mengekstrak file frontend (`public_html`), buatlah file baru bernama `.htaccess` (aktifkan "Show Hidden Files" di setelan File Manager jika tidak terlihat).
   - Isi file `.htaccess` tersebut dengan kode berikut:
     ```apache
     <IfModule mod_rewrite.c>
       RewriteEngine On
       RewriteBase /
       RewriteRule ^index\.html$ - [L]
       RewriteCond %{REQUEST_FILENAME} !-f
       RewriteCond %{REQUEST_FILENAME} !-d
       RewriteCond %{REQUEST_FILENAME} !-l
       RewriteRule . /index.html [L]
     </IfModule>
     ```
   - Simpan file tersebut.

---

### Langkah 2: Deploy Backend (Laravel API)

Untuk alasan keamanan, **SANGAT DIREKOMENDASIKAN** untuk memisahkan file inti (*core*) Laravel di luar folder publik agar file konfigurasi sensitif seperti `.env` tidak dapat diakses secara langsung dari web browser.

1. **Persiapkan File Backend**:
   - Masuk ke folder `backend` di komputer lokal Anda.
   - Hapus folder `vendor`, `node_modules`, serta file di dalam `storage/logs/` dan `storage/framework/cache/data/` untuk memperkecil ukuran upload.
   - Kompres seluruh folder `backend` menjadi file `backend.zip`.

2. **Unggah Core Laravel**:
   - Masuk ke **File Manager** cPanel Rumahweb.
   - Buka direktori utama akun Anda (satu level di atas `public_html`, yaitu `/home/username/`).
   - Unggah file `backend.zip` ke direktori tersebut, lalu ekstrak ke dalam folder baru, misalnya `/home/username/absensi-backend/`.

3. **Unggah Folder Public Laravel ke Subdomain**:
   - Buat subdomain baru di cPanel Rumahweb (misalnya `api.domainanda.com`) dan pastikan folder Document Root-nya mengarah ke folder publik baru, misal `/home/username/api.domainanda.com/`.
   - Salin isi dari folder `backend/public/` di lokal Anda, kompres, lalu unggah dan ekstrak ke folder subdomain tersebut (`/home/username/api.domainanda.com/`).

4. **Hubungkan Folder Public dengan Core Laravel**:
   Setelah memindahkan folder `public` ke lokasi terpisah, Anda harus mengoreksi path referensi di file `index.php` pada folder public tersebut agar dapat memanggil core Laravel dengan benar.
   - Buka dan edit file `/home/username/api.domainanda.com/index.php`.
   - Cari baris kode berikut (biasanya di bagian atas/tengah):
     ```php
     // SEBELUM DIUBAH
     require __DIR__.'/../vendor/autoload.php';
     ```
     Ubah menjadi:
     ```php
     // SESUDAH DIUBAH (arah keluar folder public, lalu masuk ke folder core backend)
     require __DIR__.'/../absensi-backend/vendor/autoload.php';
     ```
   - Cari baris kode berikut (biasanya di bagian bawah):
     ```php
     // SEBELUM DIUBAH
     $app = require_once __DIR__.'/../bootstrap/app.php';
     ```
     Ubah menjadi:
     ```php
     // SESUDAH DIUBAH
     $app = require_once __DIR__.'/../absensi-backend/bootstrap/app.php';
     ```
   - Simpan perubahan tersebut.

---

### Langkah 3: Konfigurasi PHP & Database di cPanel

1. **Atur Versi PHP**:
   - Di cPanel Rumahweb, cari menu **Select PHP Version** atau **MultiPHP Manager**.
   - Set versi PHP untuk domain/subdomain Anda ke **PHP 8.3** atau versi terbaru yang didukung Laravel 13.
   - Pastikan ekstensi PHP berikut telah dicentang/aktif: `pdo_mysql`, `fileinfo`, `mbstring`, `openssl`, `xml`, `zip`, `bcmath`, `curl`.

2. **Buat Database MySQL**:
   - Buka menu **MySQL Database Wizard** di cPanel.
   - Langkah 1: Buat database baru (misal: `usercpanel_absensi`).
   - Langkah 2: Buat user database baru (misal: `usercpanel_absenuser`) beserta password yang kuat.
   - Langkah 3: Centang **ALL PRIVILEGES** untuk menghubungkan user tersebut ke database.

3. **Konfigurasi `.env` Produksi**:
   - Di File Manager, buka folder core Laravel Anda (`/home/username/absensi-backend/`).
   - Buat/edit file `.env` di folder tersebut dan ubah konfigurasinya sesuai server produksi:
     ```env
     APP_NAME="Absensi Karyawan"
     APP_ENV=production
     APP_DEBUG=false
     APP_URL=https://api.domainanda.com

     DB_CONNECTION=mysql
     DB_HOST=127.0.0.1
     DB_PORT=3306
     DB_DATABASE=usercpanel_absensi
     DB_USERNAME=usercpanel_absenuser
     DB_PASSWORD=PasswordDatabaseAndaYangKuat
     ```
   - Simpan file `.env`.

---

### Langkah 4: Migrasi Database & Seeder di Server Produksi

Karena shared hosting umumnya tidak menyediakan akses SSH terminal secara default pada paket hemat, berikut adalah beberapa cara untuk menjalankan perintah migrasi (`php artisan migrate --seed`):

#### Pilihan A: Menggunakan Menu Cron Jobs cPanel (Direkomendasikan)
1. Di cPanel, cari menu **Cron Jobs** (Tugas Cron).
2. Di bagian pengaturan waktu, pilih **Common Settings** -> **Once Per Minute** (`* * * * *`).
3. Di kolom perintah (Command), masukkan path eksekusi PHP menuju artisan Anda. Contoh:
   ```bash
   /usr/local/bin/php /home/username/absensi-backend/artisan migrate --force --seed
   ```
   *(Sesuaikan path `/usr/local/bin/php` dengan path PHP cPanel Anda, biasanya dapat dicek di informasi PHP).*
4. Klik **Add New Cron Job**.
5. Tunggu sekitar 1-2 menit hingga cron job tereksekusi secara otomatis di latar belakang.
6. **PENTING**: Setelah database berhasil terisi (cek lewat phpMyAdmin), segera **Hapus** cron job tersebut agar perintah migrasi tidak berjalan berulang-ulang setiap menitnya.

#### Pilihan B: Mengimpor Database dari Lokal via phpMyAdmin
Jika Anda telah menjalankan migrasi dan seeding secara lokal:
1. Buka phpMyAdmin di komputer lokal Anda, pilih database `database.sqlite` atau mysql lokal Anda, lalu lakukan **Export** ke file format `.sql`.
2. Buka phpMyAdmin di cPanel Rumahweb, pilih database produksi Anda (`usercpanel_absensi`), klik menu **Import**, pilih file `.sql` lokal Anda, lalu klik **Go** / **Kirim**.

---

### Langkah 5: Membuat Symlink untuk File Upload (Storage Link)

Laravel menyimpan file unggahan (seperti foto profil karyawan atau lampiran dokumen cuti) di folder `/storage/app/public/`. Untuk menampilkannya ke publik, folder ini harus di-link ke `/public/storage`.
Karena shared hosting tidak memiliki SSH, gunakan trik berikut:

1. Di File Manager cPanel, masuk ke folder subdomain API Anda (`/home/username/api.domainanda.com/`).
2. Buat file baru bernama `symlink.php`.
3. Edit file tersebut dan tempelkan kode PHP berikut:
   ```php
   <?php
   $targetFolder = '/home/username/absensi-backend/storage/app/public';
   $linkFolder = '/home/username/api.domainanda.com/storage';
   
   if (symlink($targetFolder, $linkFolder)) {
       echo 'Symlink berhasil dibuat!';
   } else {
       echo 'Symlink gagal dibuat. Silakan hubungi support Rumahweb.';
   }
   ```
   *(Pastikan untuk menyesuaikan `/home/username/absensi-backend` dan `/home/username/api.domainanda.com` dengan path absolut cPanel Anda).*
4. Buka browser dan akses alamat file tersebut: `https://api.domainanda.com/symlink.php`
5. Jika muncul pesan "Symlink berhasil dibuat!", segera **Hapus** file `symlink.php` tersebut dari File Manager demi alasan keamanan.

---

## 🛠️ Pemecahan Masalah (Troubleshooting)

- **Error 500 saat membuka API**:
  Buka File Manager cPanel, periksa permission untuk folder `/home/username/absensi-backend/storage` dan `/home/username/absensi-backend/bootstrap/cache`. Pastikan permission-nya diatur ke `775` atau `755` (bukan `777`).
- **Error CORS (Cross-Origin Resource Sharing)**:
  Secara bawaan, file `config/cors.php` telah dikonfigurasi untuk menerima request dari origin manapun (`'allowed_origins' => ['*']`). Namun, jika Anda mengalami kendala CORS, pastikan URL frontend Anda telah terdaftar dengan benar di file `.env` bagian `SANCTUM_STATEFUL_DOMAINS` atau `ALLOWED_ORIGINS` jika didefinisikan.
- **Lokasi Peta Tidak Muncul / Gagal Absen**:
  Pastikan situs Anda sudah menggunakan protokol **HTTPS** (SSL aktif). Browser modern memblokir akses ke fitur Geolocation (GPS) jika situs diakses melalui koneksi HTTP biasa. Rumahweb menyediakan SSL gratis (Let's Encrypt), pastikan SSL tersebut sudah aktif untuk domain frontend dan subdomain API Anda.
