# 📋 goodpeople-hcms — Sistem Manajemen Kehadiran & HCMS Karyawan

> Platform full-stack Human Capital Management System (HCMS) untuk manajemen kehadiran, multi-cabang kantor, jadwal kerja fleksibel/shift, perizinan/cuti, penggajian (payroll) digital ber-QR Code, inventaris, klaim reimbursement, dan alur persetujuan bertingkat. Dibangun dengan **React 19 + TypeScript** (Frontend) dan **Laravel 13** (Backend API).

---

## 📑 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Fitur Utama & Pembaruan](#-fitur-utama--pembaruan)
- [Tech Stack & Arsitektur](#-tech-stack--arsitektur)
- [Struktur Folder](#-struktur-folder)
- [Role & Hak Akses](#-role--hak-akses)
- [Prasyarat & Instalasi](#-prasyarat--instalasi)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Daftar Lengkap API Endpoints](#-daftar-lengkap-api-endpoints)
- [Halaman Publik & Kepatuhan](#-halaman-publik--kepatuhan)
- [Lisensi](#-lisensi)

---

## 🧾 Tentang Proyek

**goodpeople-hcms** adalah aplikasi manajemen SDM dan presensi karyawan modern yang mendukung multi-entitas perusahaan (*PT Cakrawala Parama Internasional* & *PT Yasodana Parvez Internasional*) serta multi-kantor cabang (Jakarta & Bogor). 

Sistem ini melayani 3 level pengguna dengan hak akses spesifik:
1. **Admin (HR / Operasional)**: Pengelolaan penuh master data karyawan, shift, multi-lokasi kantor, rekap absensi, jadwal khusus (*schedule override*), payroll, reimbursement, dan inventaris.
2. **Employee (Karyawan)**: Presensi GPS & selfie (kantor, sales visit, client visit), checkout visit, pengajuan cuti, izin/sakit, lembur, klaim reimbursement, serta unduh slip gaji digital.
3. **Director (Direktur)**: Monitoring analitik eksekutif dan *final approval* untuk seluruh transaksi operasional, karyawan baru, komponen gaji, dan payroll massal.

---

## ✨ Fitur Utama & Pembaruan

### 🏢 Multi-Company & Multi-Office Location
- **Multi-Entitas Perusahaan**: Branding dinamis (logo, favicon, judul tab browser) otomatis menyesuaikan entitas perusahaan karyawan (*PT CPI* / *PT YPI*).
- **Multi-Kantor Cabang**: Konfigurasi koordinat GPS dan radius toleransi terpisah untuk **Kantor Jakarta** dan **Kantor Bogor**.
- **Penetapan Lokasi per Karyawan**: Karyawan dapat dialokasikan ke kantor tertentu sesuai penempatan tugas.

### 📍 Presensi & Kunjungan Lapangan
- **Absen Kantor (Clock In & Clock Out)**: Validasi radius GPS kantor + pengambilan foto selfie bukti kehadiran.
- **Kunjungan Sales & Klien (Visit Management)**: 
  - Check-in lokasi kunjungan sales/klien dengan foto selfie dan deskripsi agenda.
  - **Fitur Check-Out Kunjungan**: Pencatatan waktu selesai kunjungan, catatan hasil pertemuan, dan kalkulasi otomatis durasi visit.
- **Deteksi Status Otomatis**: Normal, Terlambat (dengan toleransi menit fleksibel), Pulang Cepat, dan Lembur.
- **Riwayat & Rekap Absensi**: Filter tanggal, divisi, status kehadiran, dan ekspor data rekapitulasi.

### 🕒 Shift Kerja & Override Jadwal (Schedule Override)
- **Master Shift Kerja**: Jam masuk, jam pulang, dan toleransi keterlambatan dinamis.
- **Penetapan Libur Mingguan (Sunday Off / Day Off)**: Pengaturan hari libur khusus per individu karyawan.
- **Override Jadwal Kerja (*Employee Schedule Override*)**: Penyesuaian jadwal dinamis pada rentang tanggal tertentu untuk penugasan khusus tanpa mengubah shift default.
- **Kalender Libur Nasional**: Manajemen hari libur nasional serta fitur impor kalender libur.

### 💰 Penggajian Digital & Verifikasi Slip (Payroll with QR Code)
- **Konfigurasi Komponen Gaji**: Gaji pokok, tunjangan tetap, bonus, dan potongan otomatis berbasis absensi/keterlambatan.
- **Generate Payroll Massal**: Pembuatan slip gaji otomatis bulanan untuk seluruh karyawan dalam satu klik.
- **Alur Approval Payroll Bertingkat**: Admin mengajukan $\rightarrow$ Direktur menyetujui (satuan atau *Approve All*) $\rightarrow$ Direktur menandai *Paid*.
- **Slip Gaji Digital dengan QR Code**:
  - Halaman verifikasi publik (`/verify-slip/:id/:hash`) untuk memeriksa keaslian dokumen slip gaji secara instan tanpa perlu login.
  - Cetak slip gaji format standar cetak dan unduh PDF.

### 📅 Operasional & Multi-Level Approval
- **Cuti Tahunan & Khusus**: Pengajuan tanggal, alasan, dan pelacakan sisa kuota cuti.
- **Izin & Sakit (*Permit Request*)**: Formulir terpisah untuk izin atau sakit dengan lampiran dokumen/surat keterangan dokter.
- **Lembur Kerja (*Overtime*)**: Pengajuan jam lembur dan rekapitulasi jam kerja tambahan.
- **Reimbursement Dana**: Pengajuan klaim biaya operasional dengan upload foto nota/kuitansi.
- **Pemberian Bonus**: Manajemen insentif/bonus performa oleh Admin dengan persetujuan Direktur.

### 🛡 Keamanan, Monitoring & Pemulihan Data
- **Activity & Online Tracking (*Last Seen*)**: Middleware pencatatan aktivitas terakhir user untuk memantau status online staf secara real-time.
- **Recycle Bin (Soft Deletes)**: Tempat sampah pemulihan data karyawan dan transaksi yang terhapus agar dapat di-*restore* kembali.
- **Backup & Restore Database**: Ekspor file database SQL dan impor cadangan langsung melalui antarmuka Admin.
- **Notifikasi Push & WhatsApp**:
  - Integrasi Web Push Notification untuk update status pengajuan & approval.
  - Tautan kontak langsung WhatsApp Admin aktif.

---

## 🛠 Tech Stack & Arsitektur

### Frontend
| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| **React** | 19.x | UI Library |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Vite** | 6.x | Build tool, HMR & dev server |
| **React Router** | 7.x | Client-side routing dengan Code Splitting (`React.lazy` & `Suspense`) |
| **Axios** | - | HTTP client dengan Interceptor token |
| **Lucide React** | - | Icon library modern |
| **SweetAlert2** | - | Modal, dialog alert, dan konfirmasi interaktif |

### Backend
| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| **PHP** | ≥ 8.3 | Server runtime |
| **Laravel** | 13.x | Backend REST API framework |
| **Laravel Sanctum** | 4.x | Token-based API Authentication |
| **MySQL / SQLite** | - | Relational database (default support MySQL & SQLite) |

### Arsitektur Repositori
```
absen-karyawan/
├── frontend/                  ← Single Page Application (React + Vite)
│   ├── public/                ← Asset logo, favicon, manifest
│   └── src/
│       ├── components/
│       │   ├── admin/         ← Modul Admin (absensi, dataKaryawan, payroll, operasional, pengaturan)
│       │   ├── employee/      ← Modul Karyawan (absensi, operasional, payroll, biodata)
│       │   ├── direktur/      ← Modul Direktur (analitik & persetujuan berjenjang)
│       │   ├── payroll/       ← Verifikasi slip gaji publik (VerifySlip)
│       │   ├── public/        ← Kebijakan privasi, syarat layanan, kepatuhan keamanan
│       │   ├── layout/        ← Sidebar navigasi, Header, Logo
│       │   └── Login.tsx      ← Halaman login & reset password
│       ├── utils/             ← Helper axios, format tanggal, rupiah, dll
│       ├── App.tsx            ← Root router & state otentikasi
│       └── main.tsx           ← Entry point
│
├── backend/                   ← Laravel 13 REST API
│   ├── app/
│   │   ├── Http/Controllers/  ← REST API Controllers
│   │   ├── Http/Middleware/   ← Auth Sanctum, Role Checks, LastSeen Middleware
│   │   └── Models/            ← Eloquent Models & Relasi
│   ├── database/
│   │   ├── migrations/        ← Skema migrasi database
│   │   └── seeders/           ← Seeder akun default & master data
│   ├── routes/
│   │   └── api.php            ← Seluruh routing REST API backend
│   └── config/                ← Konfigurasi aplikasi, auth, & database
│
├── absensi.md                 ← Analisis & roadmap pengembangan produk komersial
└── README.md                  ← Dokumentasi utama proyek
```

---

## 📁 Struktur Komponen Frontend

```
frontend/src/components/
├── AdminDashboard.tsx
├── EmployeeDashboard.tsx
├── Login.tsx
│
├── admin/
│   ├── DashboardOverview.tsx
│   ├── absensi/
│   │   ├── RekapAbsensi.tsx
│   │   ├── SalesVisitsLog.tsx
│   │   └── AbsenMandiriAdmin.tsx
│   ├── dataKaryawan/
│   │   └── AkunKaryawan.tsx
│   ├── payroll/
│   │   ├── AdminPayroll.tsx
│   │   ├── AdminSalaryConfig.tsx
│   │   └── AdminBonus.tsx
│   ├── operasional/
│   │   ├── AdminCuti.tsx
│   │   ├── AdminIzin.tsx
│   │   ├── AdminOvertime.tsx
│   │   ├── AdminReimbursement.tsx
│   │   └── AdminInventaris.tsx
│   └── pengaturan/
│       ├── LokasiKantor.tsx
│       ├── KelolaShift.tsx
│       ├── AdminKelolaHariLibur.tsx
│       ├── ScheduleOverride.tsx
│       └── RecycleBin.tsx
│
├── employee/
│   ├── EmployeeOverview.tsx
│   ├── absensi/
│   │   ├── EmployeeAbsen.tsx
│   │   ├── EmployeeSales.tsx
│   │   ├── EmployeeClient.tsx
│   │   └── EmployeeHistory.tsx
│   ├── operasional/
│   │   ├── EmployeeCuti.tsx
│   │   ├── EmployeeIzin.tsx
│   │   ├── EmployeeOvertime.tsx
│   │   └── EmployeeReimbursement.tsx
│   ├── payroll/
│   │   ├── EmployeePayroll.tsx
│   │   └── EmployeeBonus.tsx
│   └── pengaturan/
│       ├── BiodataSetting.tsx
│       └── EmployeeSettings.tsx
│
├── direktur/
│   ├── DirectorDashboard.tsx
│   ├── DirekturOverview.tsx
│   ├── kehadiran/LogKehadiran.tsx
│   ├── pengaturan/DirectorSettings.tsx
│   └── persetujuan/
│       ├── PersetujuanKaryawan.tsx
│       ├── PersetujuanKehadiran.tsx
│       ├── PersetujuanGaji.tsx
│       ├── PersetujuanPayroll.tsx
│       └── PersetujuanOperational.tsx
│
├── payroll/
│   └── VerifySlip.tsx
│
└── public/
    ├── PrivacyPolicy.tsx
    ├── TermsOfService.tsx
    └── SecurityCompliance.tsx
```

---

## 👥 Role & Hak Akses

| Fitur / Modul | Karyawan (Employee) | Admin (HR & Ops) | Direktur (Director) |
| :--- | :---: | :---: | :---: |
| **Absen GPS & Selfie (Kantor)** | ✅ | ✅ (Absen Mandiri) | ❌ |
| **Kunjungan Sales/Klien + Checkout** | ✅ | 👁️ Monitoring | 👁️ Monitoring |
| **Lihat Riwayat & Slip Gaji Pribadi** | ✅ | ✅ | ✅ |
| **Pengajuan Cuti / Izin / Lembur / Reimburse** | ✅ | ❌ | ❌ |
| **Manajemen Data Karyawan (CRUD)** | ❌ | ✅ | 👁️ Read & Approval Baru |
| **Atur Lokasi Kantor & Radius GPS** | ❌ | ✅ | 👁️ Read |
| **Atur Shift, Libur & Schedule Override** | ❌ | ✅ | 👁️ Read |
| **Approval Operasional Tahap 1 (Admin)** | ❌ | ✅ | ❌ |
| **Approval Operasional Akhir (Direktur)** | ❌ | ❌ | ✅ |
| **Generate & Sesuaikan Payroll** | ❌ | ✅ | ❌ |
| **Approval Payroll Massal & Bayar Gaji** | ❌ | ❌ | ✅ |
| **Backup, Restore & Recycle Bin** | ❌ | ✅ | ❌ |
| **Dashboard Analitik Eksekutif** | ❌ | ❌ | ✅ |

---

## 🚀 Prasyarat & Instalasi

### Prasyarat
- **PHP** ≥ 8.3 & **Composer** ≥ 2.x
- **Node.js** ≥ 18.x & **npm** ≥ 9.x
- **MySQL** 8.x (atau SQLite bawaan)

### Langkah Instalasi

1. **Clone Repository**:
   ```bash
   git clone https://github.com/Ipul1122/absensi-karyawan.git
   cd absen-karyawan
   ```

2. **Setup Backend**:
   ```bash
   cd backend
   composer install
   cp .env.example .env
   php artisan key:generate
   ```
   *Sesuaikan konfigurasi database pada `.env` (default SQLite atau MySQL `absen_karyawan`).*

3. **Migrasi & Seed Data**:
   ```bash
   php artisan migrate
   php artisan db:seed
   ```

4. **Setup Frontend**:
   ```bash
   cd ../frontend
   npm install
   ```

---

## ▶ Menjalankan Aplikasi

Jalankan backend dan frontend secara bersamaan pada terminal terpisah:

### 1. Terminal Backend (Port 8000)
```bash
cd backend
php artisan serve
```
*API Base URL*: `http://localhost:8000/api`

### 2. Terminal Frontend (Port 5173)
```bash
cd frontend
npm run dev
```
*Aplikasi Web*: `http://localhost:5173`

---

## 🔌 Daftar Lengkap API Endpoints

### 🌐 Public Endpoints
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/health-check` | Cek status server backend & database |
| `POST` | `/api/login` | Login user (Email & Password) |
| `POST` | `/api/forgot-password` | Pengajuan pemulihan password |
| `POST` | `/api/reset-password` | Reset password dengan token verifikasi |
| `GET` | `/api/payroll/verify/{id}/{hash}` | Verifikasi keabsahan slip gaji digital publik |

### 🔐 Authenticated (Semua Role)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/logout` | Revoke token Sanctum aktif |
| `GET` | `/api/user` | Informasi ringkas user login |
| `GET` | `/api/user/profile` | Biodata & profil lengkap |
| `POST` | `/api/user/profile` | Update foto profil & biodata |
| `PUT` | `/api/user/change-password` | Ganti password akun |
| `GET` | `/api/admin-contact` | Kontak WhatsApp Admin aktif |
| `GET` | `/api/office-setting` | Ambil pengaturan koordinat kantor |
| `GET` | `/api/shifts` | Daftar shift kerja |
| `GET` | `/api/holidays/upcoming` | Daftar libur nasional mendatang |
| `GET` | `/api/sidebar/notification-counts` | Hitungan badge notifikasi pending |
| `POST` | `/api/push-subscriptions` | Daftarkan subscription push browser |
| `POST` | `/api/push-subscriptions/unsubscribe` | Hapus subscription push notifikasi |
| `POST` | `/api/push-subscriptions/test` | Uji coba pengiriman push notifikasi |

### 🟢 Modul Employee (Karyawan)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/attendance/today` | Status presensi hari ini |
| `POST` | `/api/attendance/check-in` | Clock In absensi kantor (GPS + Selfie) |
| `POST` | `/api/attendance/check-out` | Clock Out absensi kantor |
| `GET` | `/api/attendance/history` | Riwayat absensi bulanan pribadi |
| `POST` | `/api/sales-visits` | Check-in kunjungan sales/klien |
| `GET` | `/api/sales-visits/today` | Daftar kunjungan hari ini |
| `PUT` | `/api/sales-visits/{id}/checkout` | Check-out kunjungan sales/klien |
| `GET` | `/api/leaves` | Riwayat & daftar cuti pribadi |
| `POST` | `/api/leaves` | Ajukan permohonan cuti baru |
| `DELETE` | `/api/leaves/{id}` | Batalkan draf pengajuan cuti |
| `GET` | `/api/permits` | Riwayat & daftar izin/sakit pribadi |
| `POST` | `/api/permits` | Ajukan izin/sakit (+ file bukti) |
| `DELETE` | `/api/permits/{id}` | Batalkan pengajuan izin/sakit |
| `GET` | `/api/overtimes` | Riwayat & daftar lembur pribadi |
| `POST` | `/api/overtimes` | Ajukan lembur baru |
| `DELETE` | `/api/overtimes/{id}` | Batalkan pengajuan lembur |
| `GET` | `/api/reimbursements` | Riwayat & daftar reimbursement |
| `POST` | `/api/reimbursements` | Ajukan klaim reimbursement (+ kuitansi) |
| `DELETE` | `/api/reimbursements/{id}` | Batalkan klaim reimbursement |
| `GET` | `/api/bonuses` | Riwayat perolehan bonus |
| `GET` | `/api/payroll/my-slips` | Daftar slip gaji bulanan pribadi |
| `GET` | `/api/schedule-overrides/my` | Jadwal khusus penugasan pribadi |

### 🔴 Modul Admin
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/employees` | Seluruh data master karyawan |
| `POST` | `/api/employees` | Daftarkan karyawan baru |
| `PUT` | `/api/employees/{id}` | Update informasi dasar karyawan |
| `DELETE` | `/api/employees/{id}` | Hapus karyawan (Soft Delete) |
| `GET` | `/api/employees/{id}/profile` | Lihat profil lengkap karyawan |
| `POST` | `/api/employees/{id}/profile` | Update profil/biodata karyawan oleh Admin |
| `GET` | `/api/admin/attendances` | Laporan dan log absensi seluruh karyawan |
| `POST` | `/api/admin/attendances` | Input presensi manual |
| `PUT` | `/api/admin/attendances/{id}` | Koreksi log presensi |
| `GET` | `/api/admin/sales-visits` | Log seluruh kunjungan sales/klien |
| `PUT` | `/api/admin/sales-visits/{id}` | Update log kunjungan sales |
| `PUT` | `/api/admin/office-setting` | Update koordinat kantor Jakarta & Bogor |
| `GET` | `/api/admin/shifts` | Daftar master shift |
| `POST` | `/api/admin/shifts` | Buat shift kerja baru |
| `PUT` | `/api/admin/shifts/{id}` | Edit pengaturan shift |
| `DELETE` | `/api/admin/shifts/{id}` | Hapus shift |
| `GET` | `/api/admin/schedule-overrides` | Daftar jadwal override khusus |
| `POST` | `/api/admin/schedule-overrides` | Tambah jadwal override karyawan |
| `DELETE` | `/api/admin/schedule-overrides/{id}` | Hapus jadwal override |
| `GET` | `/api/admin/holidays` | Daftar hari libur nasional |
| `POST` | `/api/admin/holidays` | Tambah hari libur manual |
| `POST` | `/api/admin/holidays/import` | Impor data hari libur |
| `DELETE` | `/api/admin/holidays/{id}` | Hapus hari libur |
| `GET` | `/api/admin/leaves` | Log cuti seluruh staf |
| `PUT` | `/api/admin/leaves/{id}/approve` | Persetujuan cuti tahap Admin |
| `PUT` | `/api/admin/leaves/{id}/reject` | Tolak pengajuan cuti |
| `GET` | `/api/admin/permits` | Log izin/sakit seluruh staf |
| `PUT` | `/api/admin/permits/{id}/approve` | Persetujuan izin tahap Admin |
| `PUT` | `/api/admin/permits/{id}/reject` | Tolak pengajuan izin |
| `GET` | `/api/admin/overtimes` | Log lembur seluruh staf |
| `GET` | `/api/admin/overtimes/recap` | Rekapitulasi total jam lembur |
| `PUT` | `/api/admin/overtimes/{id}/approve` | Persetujuan lembur tahap Admin |
| `PUT` | `/api/admin/overtimes/{id}/reject` | Tolak pengajuan lembur |
| `GET` | `/api/admin/reimbursements` | Log reimbursement seluruh staf |
| `GET` | `/api/admin/reimbursements/summary` | Ringkasan statistik reimbursement |
| `PUT` | `/api/admin/reimbursements/{id}/approve` | Persetujuan reimbursement tahap Admin |
| `PUT` | `/api/admin/reimbursements/{id}/reject` | Tolak reimbursement |
| `GET` | `/api/admin/bonuses` | Log daftar bonus |
| `POST` | `/api/admin/bonuses` | Berikan bonus baru |
| `PUT` | `/api/admin/bonuses/{id}` | Edit bonus |
| `DELETE` | `/api/admin/bonuses/{id}` | Hapus bonus |
| `GET` | `/api/admin/inventories` | Master inventaris aset perusahaan |
| `POST` | `/api/admin/inventories` | Tambah aset baru |
| `POST` | `/api/admin/inventories/{id}/update` | Edit aset |
| `DELETE` | `/api/admin/inventories/{id}` | Hapus aset |
| `GET` | `/api/admin/payroll/configurations` | Skema gaji terdaftar |
| `POST` | `/api/admin/payroll/configurations` | Update formula/komponen gaji |
| `GET` | `/api/admin/payroll` | Daftar slip gaji bulanan |
| `POST` | `/api/admin/payroll/generate` | Generate payroll otomatis |
| `PUT` | `/api/admin/payroll/{id}/update` | Koreksi manual slip gaji |
| `DELETE` | `/api/admin/payroll/{id}` | Hapus slip gaji |
| `POST` | `/api/admin/payroll/{id}/submit-approval` | Ajukan slip gaji ke Direktur |
| `POST` | `/api/admin/payroll/submit-all-approval` | Ajukan semua slip ke Direktur |
| `GET` | `/api/admin/backup/export` | Download file cadangan database SQL |
| `POST` | `/api/admin/backup/import` | Impor/restore cadangan database |
| `GET` | `/api/admin/recycle-bin` | Daftar item soft-deleted |
| `POST` | `/api/admin/recycle-bin/{id}/restore` | Pulihkan data dari tempat sampah |
| `DELETE` | `/api/admin/recycle-bin/{id}` | Hapus data permanen (*force delete*) |

### 🔵 Modul Director (Direktur)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/director/dashboard-summary` | Ringkasan metrik eksekutif & finansial |
| `PUT` | `/api/director/employees/{id}/approve` | Approval akhir karyawan baru |
| `PUT` | `/api/director/employees/{id}/reject` | Tolak registrasi karyawan baru |
| `PUT` | `/api/director/employees/{id}/approve-delete` | Approval penghapusan karyawan |
| `PUT` | `/api/director/employees/{id}/reject-delete` | Batalkan penghapusan karyawan |
| `PUT` | `/api/director/payroll/configurations/{id}/approve` | Approval formula gaji |
| `PUT` | `/api/director/payroll/configurations/{id}/reject` | Tolak formula gaji |
| `PUT` | `/api/director/payroll/{id}/approve` | Approval slip gaji individu |
| `PUT` | `/api/director/payroll/{id}/reject` | Tolak slip gaji individu |
| `POST` | `/api/director/payroll/approve-all` | Approval massal seluruh slip gaji |
| `POST` | `/api/director/payroll/reject-all` | Tolak seluruh slip gaji |
| `PUT` | `/api/director/payroll/{id}/pay` | Rilis & tandai gaji sudah dibayarkan |
| `PUT` | `/api/director/leaves/{id}/approve` | Approval akhir cuti |
| `PUT` | `/api/director/leaves/{id}/reject` | Tolak cuti |
| `PUT` | `/api/director/permits/{id}/approve` | Approval akhir izin/sakit |
| `PUT` | `/api/director/permits/{id}/reject` | Tolak izin/sakit |
| `PUT` | `/api/director/overtimes/{id}/approve` | Approval akhir lembur |
| `PUT` | `/api/director/overtimes/{id}/reject` | Tolak lembur |
| `PUT` | `/api/director/reimbursements/{id}/approve` | Approval akhir reimbursement |
| `PUT` | `/api/director/reimbursements/{id}/reject` | Tolak reimbursement |
| `PUT` | `/api/director/bonuses/{id}/approve` | Approval akhir bonus |
| `PUT` | `/api/director/bonuses/{id}/reject` | Tolak bonus |
| `PUT` | `/api/director/attendances/{id}/approve` | Approval koreksi presensi |
| `PUT` | `/api/director/attendances/{id}/reject` | Tolak koreksi presensi |
| `PUT` | `/api/director/inventories/{id}/approve` | Approval perubahan inventaris |
| `PUT` | `/api/director/inventories/{id}/reject` | Tolak perubahan inventaris |

---

## 📜 Halaman Publik & Kepatuhan

Aplikasi dilengkapi halaman kepatuhan standar hukum dan keamanan data:
- `/verify-slip/:id/:hash` — Verifikasi digital keaslian slip gaji via QR Code.
- `/privacy-policy` — Kebijakan Privasi data pengguna.
- `/terms-of-service` — Syarat & Ketentuan Layanan.
- `/security-compliance` — Informasi Kepatuhan Keamanan & Standar Perlindungan Data.

---

## 📄 Lisensi

Hak Cipta © 2026 **goodpeople-hcms**. Dikembangkan untuk operasional dan manajemen internal perusahaan.

<p align="center">
  <sub>Dibuat dengan dedikasi menggunakan React 19 + TypeScript + Laravel 13</sub>
</p>
