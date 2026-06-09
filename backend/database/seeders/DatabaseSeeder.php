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

        // Pending Attendance Correction (Waiting for Director)
        \App\Models\Attendance::updateOrCreate(
            [
                'user_id' => $karyawan->id,
                'date' => now()->subDays(3)->toDateString(),
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

        // Pending Payroll (Waiting for Director)
        \App\Models\Payroll::updateOrCreate(
            [
                'user_id' => $karyawan->id,
                'period_month' => now()->format('Y-m'),
            ],
            [
                'days_present' => 20,
                'days_late' => 2,
                'days_leave' => 1,
                'basic_salary' => 4500000,
                'allowance_meal' => 400000,
                'allowance_transport' => 300000,
                'allowance_position' => 500000,
                'allowance_fixed' => 0,
                'deduction_late' => 50000,
                'deduction_absence' => 0,
                'deduction_fixed' => 150000,
                'net_salary' => 5500000,
                'status' => 'pending_approval',
            ]
        );
    }
}
