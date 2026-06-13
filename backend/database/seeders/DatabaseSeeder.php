<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@absen.com'],
            [
                'name' => 'Administrator',
                'password' => bcrypt('password'),
                'password_plain' => 'password',
                'role' => 'admin',
                'status' => 'active',
            ]
        );

        $karyawan = User::updateOrCreate(
            ['email' => 'karyawan@absen.com'],
            [
                'name' => 'Syaiful Karyawan',
                'password' => bcrypt('password'),
                'password_plain' => 'password',
                'role' => 'employee',
                'status' => 'active',
            ]
        );

        User::updateOrCreate(
            ['email' => 'direktur@absen.com'],
            [
                'name' => 'Direktur Utama',
                'password' => bcrypt('password'),
                'password_plain' => 'password',
                'role' => 'director',
                'status' => 'active',
            ]
        );

        // Pending Registration employee
        User::updateOrCreate(
            ['email' => 'karyawan_baru@absen.com'],
            [
                'name' => 'Budi Baru',
                'password' => bcrypt('password'),
                'password_plain' => 'password',
                'role' => 'employee',
                'status' => 'pending',
            ]
        );

        // Pending Delete employee
        User::updateOrCreate(
            ['email' => 'karyawan_lama@absen.com'],
            [
                'name' => 'Andi Lama',
                'password' => bcrypt('password'),
                'password_plain' => 'password',
                'role' => 'employee',
                'status' => 'pending_delete',
            ]
        );

        \App\Models\OfficeSetting::updateOrCreate(
            ['id' => 1],
            [
                'latitude' => '-6.1942189',
                'longitude' => '106.815998',
                'radius' => 100,
            ]
        );

        // Seed Hari Libur & Cuti Bersama 2026
        $holidays = [
            ['holiday_date' => '2026-01-01', 'name' => 'Tahun Baru 2026 Masehi'],
            ['holiday_date' => '2026-01-16', 'name' => 'Isra Mikraj Nabi Muhammad S.A.W.'],
            ['holiday_date' => '2026-02-17', 'name' => 'Tahun Baru Imlek 2577 Kongzili'],
            ['holiday_date' => '2026-03-19', 'name' => 'Hari Suci Nyepi (Tahun Baru Saka 1948)'],
            ['holiday_date' => '2026-03-21', 'name' => 'Hari Raya Idul Fitri 1447 Hijriah'],
            ['holiday_date' => '2026-03-22', 'name' => 'Hari Raya Idul Fitri 1447 Hijriah'],
            ['holiday_date' => '2026-04-03', 'name' => 'Wafat Yesus Kristus'],
            ['holiday_date' => '2026-04-05', 'name' => 'Kebangkitan Yesus Kristus (Paskah)'],
            ['holiday_date' => '2026-05-01', 'name' => 'Hari Buruh Internasional'],
            ['holiday_date' => '2026-05-14', 'name' => 'Kenaikan Yesus Kristus'],
            ['holiday_date' => '2026-05-27', 'name' => 'Hari Raya Idul Adha 1447 Hijriah'],
            ['holiday_date' => '2026-05-31', 'name' => 'Hari Raya Waisak 2570 BE'],
            ['holiday_date' => '2026-06-01', 'name' => 'Hari Lahir Pancasila'],
            ['holiday_date' => '2026-06-16', 'name' => 'Tahun Baru Islam 1448 Hijriah'],
            ['holiday_date' => '2026-08-17', 'name' => 'Proklamasi Kemerdekaan RI'],
            ['holiday_date' => '2026-08-25', 'name' => 'Maulid Nabi Muhammad S.A.W.'],
            ['holiday_date' => '2026-12-25', 'name' => 'Kelahiran Yesus Kristus (Natal)'],

            // Cuti Bersama 2026
            ['holiday_date' => '2026-02-16', 'name' => 'Cuti Bersama Tahun Baru Imlek 2577 Kongzili'],
            ['holiday_date' => '2026-03-18', 'name' => 'Cuti Bersama Hari Suci Nyepi'],
            ['holiday_date' => '2026-03-20', 'name' => 'Cuti Bersama Hari Raya Idul Fitri 1447 Hijriah'],
            ['holiday_date' => '2026-03-23', 'name' => 'Cuti Bersama Hari Raya Idul Fitri 1447 Hijriah'],
            ['holiday_date' => '2026-03-24', 'name' => 'Cuti Bersama Hari Raya Idul Fitri 1447 Hijriah'],
            ['holiday_date' => '2026-05-15', 'name' => 'Cuti Bersama Kenaikan Yesus Kristus'],
            ['holiday_date' => '2026-05-28', 'name' => 'Cuti Bersama Hari Raya Idul Adha 1447 Hijriah'],
            ['holiday_date' => '2026-12-24', 'name' => 'Cuti Bersama Kelahiran Yesus Kristus'],
        ];
        foreach ($holidays as $h) {
            \App\Models\Holiday::updateOrCreate(
                ['holiday_date' => $h['holiday_date']],
                ['name' => $h['name']]
            );
        }

        // Salary Configuration with pending changes
        \App\Models\SalaryConfiguration::updateOrCreate(
            ['user_id' => $karyawan->id],
            [
                'basic_salary' => 4500000,
                'allowance_meal_daily' => 20000,
                'allowance_transport_daily' => 15000,
                'allowance_position' => 500000,
                'deduction_late_daily' => 25000,
                'deduction_absence_daily' => 100000,
                'deduction_fixed' => 150000,
                'pending_basic_salary' => 5000000,
                'pending_allowance_meal_daily' => 25000,
                'pending_allowance_transport_daily' => 20000,
                'pending_allowance_position' => 750000,
                'pending_deduction_late_daily' => 30000,
                'pending_deduction_absence_daily' => 120000,
                'pending_deduction_fixed' => 180000,
                'salary_change_status' => 'pending',
            ]
        );

        // Pending Leave Request (Waiting for Director)
        \App\Models\LeaveRequest::updateOrCreate(
            [
                'user_id' => $karyawan->id,
                'category' => 'TAHUNAN',
                'start_date' => now()->addDays(5)->toDateString(),
                'end_date' => now()->addDays(7)->toDateString(),
            ],
            [
                'reason' => 'Ada acara keluarga di luar kota',
                'status' => 'pending_director',
                'admin_notes' => 'Diverifikasi oleh Admin.',
            ]
        );

        // Pending Overtime Request (Waiting for Director)
        \App\Models\Overtime::updateOrCreate(
            [
                'user_id' => $karyawan->id,
                'date' => now()->subDays(1)->toDateString(),
            ],
            [
                'start_time' => '18:00:00',
                'end_time' => '21:00:00',
                'duration' => 3.0,
                'reason' => 'Menyelesaikan laporan bulanan departemen IT',
                'status' => 'pending_director',
                'admin_notes' => 'Diverifikasi oleh Admin.',
            ]
        );

        // Pending Reimbursement Request (Waiting for Director)
        \App\Models\Reimbursement::updateOrCreate(
            [
                'user_id' => $karyawan->id,
                'title' => 'Beli tinta printer & kertas A4',
            ],
            [
                'category' => 'Operasional Kantor',
                'amount' => 245000,
                'expense_date' => now()->subDays(2)->toDateString(),
                'description' => 'Membeli tinta Epson hitam dan kertas HVS Sinar Dunia 1 rim',
                'receipt_path' => '',
                'status' => 'pending_director',
                'admin_notes' => 'Diverifikasi oleh Admin.',
            ]
        );

        // Pending Bonus Request (Waiting for Director)
        \App\Models\Bonus::updateOrCreate(
            [
                'user_id' => $karyawan->id,
                'bonus_date' => now()->toDateString(),
            ],
            [
                'bonus_amount' => 1500000,
                'description' => 'Bonus pencapaian target penjualan proyek Q2',
                'status' => 'pending',
            ]
        );

        // Absensi mandiri disetujui (1 - 30 Juni 2026, Senin - Sabtu, tanggal 1 & 16 libur)
        $startDate = \Carbon\Carbon::create(2026, 6, 1);
        $endDate = \Carbon\Carbon::create(2026, 6, 30);

        for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
            // Lewati hari Minggu
            if ($date->isSunday()) {
                continue;
            }

            // Lewati tanggal 1 Juni dan 16 Juni (libur)
            if ($date->day === 1 || $date->day === 16) {
                continue;
            }

            $isSaturday = $date->isSaturday();
            
            // Variasi masuk terlambat (20% kemungkinan)
            $isLate = rand(1, 10) > 8;
            $clockInTime = $isLate ? '09:' . rand(10, 25) . ':00' : '08:' . rand(10, 29) . ':00';
            
            // Jam pulang Sabtu biasanya setengah hari
            if ($isSaturday) {
                $clockOutTime = '15:0' . rand(0, 9) . ':00'; // Pulang jam 3 sore
                $statusOut = 'early_departure';
            } else {
                $isOvertime = rand(1, 10) > 8; // 20% lembur di hari biasa
                $clockOutTime = $isOvertime ? '18:' . rand(15, 45) . ':00' : '17:0' . rand(0, 9) . ':00';
                $statusOut = $isOvertime ? 'overtime' : 'normal';
            }

            \App\Models\Attendance::updateOrCreate(
                [
                    'user_id' => $karyawan->id,
                    'date' => $date->toDateString(),
                ],
                [
                    'attendance_type' => 'kantor',
                    'clock_in' => $clockInTime,
                    'status_in' => $isLate ? 'late' : 'normal',
                    'notes_in' => $isLate ? 'Terlambat karena macet' : 'Absen masuk kantor reguler',
                    'latitude_in' => '-6.1942189',
                    'longitude_in' => '106.815998',
                    'clock_out' => $clockOutTime,
                    'status_out' => $statusOut,
                    'notes_out' => $isSaturday ? 'Pulang kerja Sabtu setengah hari' : ($statusOut === 'overtime' ? 'Lembur menyelesaikan tugas' : 'Pulang reguler'),
                    'latitude_out' => '-6.1942189',
                    'longitude_out' => '106.815998',
                    'approval_status' => 'approved',
                ]
            );
        }

        // Koreksi absensi pending (menunggu Direktur, tidak masuk payroll)
        \App\Models\Attendance::updateOrCreate(
            [
                'user_id' => $karyawan->id,
                'date' => now()->subDays(1)->toDateString(),
            ],
            [
                'attendance_type' => 'kantor',
                'clock_in' => '08:15:00',
                'clock_out' => '17:05:00',
                'notes_in' => 'Lupa absen masuk karena terburu-buru rapat',
                'notes_out' => 'Absen keluar manual',
                'approval_status' => 'pending',
            ]
        );

        // Payroll contoh bulan berjalan (draft, akan sinkron saat admin generate ulang)
        $approvedDays = \App\Models\Attendance::where('user_id', $karyawan->id)
            ->whereBetween('date', [now()->startOfMonth()->toDateString(), now()->endOfMonth()->toDateString()])
            ->where(function ($q) {
                $q->where('approval_status', 'approved')->orWhereNull('approval_status');
            })
            ->whereNotNull('clock_in')
            ->count();

        \App\Models\Payroll::updateOrCreate(
            [
                'user_id' => $karyawan->id,
                'period_month' => now()->format('Y-m'),
            ],
            [
                'days_present' => $approvedDays,
                'days_late' => 0,
                'days_leave' => 0,
                'basic_salary' => 4500000,
                'allowance_meal' => $approvedDays * 20000,
                'allowance_transport' => $approvedDays * 15000,
                'allowance_position' => 500000,
                'allowance_fixed' => 0,
                'deduction_late' => 0,
                'deduction_absence' => 0,
                'deduction_fixed' => 150000,
                'net_salary' => 4500000 + ($approvedDays * 35000) + 500000 - 150000,
                'status' => 'pending_approval',
                'notes' => 'Kalkulasi otomatis. Rentang periode: ' . now()->startOfMonth()->toDateString() . ' s.d ' . now()->endOfMonth()->toDateString() . '.',
            ]
        );
    }
}
