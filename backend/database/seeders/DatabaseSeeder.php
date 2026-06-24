<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\SalaryConfiguration;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
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

        // Panggil PrivateDataSeeder secara dinamis jika file ada di lokal
        if (class_exists(\Database\Seeders\PrivateDataSeeder::class)) {
            $this->call(\Database\Seeders\PrivateDataSeeder::class);
        } else {
            // Seed fallback default users jika PrivateDataSeeder tidak ada
            $defaultUsers = [
                [
                    'name' => 'Admin HR',
                    'email' => 'admin@example.com',
                    'password' => Hash::make('password'),
                    'role' => 'admin',
                    'company' => 'PT Cakrawala Parama Internasional',
                    'whatsapp' => '081234567890',
                    'status' => 'active',
                ],
                [
                    'name' => 'Direktur Utama',
                    'email' => 'director@example.com',
                    'password' => Hash::make('password'),
                    'role' => 'director',
                    'company' => 'PT Cakrawala Parama Internasional',
                    'whatsapp' => '089876543210',
                    'status' => 'active',
                ],
                [
                    'name' => 'Budi Santoso',
                    'email' => 'employee@example.com',
                    'password' => Hash::make('password'),
                    'role' => 'employee',
                    'company' => 'PT Cakrawala Parama Internasional',
                    'whatsapp' => '085678901234',
                    'employee_number' => 'EMP001',
                    'gender' => 'male',
                    'division' => 'IT',
                    'status' => 'active',
                ],
                [
                    'name' => 'Siti Aminah',
                    'email' => 'employee2@example.com',
                    'password' => Hash::make('password'),
                    'role' => 'employee',
                    'company' => 'PT Yasodana Parvez Internasional',
                    'whatsapp' => '087654321098',
                    'employee_number' => 'EMP002',
                    'gender' => 'female',
                    'division' => 'Finance',
                    'status' => 'active',
                ],
                [
                    'name' => 'Andi Wijaya',
                    'email' => 'employee_pending@example.com',
                    'password' => Hash::make('password'),
                    'role' => 'employee',
                    'company' => 'PT Cakrawala Parama Internasional',
                    'whatsapp' => '082345678901',
                    'employee_number' => 'EMP003',
                    'gender' => 'male',
                    'division' => 'Sales',
                    'status' => 'pending',
                ],
            ];

            foreach ($defaultUsers as $u) {
                $user = User::updateOrCreate(
                    ['email' => $u['email']],
                    $u
                );

                // Seed salary configuration untuk karyawan
                if ($user->role === 'employee') {
                    $salaryData = [
                        'basic_salary' => $user->email === 'employee@example.com' ? 8000000 : ($user->email === 'employee2@example.com' ? 7500000 : 6000000),
                        'allowance_meal_daily' => 25000,
                        'allowance_transport_daily' => 20000,
                        'allowance_fixed' => $user->email === 'employee@example.com' ? 500000 : ($user->email === 'employee2@example.com' ? 400000 : 300000),
                        'allowance_position' => $user->email === 'employee@example.com' ? 1000000 : ($user->email === 'employee2@example.com' ? 800000 : 0),
                        'deduction_late_daily' => 50000,
                        'deduction_absence_daily' => 100000,
                        'deduction_fixed' => 0,
                        'salary_change_status' => 'none',
                    ];

                    SalaryConfiguration::updateOrCreate(
                        ['user_id' => $user->id],
                        $salaryData
                    );
                }
            }
        }
    }
}
