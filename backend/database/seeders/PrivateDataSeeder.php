<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PrivateDataSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@absen.com'],
            [
                'name' => 'Administrator',
                'password' => bcrypt('password'),
                'role' => 'admin',
                'status' => 'active',
            ]
        );

        User::updateOrCreate(
            ['email' => 'melani.dian@cakrawala-internasional.co.id'],
            [
                'name' => 'Melani Dian',
                'password' => bcrypt('password'),
                'role' => 'director',
                'status' => 'active',
                'company' => 'PT Cakrawala Parama Internasional',
                'whatsapp' => '628123456789',
            ]
        );

        User::updateOrCreate(
            ['email' => 'andrisyahputra@yasodana-parvez.co.id'],
            [
                'name' => 'Andri Syahputra',
                'password' => bcrypt('password'),
                'role' => 'director',
                'status' => 'active',
                'company' => 'PT Yasodana Parvez Internasional',
                'whatsapp' => '628987654321',
            ]
        );

        // Seed 3 Dummy Employees for June 2026
        $employeesToSeed = [
            [
                'email' => 'sky@gmail.com',
                'name' => 'Sky',
                'join_date' => '2026-06-01',
                'employee_number' => 'EMP-001',
                'late_days_count' => 0
            ],
            [
                'email' => 'skyfox@gmail.com',
                'name' => 'Skyfox',
                'join_date' => '2026-06-01',
                'employee_number' => 'EMP-002',
                'late_days_count' => 5
            ],
            [
                'email' => 'skyfoxmarket@gmail.com',
                'name' => 'Skyfox Market',
                'join_date' => '2026-06-17',
                'employee_number' => 'EMP-003',
                'late_days_count' => 0
            ],
        ];

        $holidays202606 = ['2026-06-01', '2026-06-16'];

        foreach ($employeesToSeed as $emp) {
            $user = User::updateOrCreate(
                ['email' => $emp['email']],
                [
                    'name' => $emp['name'],
                    'password' => bcrypt('password'),
                    'role' => 'employee',
                    'status' => 'active',
                    'company' => 'PT Cakrawala Parama Internasional',
                    'join_date' => $emp['join_date'],
                    'employee_number' => $emp['employee_number'],
                    'division' => 'Operational',
                ]
            );

            // Seed salary configuration
            \App\Models\SalaryConfiguration::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'basic_salary' => 3000000,
                    'allowance_meal_daily' => 25000,
                    'allowance_transport_daily' => 20000,
                    'allowance_position' => 0,
                    'allowance_fixed' => 0,
                    'deduction_late_daily' => 30000,
                    'deduction_absence_daily' => 3000000 / 26,
                    'deduction_fixed' => 0,
                    'salary_change_status' => 'approved',
                ]
            );

            // Clean existing attendances and payrolls for a clean state
            $user->attendances()->delete();
            $user->payrolls()->delete();

            // Generate attendance for June 2026
            $startOfMonth = \Carbon\Carbon::parse('2026-06-01');
            $endOfMonth = \Carbon\Carbon::parse('2026-06-30');
            $currentDate = $startOfMonth->copy();
            
            $lateCount = 0;

            while ($currentDate->lte($endOfMonth)) {
                $dateStr = $currentDate->toDateString();
                
                // Skip if before join date
                if ($currentDate->lt(\Carbon\Carbon::parse($emp['join_date']))) {
                    $currentDate->addDay();
                    continue;
                }

                // Skip Sundays
                if ($currentDate->isSunday()) {
                    $currentDate->addDay();
                    continue;
                }

                // Skip national holidays
                if (in_array($dateStr, $holidays202606)) {
                    $currentDate->addDay();
                    continue;
                }

                // Determine if late
                $isLate = false;
                if ($emp['late_days_count'] > 0 && $lateCount < $emp['late_days_count']) {
                    $isLate = true;
                    $lateCount++;
                }

                \App\Models\Attendance::create([
                    'user_id' => $user->id,
                    'date' => $dateStr,
                    'attendance_type' => 'kantor',
                    'clock_in' => $isLate ? '09:15:00' : '08:00:00',
                    'clock_out' => '17:00:00',
                    'status_in' => $isLate ? 'late' : 'normal',
                    'status_out' => 'normal',
                    'approval_status' => 'approved',
                    'latitude_in' => '-6.1942189',
                    'longitude_in' => '106.815998',
                    'latitude_out' => '-6.1942189',
                    'longitude_out' => '106.815998',
                ]);

                $currentDate->addDay();
            }

            // Calculate and seed payroll for June 2026
            $period = '2026-06';
            $startOfMonthPeriod = \Carbon\Carbon::parse($period . '-01')->startOfMonth();
            $endOfMonthPeriod = \Carbon\Carbon::parse($period . '-01')->endOfMonth();

            // Get holidays count in active period
            $holidaysList = \App\Models\Holiday::whereBetween('holiday_date', [$startOfMonthPeriod->toDateString(), $endOfMonthPeriod->toDateString()])
                ->get()
                ->filter(function($h) {
                    return !\Carbon\Carbon::parse($h->holiday_date)->isSunday();
                });
            $holidaysCount = $holidaysList->count();

            // Tentukan tanggal mulai perhitungan gaji berdasarkan join_date
            $joinDate = $user->join_date;
            $startOfPeriod = $startOfMonthPeriod->copy();
            if ($joinDate) {
                $joinCarbon = \Carbon\Carbon::parse($joinDate);
                if ($joinCarbon->greaterThan($startOfMonthPeriod)) {
                    $startOfPeriod = $joinCarbon;
                }
            }

            // Hitung hari kerja aktif (Senin–Sabtu) karyawan di masa aktifnya dalam bulan ini
            $activeWorkingDays = 0;
            $tempDate = $startOfPeriod->copy();
            while ($tempDate->lte($endOfMonthPeriod)) {
                if (!$tempDate->isSunday()) {
                    $activeWorkingDays++;
                }
                $tempDate->addDay();
            }

            // Hitung total hari libur nasional (Senin-Sabtu) yang jatuh di masa aktif karyawan
            $holidaysInActivePeriod = $holidaysList->filter(function($h) use ($startOfPeriod, $endOfMonthPeriod) {
                $hDate = \Carbon\Carbon::parse($h->holiday_date);
                return $hDate->between($startOfPeriod, $endOfMonthPeriod);
            })->count();

            // Hitung total kehadiran (clock_in tidak null)
            $daysPresent = $user->attendances()
                ->whereBetween('date', [$startOfPeriod->toDateString(), $endOfMonthPeriod->toDateString()])
                ->whereNotNull('clock_in')
                ->count();

            // Hitung total keterlambatan (status_in = 'late')
            $daysLate = $user->attendances()
                ->whereBetween('date', [$startOfPeriod->toDateString(), $endOfMonthPeriod->toDateString()])
                ->where('status_in', 'late')
                ->count();

            $daysLeave = 0;

            // Get configurations
            $config = $user->salaryConfiguration;
            $baseBasicSalary = $config->basic_salary;
            $allowanceMealDaily = $config->allowance_meal_daily;
            $allowanceTransportDaily = $config->allowance_transport_daily;
            $deductDailyLate = $config->deduction_late_daily;
            $deductFixed = $config->deduction_fixed;

            $dailyRate = $baseBasicSalary / 26;

            // Gaji Pokok prorata
            $isProrated = $startOfPeriod->greaterThan($startOfMonthPeriod);
            if ($isProrated) {
                $baseBasicSalaryForPeriod = min($baseBasicSalary, $activeWorkingDays * $dailyRate);
            } else {
                $baseBasicSalaryForPeriod = $baseBasicSalary;
            }

            $deductAbsenceDaily = $dailyRate;

            $allowanceMeal = $daysPresent * $allowanceMealDaily;
            $allowanceTransport = $daysPresent * $allowanceTransportDaily;
            $allowancePosition = $config->allowance_position;
            $allowanceFixed = $config->allowance_fixed;
            $allowanceOvertime = 0;
            $allowanceBonus = 0;

            $deductionLate = $daysLate * $deductDailyLate;

            $daysAbsent = max(0, $activeWorkingDays - $daysPresent - $daysLeave - $holidaysInActivePeriod);
            $deductionAbsence = $daysAbsent * $deductAbsenceDaily;

            $totalAllowance = $baseBasicSalaryForPeriod + $allowanceMeal + $allowanceTransport + $allowancePosition + $allowanceFixed + $allowanceOvertime + $allowanceBonus;
            $totalDeduction = $deductionLate + $deductFixed + $deductionAbsence;
            $netSalary = $totalAllowance - $totalDeduction;
            if ($netSalary < 0) {
                $netSalary = 0;
            }

            // Hitung total hari kerja efektif (Senin - Sabtu) di rentang cut-off tersebut untuk catatan
            $workingDaysInMonth = 0;
            $tempDate = $startOfMonthPeriod->copy();
            while ($tempDate->lte($endOfMonthPeriod)) {
                if (!$tempDate->isSunday()) {
                    $workingDaysInMonth++;
                }
                $tempDate->addDay();
            }

            // Susun catatan payroll yang mendetail dan transparan
            if ($isProrated) {
                $notes = "Periode aktif (bergabung " . \Carbon\Carbon::parse($joinDate)->format('d-m-Y') . "): " . $startOfPeriod->format('d-m-Y') . " s.d " . $endOfMonthPeriod->format('d-m-Y') . ". Hari kerja aktif: $activeWorkingDays (Sen–Sab). Gaji Pokok Prorata: Rp" . number_format($baseBasicSalaryForPeriod, 0, ',', '.') . " ($activeWorkingDays/26 hari). Hadir: $daysPresent | Telat: $daysLate | Cuti: $daysLeave | Mangkir: $daysAbsent | Libur nasional aktif: $holidaysInActivePeriod. Lembur: 0 jam (Rp0) | Bonus: Rp0.";
            } else {
                $notes = "Periode: " . $startOfMonthPeriod->format('d-m-Y') . " s.d " . $endOfMonthPeriod->format('d-m-Y') . ". Hari kerja: $workingDaysInMonth (Sen–Sab). Hadir: $daysPresent | Telat: $daysLate | Cuti: $daysLeave | Mangkir: $daysAbsent | Libur nasional: $holidaysCount. Lembur: 0 jam (Rp0) | Bonus: Rp0.";
            }

            \App\Models\Payroll::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'period_month' => $period
                ],
                [
                    'days_present' => $daysPresent,
                    'days_late' => $daysLate,
                    'days_leave' => $daysLeave,
                    'basic_salary' => $baseBasicSalaryForPeriod,
                    'allowance_meal' => $allowanceMeal,
                    'allowance_transport' => $allowanceTransport,
                    'allowance_fixed' => $allowanceFixed,
                    'allowance_position' => $allowancePosition,
                    'allowance_overtime' => $allowanceOvertime,
                    'allowance_bonus' => $allowanceBonus,
                    'deduction_late' => $deductionLate,
                    'deduction_fixed' => $deductFixed,
                    'deduction_absence' => $deductionAbsence,
                    'net_salary' => $netSalary,
                    'status' => 'draft',
                    'notes' => $notes,
                ]
            );
        }
    }
}
