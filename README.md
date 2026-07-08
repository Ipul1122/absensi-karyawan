# 📋 Absensi Karyawan — Sistem Manajemen Kehadiran Karyawan

> Aplikasi full-stack untuk manajemen kehadiran, penggajian, dan operasional karyawan berbasis web. Dibangun dengan **React + TypeScript** (Frontend) dan **Laravel 13** (Backend API).

---

## 📑 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#-tech-stack)
- [Arsitektur Proyek](#-arsitektur-proyek)
- [Prasyarat](#-prasyarat)
- [Instalasi & Setup](#-instalasi--setup)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Struktur Folder](#-struktur-folder)
- [Role & Hak Akses](#-role--hak-akses)
- [API Endpoints](#-api-endpoints)
- [Screenshot](#-screenshot)
- [Lisensi](#-lisensi)

---

## 🧾 Tentang Proyek

**Absensi Karyawan** adalah sistem manajemen kehadiran dan operasional karyawan yang komprehensif. Aplikasi ini mendukung tiga level pengguna — **Admin**, **Karyawan (Employee)**, dan **Direktur** — dengan fitur mulai dari absensi berbasis lokasi (GPS), pengajuan cuti & lembur, penggajian (payroll), hingga alur persetujuan bertingkat (multi-level approval).

---

## ✨ Fitur Utama

### 🔐 Autentikasi & Profil
- Login dengan email & password (Laravel Sanctum)
- Manajemen profil & biodata karyawan (foto, CV, data pribadi)
- Lupa password & reset password
- Ganti password

### 📍 Absensi (Attendance)
- **Absen Kantor** — Clock In/Out berbasis GPS & radius kantor
- **Kunjungan Sales** — Absensi lapangan untuk tim sales dengan check-out lokasi
- **Kunjungan Klien** — Absensi kunjungan ke klien (client visit)
- Deteksi otomatis status: Normal, Terlambat, Pulang Cepat, Lembur
- Foto selfie saat absen (bukti kehadiran)
- Riwayat absensi lengkap

### 📅 Cuti, Izin & Lembur
- Pengajuan cuti dengan alasan & tanggal
- Pengajuan izin / sakit dengan upload dokumen bukti (surat dokter, dll)
- Pengajuan lembur kerja
- Alur persetujuan bertingkat (Admin → Direktur)

### 🕒 Shift Kerja & Hari Libur
- Pengaturan shift kerja dinamis (jam masuk, jam pulang, toleransi keterlambatan)
- Alokasi shift khusus per karyawan atau divisi
- Kalender hari libur nasional serta import massal hari libur

### 💰 Penggajian (Payroll)
- Konfigurasi gaji pokok, tunjangan, & potongan
- Generate slip gaji bulanan otomatis secara massal atau individu
- Potongan (deduction) otomatis berdasarkan ketidakhadiran
- Alur approval payroll lengkap oleh Direktur

### 💳 Reimbursement & Bonus
- Pengajuan reimbursement oleh karyawan dengan upload nota/kuitansi bukti
- Manajemen pemberian bonus oleh Admin
- Persetujuan bertingkat (Admin → Direktur)

### 🏢 Inventaris Kantor
- Pengelolaan aset & inventaris perusahaan
- Upload foto inventaris barang
- Alur penghapusan atau pembaruan inventaris

### 🗑 Recycle Bin & Backup Data
- Fitur tempat sampah untuk pemulihan data (karyawan, dll) yang dihapus sementara (soft delete)
- Backup database (export format SQL) dan pemulihan database (import) langsung dari panel Admin

### 📊 Dashboard & Rekap
- **Admin Dashboard** — Ringkasan kehadiran harian, grafik data karyawan, manajemen payroll & operasional
- **Employee Dashboard** — Status absen hari ini, info shift kerja, ringkasan biodata, slip gaji, & status pengajuan
- **Director Dashboard** — Ringkasan log aktivitas, persetujuan operasional, monitoring payroll, & keuangan perusahaan
- Laporan rekap absensi bulanan dengan filter multi-parameter & ekspor laporan

### 🔔 Notifikasi Real-time
- Integrasi notifikasi push (Web Push API) untuk pemberitahuan real-time mengenai status pengajuan, approval, dan aktivitas sistem lainnya

---

## 🛠 Tech Stack

### Frontend
| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| React | 19.x | UI Library |
| TypeScript | 5.x | Type-safe JavaScript |
| Vite | 6.x | Build tool & dev server |
| React Router | 7.x | Client-side routing |
| Axios | - | HTTP client |
| Lucide React | - | Icon library |
| SweetAlert2 | - | Alert & dialog |

### Backend
| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| PHP | ≥ 8.3 | Runtime |
| Laravel | 13.x | Backend framework |
| Laravel Sanctum | 4.x | API authentication (token-based) |
| MySQL / SQLite | - | Database |

---

## 🏗 Arsitektur Proyek

```
absen-karyawan/               ← Root monorepo
├── frontend/                  ← React + TypeScript (Vite)
│   └── src/
│       ├── components/        ← Semua komponen UI
│       │   ├── admin/         ← Halaman-halaman admin
│       │   ├── employee/      ← Halaman-halaman karyawan
│       │   ├── direktur/      ← Halaman-halaman direktur
│       │   └── layout/        ← Sidebar, Logo, dll
│       ├── utils/             ← Utility functions
│       ├── App.tsx            ← Root routing & auth state
│       └── main.tsx           ← Entry point
│
├── backend/                   ← Laravel 13 API
│   ├── app/
│   │   ├── Http/Controllers/  ← API controllers
│   │   ├── Models/            ← Eloquent models
│   │   └── Providers/         ← Service providers
│   ├── database/
│   │   ├── migrations/        ← Schema migrations
│   │   ├── seeders/           ← Data seeders
│   │   └── factories/         ← Model factories
│   ├── routes/
│   │   └── api.php            ← Semua API routes
│   └── config/                ← Konfigurasi Laravel
│
└── README.md                  ← File ini
```

---

## 📌 Prasyarat

Pastikan tools berikut sudah terinstall:

- **PHP** ≥ 8.3
- **Composer** ≥ 2.x
- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **MySQL** 8.x atau **SQLite** (default)
- **XAMPP** (opsional, jika menggunakan MySQL bawaan XAMPP)

---

## 🚀 Instalasi & Setup

### 1. Clone Repository

```bash
git clone https://github.com/Ipul1122/absensi-karyawan.git
cd absen-karyawan
```

### 2. Setup Backend (Laravel)

```bash
cd backend

# Install dependensi PHP
composer install

# Salin file environment
cp .env.example .env

# Generate application key
php artisan key:generate

# Konfigurasi database di file .env
# Default menggunakan SQLite, untuk MySQL ubah:
#   DB_CONNECTION=mysql
#   DB_HOST=127.0.0.1
#   DB_PORT=3306
#   DB_DATABASE=absen_karyawan
#   DB_USERNAME=root
#   DB_PASSWORD=

# Jalankan migrasi database
php artisan migrate

# (Opsional) Jalankan seeder untuk data dummy
php artisan db:seed
```

### 3. Setup Frontend (React)

```bash
cd ../frontend

# Install dependensi Node.js
npm install
```

---

## ▶ Menjalankan Aplikasi

Buka **dua terminal** terpisah:

### Terminal 1 — Backend API (port 8000)

```bash
cd backend
php artisan serve
```

Server berjalan di: `http://localhost:8000`

### Terminal 2 — Frontend Dev Server (port 5173)

```bash
cd frontend
npm run dev
```

Aplikasi berjalan di: `http://localhost:5173`

> **Catatan:** Frontend akan otomatis melakukan health check ke backend saat pertama kali dibuka.

---

## 📁 Struktur Folder

### Frontend — Komponen Utama

| File / Folder | Deskripsi |
|---------------|-----------|
| `App.tsx` | Root component, konfigurasi rute (routes) & state otentikasi utama |
| `Login.tsx` | Halaman login karyawan / admin / direktur |
| `AdminDashboard.tsx` | Dashboard admin shell dengan rute anak (nested routes) |
| `EmployeeDashboard.tsx` | Dashboard karyawan shell dengan rute anak (nested routes) |
| `direktur/DirectorDashboard.tsx` | Dashboard direktur shell dengan rute anak (nested routes) |

#### Admin Components (`components/admin/`)

| Komponen / Subfolder | File | Deskripsi |
|----------------------|------|-----------|
| **dashboard/** | `DashboardOverview.tsx` | Ringkasan statistik operasional & kehadiran harian |
| **absensi/** | `RekapAbsensi.tsx` | Laporan rekap kehadiran & filter absensi semua karyawan |
| | `SalesVisitsLog.tsx` | Pencatatan log kunjungan lapangan sales/klien |
| | `AbsenMandiriAdmin.tsx` | Menu absensi khusus untuk user admin |
| **dataKaryawan/** | `AkunKaryawan.tsx` | Manajemen profil, penambahan, & pembaruan data karyawan |
| **pengaturan/** | `LokasiKantor.tsx` | Konfigurasi koordinat kantor & radius presensi GPS |
| | `KelolaShift.tsx` | Pengaturan shift jam kerja & waktu dispensasi keterlambatan |
| | `AdminKelolaHariLibur.tsx` | Manajemen kalender hari libur nasional |
| | `RecycleBin.tsx` | Halaman tempat sampah untuk pemulihan soft-deleted data |
| **payroll/** | `AdminPayroll.tsx` | Pembuatan & pengelolaan payroll bulanan |
| | `AdminSalaryConfig.tsx` | Pengaturan formula gaji pokok & tunjangan |
| | `AdminBonus.tsx` | Input & daftar bonus performa karyawan |
| **operasional/** | `AdminCuti.tsx` | Verifikasi & persetujuan permohonan cuti |
| | `AdminIzin.tsx` | Verifikasi & persetujuan permohonan izin/sakit |
| | `AdminOvertime.tsx` | Verifikasi & persetujuan lembur kerja |
| | `AdminReimbursement.tsx` | Verifikasi & persetujuan reimbursement klaim dana |
| | `AdminInventaris.tsx` | Pengelolaan data inventaris aset kantor |

#### Employee Components (`components/employee/`)

| Komponen / Subfolder | File | Deskripsi |
|----------------------|------|-----------|
| **dashboard/** | `EmployeeOverview.tsx` | Ringkasan kehadiran personal harian & kalender info |
| **absensi/** | `EmployeeAbsen.tsx` | Presensi Clock In & Clock Out berbasis lokasi kantor |
| | `EmployeeSales.tsx` | Presensi kunjungan lapangan (sales visit) |
| | `EmployeeClient.tsx` | Presensi kunjungan klien langsung |
| | `EmployeeHistory.tsx` | Riwayat absensi detail per bulan |
| **operasional/** | `EmployeeCuti.tsx` | Formulir & riwayat pengajuan cuti tahunan/khusus |
| | `EmployeeIzin.tsx` | Formulir & riwayat pengajuan izin/sakit dengan berkas bukti |
| | `EmployeeOvertime.tsx` | Formulir & riwayat pengajuan lembur |
| | `EmployeeReimbursement.tsx` | Formulir & riwayat pengajuan klaim biaya |
| **payroll/** | `EmployeePayroll.tsx` | Riwayat penerimaan slip gaji bulanan PDF/Web |
| | `EmployeeBonus.tsx` | Ringkasan penerimaan bonus |
| **pengaturan/** | `EmployeeSettings.tsx` | Ubah kata sandi login |
| | `BiodataSetting.tsx` | Melengkapi biodata diri dan unggah berkas CV/KTP |

#### Director Components (`components/direktur/`)

| Komponen / Subfolder | File | Deskripsi |
|----------------------|------|-----------|
| **root** | `DirectorDashboard.tsx` | Shell layout sidebar & router navigasi Direktur |
| **dashboard/** | `DirekturOverview.tsx` | Dashboard analitik absensi, pengeluaran & monitoring |
| **kehadiran/** | `LogKehadiran.tsx` | Daftar monitoring kehadiran real-time seluruh staf |
| **pengaturan/** | `DirectorSettings.tsx` | Pengaturan profil dan kata sandi direktur |
| **persetujuan/** | `PersetujuanKaryawan.tsx` | Approval data karyawan baru & approval penghapusan |
| | `PersetujuanKehadiran.tsx` | Approval koreksi waktu absensi |
| | `PersetujuanGaji.tsx` | Approval penyesuaian komponen gaji pokok karyawan |
| | `PersetujuanPayroll.tsx` | Approval slip gaji sebelum rilis transfer dana |
| | `PersetujuanOperational.tsx` | Approval cuti, izin, lembur, reimbursement & bonus akhir |

### Backend — Controllers

| Controller | Deskripsi |
|------------|-----------|
| `AuthController.php` | Menangani login, logout, edit profil, & pemulihan password |
| `AttendanceController.php` | Mengatur jam masuk/pulang, presensi GPS, shifting, & rekapitulasi |
| `EmployeeController.php` | CRUD data utama karyawan, profil karyawan, & alur approval biodata |
| `LeaveController.php` | Pengelolaan cuti & persetujuan multi-level |
| `PermitController.php` | Pengelolaan izin / sakit & persetujuan multi-level |
| `PayrollController.php` | Perhitungan & pembuatan slip gaji, formula gaji, serta approval gaji |
| `OvertimeController.php` | Pengelolaan waktu lembur & persetujuan multi-level |
| `ReimbursementController.php` | Pengelolaan reimbursement biaya & persetujuan multi-level |
| `BonusController.php` | Pengelolaan bonus tambahan |
| `InventoryController.php` | Pengelolaan inventaris aset perusahaan |
| `SalesVisitController.php` | Pencatatan detail kunjungan lapangan & checkout sales/klien |
| `BackupController.php` | Backup database (export format SQL) & restore database (import) |
| `RecycleBinController.php` | Mengelola data terhapus sementara (soft-deletes) untuk dipulihkan |
| `PushNotificationController.php` | Mengatur subscription push notification & pengiriman push message |
| `DirectorController.php` | Mengolah data ringkasan analitik khusus dashboard direktur |
| `SidebarNotificationController.php` | Menghitung status pengajuan tertunda untuk badge menu |

### Backend — Models

| Model | Tabel | Keterangan |
|-------|-------|------------|
| `User.php` | `users` | Data pokok karyawan, hak akses, & data login |
| `Attendance.php` | `attendances` | Log deteksi waktu clock-in/out & foto selfie |
| `Shift.php` | `shifts` | Master data jam kerja kantor |
| `Holiday.php` | `holidays` | Daftar hari libur nasional perusahaan |
| `LeaveRequest.php` | `leave_requests` | Form detail data pengajuan cuti |
| `PermitRequest.php` | `permit_requests` | Form detail data pengajuan izin/sakit |
| `Overtime.php` | `overtimes` | Log data kerja lembur karyawan |
| `Payroll.php` | `payrolls` | Data gaji bulanan yang digenerate sistem |
| `SalaryConfiguration.php` | `salary_configurations` | Skema gaji pokok & tunjangan tetap |
| `Reimbursement.php` | `reimbursements` | Data klaim pengeluaran dana operasional |
| `Bonus.php` | `bonuses` | Pemberian bonus di luar gaji pokok |
| `Inventory.php` | `inventories` | Aset perusahaan yang terdaftar |
| `SalesVisit.php` | `sales_visits` | Log kunjungan luar kota/sales |
| `OfficeSetting.php` | `office_settings` | Pengaturan koordinat lintang/bujur & radius kantor |
| `PushSubscription.php` | `push_subscriptions` | Token endpoint push notification user |
| `RecycleBin.php` | `recycle_bins` | Penyimpanan meta data untuk file di tempat sampah |

---

## 👥 Role & Hak Akses

Aplikasi memiliki **3 role** dengan hak akses berbeda:

### 🔴 Admin
- Manajemen CRUD karyawan & profil lengkap
- Input absensi manual & koreksi presensi
- Konfigurasi lokasi kantor, radius GPS, shift kerja, & hari libur nasional
- Generate, kelola, & sesuaikan payroll bulanan
- Kelola tempat sampah (Recycle Bin) & backup database
- Approval cuti, izin, lembur, reimbursement
- Manajemen bonus & inventaris perusahaan
- Melihat log kunjungan sales

### 🟢 Employee (Karyawan)
- Absensi mandiri (kantor via GPS, sales, & klien)
- Pengajuan cuti, izin/sakit, lembur, & reimbursement
- Lihat slip gaji pribadi & perolehan bonus
- Lihat riwayat absensi pribadi
- Kelola profil, biodata diri, upload CV/berkas, & kata sandi

### 🔵 Director (Direktur)
- **Read-only** akses ke seluruh data admin (kehadiran, karyawan, inventaris, dll)
- Approval akhir pendaftaran / penolakan karyawan baru & biodata
- Approval konfigurasi gaji
- Approval slip gaji (payroll) bulanan secara massal maupun individu
- Approval akhir cuti, izin/sakit, lembur, reimbursement, & bonus
- Approval akhir usulan koreksi kehadiran

### Alur Approval Bertingkat

```
Karyawan mengajukan → Admin menyetujui → Direktur memberikan approval akhir
```

---

## 🔌 API Endpoints

Base URL: `http://localhost:8000/api`

### Public (Tanpa Login)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/health-check` | Mengecek status koneksi backend & database |
| `POST` | `/login` | Otentikasi login pengguna |
| `POST` | `/forgot-password` | Pengajuan lupa password |
| `POST` | `/reset-password` | Melakukan reset password |
| `GET` | `/payroll/verify/{id}/{hash}` | Verifikasi keabsahan slip gaji digital |

### Authenticated (Semua Role Login)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/logout` | Logout & mencabut token API Sanctum |
| `GET` | `/user` | Informasi dasar user yang aktif |
| `GET` | `/user/profile` | Data profil & detail biodata lengkap |
| `POST` | `/user/profile` | Memperbarui berkas biodata & profil |
| `PUT` | `/user/change-password` | Mengganti password pengguna |
| `GET` | `/admin-contact` | Memperoleh kontak WhatsApp Admin aktif |
| `GET` | `/shifts` | Memperoleh daftar shift kerja yang tersedia |
| `GET` | `/sidebar/notification-counts` | Mengambil badge hitungan notifikasi pending |
| `POST` | `/push-subscriptions` | Mendaftarkan token push notifikasi browser |
| `POST` | `/push-subscriptions/unsubscribe` | Membatalkan subskripsi push notifikasi |
| `POST` | `/push-subscriptions/test` | Mengirim notifikasi uji coba ke perangkat |

### Attendance & Sales Visit (Karyawan)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/attendance/today` | Status presensi hari ini |
| `POST` | `/attendance/check-in` | Melakukan Clock In (GPS & Selfie) |
| `POST` | `/attendance/check-out` | Melakukan Clock Out (GPS & Selfie) |
| `GET` | `/attendance/history` | Riwayat kehadiran pribadi bulanan |
| `GET` | `/office-setting` | Mendapatkan pengaturan radius koordinat kantor |
| `POST` | `/sales-visits` | Melakukan Clock In kunjungan sales/klien |
| `GET` | `/sales-visits/today` | Daftar kunjungan sales hari ini |
| `PUT` | `/sales-visits/{id}/checkout` | Melakukan Clock Out dari kunjungan sales/klien |
| `GET` | `/holidays/upcoming` | Daftar libur nasional mendatang |

### Operasional (Karyawan)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/leaves` | Daftar pengajuan cuti pribadi |
| `POST` | `/leaves` | Mengirimkan pengajuan cuti baru |
| `DELETE` | `/leaves/{id}` | Membatalkan/menghapus draf cuti |
| `GET` | `/permits` | Daftar pengajuan izin / sakit pribadi |
| `POST` | `/permits` | Mengirimkan pengajuan izin / sakit (dengan file bukti) |
| `DELETE` | `/permits/{id}` | Membatalkan/menghapus pengajuan izin |
| `GET` | `/overtimes` | Daftar pengajuan lembur pribadi |
| `POST` | `/overtimes` | Mengirimkan pengajuan lembur baru |
| `DELETE` | `/overtimes/{id}` | Membatalkan/menghapus pengajuan lembur |
| `GET` | `/reimbursements` | Daftar pengajuan reimbursement pribadi |
| `POST` | `/reimbursements` | Mengirimkan klaim reimbursement (dengan kuitansi) |
| `DELETE` | `/reimbursements/{id}` | Membatalkan/menghapus pengajuan reimbursement |
| `GET` | `/bonuses` | Riwayat perolehan bonus pribadi |
| `GET` | `/payroll/my-slips` | Daftar slip gaji bulanan pribadi |

### Admin & Director (Akses Bersama - Read Only untuk Direktur)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/employees` | Menampilkan seluruh data karyawan |
| `GET` | `/employees/{id}/profile` | Memperoleh profil detail staf tertentu |
| `GET` | `/admin/employees/backup` | Mendapatkan data backup karyawan |
| `GET` | `/admin/attendances` | Laporan kehadiran seluruh karyawan |
| `GET` | `/admin/sales-visits` | Log kunjungan sales seluruh karyawan |
| `GET` | `/admin/leaves` | Log pengajuan cuti seluruh karyawan |
| `GET` | `/admin/permits` | Log pengajuan izin/sakit seluruh karyawan |
| `GET` | `/admin/payroll/configurations` | Melihat skema/formula gaji terdaftar |
| `GET` | `/admin/directors` | Mendapatkan list akun dengan role Direktur |
| `GET` | `/admin/payroll` | Melihat daftar histori payroll bulanan |
| `GET` | `/admin/inventories` | Melihat daftar inventaris barang perusahaan |
| `GET` | `/admin/inventories/{id}` | Detail barang inventaris tertentu |
| `GET` | `/admin/reimbursements` | Log reimbursement seluruh karyawan |
| `GET` | `/admin/reimbursements/summary` | Ringkasan statistik reimbursement |
| `GET` | `/admin/bonuses` | Log bonus yang telah diberikan |
| `GET` | `/admin/overtimes` | Log lembur seluruh karyawan |
| `GET` | `/admin/overtimes/recap` | Ringkasan total lembur karyawan |
| `GET` | `/admin/holidays` | Daftar seluruh hari libur terkonfigurasi |

### Admin (Hanya Akses Modifikasi Admin)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/employees` | Mendaftarkan karyawan baru |
| `PUT` | `/employees/{id}` | Memperbarui info profil dasar karyawan |
| `DELETE` | `/employees/{id}` | Menghapus karyawan (Soft Delete) |
| `POST` | `/employees/{id}/profile` | Memperbarui detail biodata/berkas karyawan |
| `POST` | `/admin/attendances` | Input data kehadiran manual |
| `PUT` | `/admin/attendances/{id}` | Memperbarui/koreksi kehadiran |
| `PUT` | `/admin/office-setting` | Memperbarui koordinat & radius GPS kantor |
| `PUT` | `/admin/leaves/{id}/approve` | Menyetujui pengajuan cuti |
| `PUT` | `/admin/leaves/{id}/reject` | Menolak pengajuan cuti |
| `PUT` | `/admin/permits/{id}/approve` | Menyetujui pengajuan izin/sakit |
| `PUT` | `/admin/permits/{id}/reject` | Menolak pengajuan izin/sakit |
| `POST` | `/admin/payroll/configurations` | Membuat / mengubah komponen gaji karyawan |
| `POST` | `/admin/payroll/generate` | Memproses hitung gaji bulanan otomatis |
| `PUT` | `/admin/payroll/{id}/update` | Koreksi manual angka di slip gaji |
| `DELETE` | `/admin/payroll/{id}` | Menghapus slip gaji tertentu |
| `POST` | `/admin/payroll/{id}/submit-approval` | Mengirim slip gaji ke direktur untuk disetujui |
| `POST` | `/admin/payroll/submit-all-approval` | Mengirim semua slip gaji aktif ke direktur |
| `POST` | `/admin/holidays` | Menambah hari libur nasional manual |
| `POST` | `/admin/holidays/import` | Mengimpor daftar hari libur dari file eksternal |
| `DELETE` | `/admin/holidays/{id}` | Menghapus hari libur nasional terdaftar |
| `POST` | `/admin/shifts` | Membuat shift kerja baru |
| `PUT` | `/admin/shifts/{id}` | Memperbarui pengaturan shift |
| `DELETE` | `/admin/shifts/{id}` | Menghapus shift kerja |
| `POST` | `/admin/inventories` | Menambahkan inventaris barang baru |
| `POST` | `/admin/inventories/{id}/update` | Memperbarui data inventaris barang |
| `DELETE` | `/admin/inventories/{id}` | Menghapus data barang |
| `PUT` | `/admin/reimbursements/{id}/approve` | Menyetujui pengajuan reimbursement |
| `PUT` | `/admin/reimbursements/{id}/reject` | Menolak pengajuan reimbursement |
| `POST` | `/admin/bonuses` | Memberikan bonus baru ke karyawan |
| `PUT` | `/admin/bonuses/{id}` | Memperbarui detail bonus |
| `DELETE` | `/admin/bonuses/{id}` | Menghapus bonus terdaftar |
| `PUT` | `/admin/overtimes/{id}/approve` | Menyetujui lembur |
| `PUT` | `/admin/overtimes/{id}/reject` | Menolak lembur |
| `GET` | `/admin/backup/export` | Ekspor cadangan database |
| `POST` | `/admin/backup/import` | Impor/restore cadangan database |
| `GET` | `/admin/recycle-bin` | Menampilkan seluruh data soft-deleted |
| `POST` | `/admin/recycle-bin/{id}/restore` | Memulihkan data dari tempat sampah |
| `DELETE` | `/admin/recycle-bin/{id}` | Menghapus data permanen |

### Director (Hanya Akses Persetujuan Akhir Direktur)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/director/dashboard-summary` | Memperoleh metrik keuangan & ringkasan aktivitas |
| `PUT` | `/director/employees/{id}/approve` | Menyetujui pendaftaran karyawan baru |
| `PUT` | `/director/employees/{id}/reject` | Menolak pendaftaran karyawan baru |
| `PUT` | `/director/employees/{id}/approve-delete` | Menyetujui penghapusan permanen karyawan |
| `PUT` | `/director/employees/{id}/reject-delete` | Membatalkan penghapusan karyawan |
| `PUT` | `/director/payroll/configurations/{id}/approve` | Menyetujui formula gaji baru |
| `PUT` | `/director/payroll/configurations/{id}/reject` | Menolak formula gaji baru |
| `PUT` | `/director/payroll/{id}/approve` | Menyetujui slip gaji individu |
| `PUT` | `/director/payroll/{id}/reject` | Menolak slip gaji individu |
| `POST` | `/director/payroll/approve-all` | Menyetujui seluruh slip gaji yang diajukan |
| `POST` | `/director/payroll/reject-all` | Menolak seluruh slip gaji yang diajukan |
| `PUT` | `/director/payroll/{id}/pay` | Approval akhir & tandai payroll terbayar |
| `PUT` | `/director/leaves/{id}/approve` | Approval akhir permohonan cuti |
| `PUT` | `/director/leaves/{id}/reject` | Penolakan akhir permohonan cuti |
| `PUT` | `/director/permits/{id}/approve` | Approval akhir permohonan izin/sakit |
| `PUT` | `/director/permits/{id}/reject` | Penolakan akhir permohonan izin/sakit |
| `PUT` | `/director/overtimes/{id}/approve` | Approval akhir permohonan lembur |
| `PUT` | `/director/overtimes/{id}/reject` | Penolakan akhir permohonan lembur |
| `PUT` | `/director/reimbursements/{id}/approve` | Approval akhir reimbursement |
| `PUT` | `/director/reimbursements/{id}/reject` | Penolakan akhir reimbursement |
| `PUT` | `/director/bonuses/{id}/approve` | Approval akhir pembagian bonus |
| `PUT` | `/director/bonuses/{id}/reject` | Penolakan akhir pembagian bonus |
| `PUT` | `/director/attendances/{id}/approve` | Menyetujui usulan koreksi kehadiran |
| `PUT` | `/director/attendances/{id}/reject` | Menolak usulan koreksi kehadiran |
| `PUT` | `/director/inventories/{id}/approve` | Menyetujui penambahan/perubahan inventaris |
| `PUT` | `/director/inventories/{id}/reject` | Menolak penambahan/perubahan inventaris |

---

## 🖼 Screenshot

> _Screenshot akan ditambahkan di sini._

---

## 📄 Lisensi

Proyek ini dikembangkan untuk keperluan internal perusahaan.

---

<p align="center">
  <sub>Dibuat dengan ❤️ menggunakan React + Laravel</sub>
</p>
