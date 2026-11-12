# 📋 Dokumentasi: Sistem Notifikasi Kontrak Karyawan Habis

## 🎯 Tujuan Fitur
Memberikan notifikasi otomatis kepada Direktur ketika masa kontrak karyawan akan habis atau sudah habis.

---

## 📦 Komponen Sistem

### 1. **Database Changes**
- **File**: `database/migrations/2026_11_12_000001_add_contract_fields_to_users_table.php`
- **Fields baru di `users` table**:
  - `contract_end_date` (date) - Tanggal berakhirnya kontrak
  - `contract_status` (enum: permanent/contract) - Status kontrak karyawan
  - `days_until_contract_end` (integer) - Sisa hari kontrak (auto-calculated)

- **File**: `database/migrations/2026_11_12_000002_create_contract_notifications_table.php`
- **Tabel baru**: `contract_notifications`
  - Menyimpan history notifikasi yang dikirim ke Direktur
  - Mencegah duplikasi notifikasi

### 2. **Models**
- **User.php** (Updated)
  - Scopes: `withContractExpiring()`, `withContractExpired()`, `contractEmployees()`
  - Methods: `getDaysUntilContractEnd()`, `isContractExpired()`, `isContractExpiringWithin()`

- **ContractNotification.php** (Baru)
  - Model untuk menyimpan notifikasi yang dikirim
  - Relationships: `user()`, `director()`

### 3. **Services**
- **ContractNotificationService.php**
  - `checkAndNotifyExpiringContracts($daysThreshold)` - Cek kontrak yang akan habis
  - `checkAndNotifyExpiredContracts()` - Cek kontrak yang sudah habis
  - `getPendingNotifications()` - Ambil notifikasi yang belum dibaca
  - `getAllNotifications()` - Ambil semua notifikasi dengan pagination
  - `markAsRead()` - Tandai notifikasi sudah dibaca
  - `getContractSummary()` - Ringkasan status kontrak untuk dashboard

### 4. **Controllers**
- **ContractNotificationController.php**
  - Endpoints untuk Direktur membaca notifikasi
  - Endpoints untuk Admin trigger manual check

### 5. **Console Commands**
- **CheckContractExpirations.php**
  - Command untuk cek kontrak otomatis
  - Bisa dijalankan manual atau dijadwalkan

---

## 🚀 Setup & Instalasi

### **Step 1: Jalankan Migration**
```bash
cd backend
php artisan migrate
```

### **Step 2: Konfigurasi Scheduling (Laravel Task Scheduler)**

#### **Option A: Cron Job (Production)**
Tambahkan entry ke crontab server:
```bash
* * * * * cd /path/to/backend && php artisan schedule:run >> /dev/null 2>&1
```

Kemudian daftarkan schedule di `app/Console/Kernel.php`:
```php
<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule)
    {
        // Check contract expirations setiap hari pada jam 08:00 pagi
        $schedule->command('contract:check-expirations --days=30')
                 ->dailyAt('08:00')
                 ->timezone('Asia/Jakarta')
                 ->withoutOverlapping();
    }

    protected function commands()
    {
        $this->load(__DIR__.'/Commands');
        require base_path('routes/console.php');
    }
}
```

#### **Option B: Manual Trigger (Development)**
Admin bisa trigger manual check via endpoint:
```
POST /api/admin/contract/trigger-check
```

---

## 📱 API Endpoints

### **Untuk Direktur**

#### 1. Get Pending Notifications
```
GET /api/director/contract-notifications/pending
```
**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "user_id": 5,
      "director_id": 1,
      "notification_type": "expiring_soon",
      "days_remaining": 15,
      "is_read": false,
      "notified_at": "2026-11-12T08:00:00Z",
      "user": {
        "id": 5,
        "name": "John Doe",
        "employee_number": "EMP-001",
        "contract_end_date": "2026-11-27"
      }
    }
  ],
  "count": 1
}
```

#### 2. Get All Notifications (dengan filter)
```
GET /api/director/contract-notifications?type=expiring_soon
```
**Query Parameters:**
- `type` (optional): `expiring_soon` atau `expired`
- `page` (optional): default 1

#### 3. Get Contract Summary
```
GET /api/director/contract-notifications/summary
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "total_contract_employees": 12,
    "expiring_soon_unread": 3,
    "expired_unread": 1,
    "total_pending": 4
  }
}
```

#### 4. Get Detail Karyawan dengan Kontrak
```
GET /api/director/contract-employees?type=expiring
```
**Query Parameters:**
- `type`: `expiring`, `expired`, atau `all`

**Response:**
```json
{
  "status": "success",
  "type": "expiring",
  "count": 3,
  "data": [
    {
      "id": 5,
      "name": "John Doe",
      "email": "john@email.com",
      "employee_number": "EMP-001",
      "division": "IT",
      "contract_end_date": "2026-11-27",
      "days_remaining": 15,
      "is_expired": false
    }
  ]
}
```

#### 5. Mark Notification as Read
```
PUT /api/director/contract-notifications/{id}/read
```

#### 6. Mark All as Read
```
POST /api/director/contract-notifications/mark-all-read
```

---

### **Untuk Admin**

#### 1. Trigger Manual Contract Check
```
POST /api/admin/contract/trigger-check
```
**Body:**
```json
{
  "days_threshold": 30
}
```

**Response:**
```json
{
  "status": "success",
  "expiring_check": {
    "status": "success",
    "created_notifications": 2,
    "expiring_employees": 3
  },
  "expired_check": {
    "status": "success",
    "created_notifications": 1,
    "expired_employees": 1
  }
}
```

---

## 🎛️ Mengatur Kontrak Karyawan

### Via API (Admin)
```
PUT /api/employees/{id}
```
**Body:**
```json
{
  "name": "John Doe",
  "contract_status": "contract",
  "contract_end_date": "2026-11-27"
}
```

### Via Database
```sql
UPDATE users SET 
  contract_status = 'contract',
  contract_end_date = '2026-11-27'
WHERE id = 5;
```

---

## 🔔 Sistem Push Notification

Notifikasi akan dikirim ke Direktur melalui Web Push jika:
1. Karyawan memiliki `contract_status = 'contract'`
2. `contract_end_date` sudah diset
3. Direktur sudah subscribe ke push notifications
4. VAPID keys sudah dikonfigurasi di `.env`

### Konfigurasi VAPID Keys
```bash
php artisan notification:generate-vapid
```

Hasilnya akan otomatis dimasukkan ke `.env`:
```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

---

## 🎨 Frontend Integration

### 1. **Sidebar Notification Badge**
Tambahkan endpoint ke sidebar untuk menampilkan badge:
```typescript
// Get contract summary untuk dashboard
const response = await axios.get('/api/director/contract-notifications/summary');
const { expiring_soon_unread, expired_unread } = response.data.data;
```

### 2. **Notifikasi Page Component**
```typescript
// Get all notifications dengan pagination
const response = await axios.get('/api/director/contract-notifications?type=expiring_soon');

// Mark as read
await axios.put(`/api/director/contract-notifications/${id}/read`);

// Mark all as read
await axios.post('/api/director/contract-notifications/mark-all-read');
```

### 3. **Contract Employees List**
```typescript
// Get detail karyawan dengan kontrak yang akan/sudah habis
const response = await axios.get('/api/director/contract-employees?type=expiring');
```

---

## ⚙️ Konfigurasi & Kustomisasi

### **Ubah Threshold (Hari Peringatan)**
Default: 30 hari sebelum kontrak habis

Edit di `app/Services/ContractNotificationService.php` atau via trigger endpoint:
```
POST /api/admin/contract/trigger-check
{
  "days_threshold": 15
}
```

### **Ubah Waktu Daily Check**
Edit di `app/Console/Kernel.php`:
```php
$schedule->command('contract:check-expirations --days=30')
         ->dailyAt('08:00')  // Ubah jam di sini
         ->timezone('Asia/Jakarta');
```

---

## 🧪 Testing

### **Manual Test Command**
```bash
php artisan contract:check-expirations --days=30
```

### **Test Push Notification**
```
POST /api/push-subscriptions/test
```

---

## 📊 Database Schema Reference

### `users` table (fields baru)
```sql
ALTER TABLE users ADD COLUMN contract_end_date DATE NULL AFTER join_date;
ALTER TABLE users ADD COLUMN contract_status ENUM('permanent', 'contract') DEFAULT 'permanent' AFTER contract_end_date;
ALTER TABLE users ADD COLUMN days_until_contract_end INT NULL AFTER contract_status;
```

### `contract_notifications` table
```sql
CREATE TABLE contract_notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    director_id BIGINT NOT NULL,
    notification_type ENUM('expiring_soon', 'expired'),
    days_remaining INT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    notified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (director_id) REFERENCES users(id),
    UNIQUE KEY unique_notification (user_id, notification_type, days_remaining)
);
```

---

## 🔐 Middleware & Authorization

- **Director only**: Membaca notifikasi sendiri
- **Admin only**: Trigger manual check
- **Sanctum authenticated**: Semua endpoint memerlukan token

---

## 📝 Troubleshooting

### Notifikasi tidak terkirim
1. Cek VAPID keys di `.env`
2. Cek apakah direktur sudah subscribe push notifications
3. Lihat logs: `storage/logs/laravel.log`

### Duplikasi notifikasi
- Sistem otomatis cegah duplikasi dengan `UNIQUE` key di database

### Command tidak jalan
- Cek cron job berjalan: `crontab -l`
- Test manual: `php artisan contract:check-expirations`

---

## 📚 File Reference

```
backend/
├── app/
│   ├── Models/
│   │   ├── User.php (updated)
│   │   └── ContractNotification.php (new)
│   ├── Services/
│   │   └── ContractNotificationService.php (new)
│   ├── Http/Controllers/
│   │   └── ContractNotificationController.php (new)
│   └── Console/Commands/
│       └── CheckContractExpirations.php (new)
├── database/migrations/
│   ├── 2026_11_12_000001_add_contract_fields_to_users_table.php (new)
│   └── 2026_11_12_000002_create_contract_notifications_table.php (new)
└── routes/
    └── api.php (updated)
```

---

## ✅ Checklist Implementasi

- [x] Migration untuk fields kontrak
- [x] Migration untuk notifications table
- [x] User Model scopes dan methods
- [x] ContractNotification Model
- [x] ContractNotificationService
- [x] ContractNotificationController
- [x] Console Command
- [x] API Routes
- [ ] Frontend Components
- [ ] Setup Kernel.php scheduling
- [ ] Configure VAPID keys
- [ ] Test semua endpoints

---

**Last Updated**: 2026-11-12
**Version**: 1.0
