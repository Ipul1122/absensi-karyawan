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
- Manajemen profil karyawan (foto, CV, data pribadi)
- Ganti password

### 📍 Absensi (Attendance)
- **Absen Kantor** — Clock In/Out berbasis GPS & radius kantor
- **Kunjungan Sales** — Absensi lapangan untuk tim sales
- **Kunjungan Klien** — Absensi kunjungan ke klien (client visit)
- Deteksi otomatis status: Normal, Terlambat, Pulang Cepat, Lembur
- Foto selfie saat absen (bukti kehadiran)
- Riwayat absensi lengkap

### 📅 Cuti & Lembur
- Pengajuan cuti dengan alasan & tanggal
- Pengajuan lembur kerja
- Persetujuan bertingkat (Admin → Direktur)

### 💰 Penggajian (Payroll)
- Konfigurasi gaji pokok, tunjangan, & potongan
- Generate slip gaji bulanan otomatis
- Deduction otomatis berdasarkan ketidakhadiran
- Alur approval payroll oleh direktur

### 💳 Reimbursement & Bonus
- Pengajuan reimbursement oleh karyawan
- Manajemen bonus oleh admin
- Persetujuan oleh admin & direktur

### 🏢 Inventaris Kantor
- Pengelolaan aset & inventaris perusahaan
- Upload foto inventaris

### 📊 Dashboard & Rekap
- **Admin Dashboard** — Overview seluruh kehadiran, manajemen karyawan
- **Employee Dashboard** — Status absen hari ini, ringkasan data pribadi
- **Director Dashboard** — Persetujuan operasional, monitoring keuangan
- Rekap absensi bulanan dengan filter & pencarian

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
cd frontend

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
| `App.tsx` | Root component, auth state & routing utama |
| `Login.tsx` | Halaman login |
| `AdminDashboard.tsx` | Dashboard admin dengan nested routes |
| `EmployeeDashboard.tsx` | Dashboard karyawan dengan nested routes |
| `direktur/DirectorDashboard.tsx` | Dashboard direktur |

#### Admin Components (`components/admin/`)

| Komponen | Deskripsi |
|----------|-----------|
| `DashboardOverview.tsx` | Overview statistik keseluruhan |
| `RekapAbsensi.tsx` | Rekap absensi semua karyawan |
| `AkunKaryawan.tsx` | Manajemen akun karyawan |
| `LokasiKantor.tsx` | Pengaturan lokasi & radius kantor |
| `AdminPayroll.tsx` | Manajemen penggajian |
| `AdminSalaryConfig.tsx` | Konfigurasi komponen gaji |
| `AdminCuti.tsx` | Persetujuan cuti |
| `AdminOvertime.tsx` | Persetujuan lembur |
| `AdminReimbursement.tsx` | Persetujuan reimbursement |
| `AdminBonus.tsx` | Manajemen bonus karyawan |
| `AdminInventaris.tsx` | Manajemen inventaris kantor |
| `SalesVisitsLog.tsx` | Log kunjungan sales |

#### Employee Components (`components/employee/`)

| Komponen | Deskripsi |
|----------|-----------|
| `EmployeeOverview.tsx` | Ringkasan dashboard karyawan |
| `EmployeeAbsen.tsx` | Absen kantor (Clock In/Out) |
| `EmployeeSales.tsx` | Absen kunjungan sales |
| `EmployeeClient.tsx` | Absen kunjungan klien |
| `EmployeeHistory.tsx` | Riwayat absensi |
| `EmployeeCuti.tsx` | Pengajuan cuti |
| `EmployeeOvertime.tsx` | Pengajuan lembur |
| `EmployeePayroll.tsx` | Lihat slip gaji |
| `EmployeeReimbursement.tsx` | Pengajuan reimbursement |
| `EmployeeBonus.tsx` | Lihat bonus |
| `EmployeeSettings.tsx` | Pengaturan profil & password |

#### Director Components (`components/direktur/`)

| Komponen | Deskripsi |
|----------|-----------|
| `DirectorDashboard.tsx` | Dashboard utama direktur |
| `DirekturOverview.tsx` | Overview statistik |
| `LogKehadiran.tsx` | Log kehadiran semua karyawan |
| `PersetujuanKaryawan.tsx` | Approval data karyawan baru |
| `PersetujuanKehadiran.tsx` | Approval koreksi kehadiran |
| `PersetujuanGaji.tsx` | Approval konfigurasi gaji |
| `PersetujuanPayroll.tsx` | Approval slip gaji |
| `PersetujuanOperational.tsx` | Approval cuti, lembur, reimbursement, bonus |

### Backend — Controllers

| Controller | Deskripsi |
|------------|-----------|
| `AuthController.php` | Login, logout, profil, ganti password |
| `AttendanceController.php` | CRUD absensi, check-in/out, rekap |
| `EmployeeController.php` | CRUD karyawan, approval oleh direktur |
| `LeaveController.php` | CRUD cuti, approval admin & direktur |
| `PayrollController.php` | Generate payroll, konfigurasi gaji, approval |
| `OvertimeController.php` | CRUD lembur, approval admin & direktur |
| `ReimbursementController.php` | CRUD reimbursement, approval bertingkat |
| `BonusController.php` | CRUD bonus, approval direktur |
| `InventoryController.php` | CRUD inventaris kantor |
| `SalesVisitController.php` | Pencatatan kunjungan sales/klien |

### Backend — Models

| Model | Tabel |
|-------|-------|
| `User.php` | `users` |
| `Attendance.php` | `attendances` |
| `LeaveRequest.php` | `leave_requests` |
| `Payroll.php` | `payrolls` |
| `SalaryConfiguration.php` | `salary_configurations` |
| `Overtime.php` | `overtimes` |
| `Reimbursement.php` | `reimbursements` |
| `Bonus.php` | `bonuses` |
| `Inventory.php` | `inventories` |
| `SalesVisit.php` | `sales_visits` |
| `OfficeSetting.php` | `office_settings` |

---

## 👥 Role & Hak Akses

Aplikasi memiliki **3 role** dengan hak akses berbeda:

### 🔴 Admin
- Manajemen CRUD karyawan
- Input absensi manual & koreksi
- Konfigurasi lokasi kantor & radius GPS
- Generate & kelola payroll
- Approval cuti, lembur, reimbursement
- Manajemen bonus & inventaris
- Melihat log kunjungan sales

### 🟢 Employee (Karyawan)
- Absensi mandiri (kantor, sales, klien)
- Pengajuan cuti, lembur, reimbursement
- Lihat slip gaji & bonus
- Lihat riwayat absensi
- Kelola profil & password

### 🔵 Director (Direktur)
- **Read-only** akses ke seluruh data admin
- Approval karyawan baru / penghapusan
- Approval konfigurasi gaji
- Approval slip gaji (payroll)
- Approval cuti, lembur, reimbursement, bonus
- Approval koreksi kehadiran

### Alur Approval Bertingkat

```
Karyawan mengajukan → Admin menyetujui → Direktur memberikan approval akhir
```

---

## 🔌 API Endpoints

Base URL: `http://localhost:8000/api`

### Public
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/health-check` | Cek koneksi backend & database |
| `POST` | `/login` | Login & dapatkan token |

### Authenticated (Semua Role)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/logout` | Logout & revoke token |
| `GET` | `/user` | Info user yang sedang login |
| `GET` | `/user/profile` | Detail profil lengkap |
| `POST` | `/user/profile` | Update profil |
| `PUT` | `/user/change-password` | Ganti password |

### Attendance (Karyawan)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/attendance/today` | Absensi hari ini |
| `POST` | `/attendance/check-in` | Clock In |
| `POST` | `/attendance/check-out` | Clock Out |
| `GET` | `/attendance/history` | Riwayat absensi |
| `GET` | `/office-setting` | Info lokasi kantor |

### Cuti (Leave)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/leaves` | List cuti karyawan |
| `POST` | `/leaves` | Ajukan cuti baru |
| `DELETE` | `/leaves/{id}` | Batalkan pengajuan cuti |

### Lembur (Overtime)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/overtimes` | List lembur karyawan |
| `POST` | `/overtimes` | Ajukan lembur baru |
| `DELETE` | `/overtimes/{id}` | Batalkan pengajuan lembur |

### Reimbursement
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/reimbursements` | List reimbursement karyawan |
| `POST` | `/reimbursements` | Ajukan reimbursement baru |
| `DELETE` | `/reimbursements/{id}` | Batalkan pengajuan |

### Bonus & Payroll (Karyawan)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/bonuses` | List bonus karyawan |
| `GET` | `/payroll/my-slips` | Slip gaji karyawan |

### Sales Visit (Karyawan)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/sales-visits` | Catat kunjungan |
| `GET` | `/sales-visits/today` | Kunjungan hari ini |

### Admin Routes
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/employees` | List semua karyawan |
| `POST` | `/employees` | Tambah karyawan baru |
| `PUT` | `/employees/{id}` | Update data karyawan |
| `DELETE` | `/employees/{id}` | Hapus karyawan |
| `GET` | `/admin/attendances` | Semua data absensi |
| `POST` | `/admin/attendances` | Input absensi manual |
| `PUT` | `/admin/attendances/{id}` | Edit absensi |
| `PUT` | `/admin/office-setting` | Update lokasi kantor |
| `PUT` | `/admin/leaves/{id}/approve` | Setujui cuti |
| `PUT` | `/admin/leaves/{id}/reject` | Tolak cuti |
| `POST` | `/admin/payroll/generate` | Generate payroll |
| `PUT` | `/admin/payroll/{id}/pay` | Update status bayar |
| `POST` | `/admin/inventories` | Tambah inventaris |
| `PUT` | `/admin/reimbursements/{id}/approve` | Setujui reimbursement |
| `POST` | `/admin/bonuses` | Tambah bonus |
| `PUT` | `/admin/overtimes/{id}/approve` | Setujui lembur |

### Director Routes
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `PUT` | `/director/employees/{id}/approve` | Approve karyawan baru |
| `PUT` | `/director/employees/{id}/reject` | Reject karyawan baru |
| `PUT` | `/director/payroll/{id}/approve` | Approve slip gaji |
| `POST` | `/director/payroll/approve-all` | Approve semua payroll |
| `PUT` | `/director/leaves/{id}/approve` | Approve cuti |
| `PUT` | `/director/overtimes/{id}/approve` | Approve lembur |
| `PUT` | `/director/reimbursements/{id}/approve` | Approve reimbursement |
| `PUT` | `/director/bonuses/{id}/approve` | Approve bonus |
| `PUT` | `/director/attendances/{id}/approve` | Approve koreksi absen |

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
