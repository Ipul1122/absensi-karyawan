<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Attendance;
use App\Models\LeaveRequest;
use App\Models\Payroll;
use App\Models\SalaryConfiguration;
use App\Models\Holiday;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class PayrollController extends Controller
{
    /**
     * Rentang periode payroll: tanggal 1 s.d akhir bulan kalender (sesuai label YYYY-MM).
     */
    private function getPayrollPeriodRange(string $period): array
    {
        $start = Carbon::parse($period . '-01')->startOfMonth();
        $end = Carbon::parse($period . '-01')->endOfMonth();

        return [$start, $end];
    }

    /**
     * Absensi yang dihitung untuk payroll (disetujui atau absen mandiri normal).
     */
    private function approvedAttendanceQuery($query)
    {
        return $query->where(function ($q) {
            $q->where('approval_status', 'approved')
              ->orWhereNull('approval_status');
        });
    }

    /**
     * Tampilkan konfigurasi gaji untuk semua karyawan.
     */
    public function indexConfigurations(Request $request)
    {
        $employees = User::where('role', 'employee')
            ->with('salaryConfiguration')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $employees
        ]);
    }

    /**
     * Buat atau perbarui setelan gaji karyawan.
     */
    public function updateConfiguration(Request $request)
    {
        $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'basic_salary' => 'required|numeric|min:0',
            'allowance_meal_daily' => 'required|numeric|min:0',
            'allowance_transport_daily' => 'required|numeric|min:0',
            'allowance_position' => 'required|numeric|min:0',
            'deduction_late_daily' => 'required|numeric|min:0',
            'deduction_absence_daily' => 'required|numeric|min:0',
            'deduction_fixed' => 'required|numeric|min:0',
        ]);

        $user = $request->user();

        if ($user && $user->role === 'director') {
            $config = SalaryConfiguration::updateOrCreate(
                ['user_id' => $request->user_id],
                [
                    'basic_salary' => $request->basic_salary,
                    'allowance_meal_daily' => $request->allowance_meal_daily,
                    'allowance_transport_daily' => $request->allowance_transport_daily,
                    'allowance_position' => $request->allowance_position,
                    'deduction_late_daily' => $request->deduction_late_daily,
                    'deduction_absence_daily' => $request->deduction_absence_daily,
                    'deduction_fixed' => $request->deduction_fixed,
                    'salary_change_status' => 'approved',
                ]
            );
            $msg = 'Pengaturan gaji karyawan berhasil disimpan dan langsung disetujui.';
        } else {
            $config = SalaryConfiguration::updateOrCreate(
                ['user_id' => $request->user_id],
                [
                    'pending_basic_salary' => $request->basic_salary,
                    'pending_allowance_meal_daily' => $request->allowance_meal_daily,
                    'pending_allowance_transport_daily' => $request->allowance_transport_daily,
                    'pending_allowance_position' => $request->allowance_position,
                    'pending_deduction_late_daily' => $request->deduction_late_daily,
                    'pending_deduction_absence_daily' => $request->deduction_absence_daily,
                    'pending_deduction_fixed' => $request->deduction_fixed,
                    'salary_change_status' => 'pending',
                ]
            );
            $msg = 'Perubahan gaji diajukan dan menunggu persetujuan Direktur.';
        }

        return response()->json([
            'status' => 'success',
            'message' => $msg,
            'data' => $config
        ]);
    }

    /**
     * Tampilkan rekap transaksi payroll bulanan.
     */
    public function indexPayrolls(Request $request)
    {
        $request->validate([
            'period_month' => 'required|string', // Format: YYYY-MM
        ]);

        $period = $request->period_month;

        $payrolls = Payroll::where('period_month', $period)
            ->with(['user:id,name,email', 'user.salaryConfiguration'])
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $payrolls
        ]);
    }

    /**
     * Generate payroll bulanan otomatis berdasarkan absensi & cuti.
     */
    public function generatePayroll(Request $request)
    {
        $request->validate([
            'period_month' => 'required|string', // Format: YYYY-MM
        ]);

        $period = $request->period_month;

        [$startOfMonth, $endOfMonth] = $this->getPayrollPeriodRange($period);

        // Ambil jumlah hari libur nasional (Senin-Sabtu) pada periode ini
        $holidays = Holiday::whereBetween('holiday_date', [$startOfMonth->toDateString(), $endOfMonth->toDateString()])
            ->get()
            ->filter(function($h) {
                return !Carbon::parse($h->holiday_date)->isSunday();
            });
        $holidaysCount = $holidays->count();

        $employees = User::where('role', 'employee')
            ->with([
                'salaryConfiguration',
                'attendances' => function ($query) use ($startOfMonth, $endOfMonth) {
                    $this->approvedAttendanceQuery($query)
                        ->whereBetween('date', [$startOfMonth->toDateString(), $endOfMonth->toDateString()]);
                },
                'leaveRequests' => function ($query) use ($startOfMonth, $endOfMonth) {
                    $query->where('status', 'approved')
                          ->where(function ($q) use ($startOfMonth, $endOfMonth) {
                              $q->whereBetween('start_date', [$startOfMonth->toDateString(), $endOfMonth->toDateString()])
                                ->orWhereBetween('end_date', [$startOfMonth->toDateString(), $endOfMonth->toDateString()])
                                ->orWhere(function ($sub) use ($startOfMonth, $endOfMonth) {
                                    $sub->where('start_date', '<=', $startOfMonth->toDateString())
                                        ->where('end_date', '>=', $endOfMonth->toDateString());
                                });
                          });
                }
            ])
            ->get();

        if ($employees->isEmpty()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak ada data karyawan (employee) untuk di-generate.'
            ], 404);
        }

        $generatedCount = 0;

        try {
            DB::beginTransaction();

            foreach ($employees as $employee) {
                // 1. Hitung total kehadiran (clock_in tidak null) di rentang cut-off yang disetujui
                $daysPresent = $employee->attendances
                    ->filter(function ($att) {
                        return !is_null($att->clock_in);
                    })
                    ->count();

                // 2. Hitung total keterlambatan (status_in = 'late') yang disetujui
                $daysLate = $employee->attendances
                    ->where('status_in', 'late')
                    ->count();

                // 3. Hitung total hari cuti yang disetujui
                $leaves = $employee->leaveRequests;

                $daysLeave = 0;
                foreach ($leaves as $leave) {
                    $leaveStart = Carbon::parse($leave->start_date);
                    $leaveEnd = Carbon::parse($leave->end_date);
                    
                    // Batasi start & end date pada rentang cut-off terpilih
                    $overlapStart = $leaveStart->max($startOfMonth);
                    $overlapEnd = $leaveEnd->min($endOfMonth);
                    
                    if ($overlapStart <= $overlapEnd) {
                        // Hitung hanya hari kerja (Senin–Sabtu), skip hari Minggu
                        // agar konsisten dengan kalkulasi workingDaysInMonth
                        $tempLeaveDate = $overlapStart->copy();
                        while ($tempLeaveDate->lte($overlapEnd)) {
                            if (!$tempLeaveDate->isSunday()) {
                                $daysLeave++;
                            }
                            $tempLeaveDate->addDay();
                        }
                    }
                }

                // 4. Ambil konfigurasi gaji karyawan
                $config = $employee->salaryConfiguration;
                
                // Jika setelan gaji belum diatur, gunakan nilai default
                $baseBasicSalary = $config ? $config->basic_salary : 4500000;
                $allowanceMealDaily = $config ? $config->allowance_meal_daily : 20000;
                $allowanceTransportDaily = $config ? $config->allowance_transport_daily : 15000;
                $deductDailyLate = $config ? $config->deduction_late_daily : 25000;
                $deductFixed = $config ? $config->deduction_fixed : 0;

                // Hitung total hari kerja efektif (Senin - Sabtu) di rentang cut-off tersebut
                $workingDaysInMonth = 0;
                $tempDate = $startOfMonth->copy();
                while ($tempDate->lte($endOfMonth)) {
                    if (!$tempDate->isSunday()) {
                        $workingDaysInMonth++;
                    }
                    $tempDate->addDay();
                }

                // Potongan absen per hari dihitung secara proporsional dari Gaji Pokok dibagi hari kerja efektif
                $deductAbsenceDaily = ($workingDaysInMonth > 0) ? ($baseBasicSalary / $workingDaysInMonth) : 0;

                // 5. Hitung tunjangan & potongan (rumus sederhana, tiap komponen terpisah)
                $allowanceMeal = $daysPresent * $allowanceMealDaily;
                $allowanceTransport = $daysPresent * $allowanceTransportDaily;
                $allowancePosition = $config ? $config->allowance_position : 0;
                $allowanceFixed = $config ? $config->allowance_fixed : 0;
                $deductionLate = $daysLate * $deductDailyLate;

                // Mangkir = hari kerja (Sen–Sab) − hadir − cuti disetujui − libur nasional (Sen–Sab)
                $daysAbsent = max(0, $workingDaysInMonth - $daysPresent - $daysLeave - $holidaysCount);
                $deductionAbsence = $daysAbsent * $deductAbsenceDaily;

                // Gaji bersih = semua penerimaan − semua potongan
                $totalAllowance = $baseBasicSalary + $allowanceMeal + $allowanceTransport + $allowancePosition + $allowanceFixed;
                $totalDeduction = $deductionLate + $deductFixed + $deductionAbsence;
                $netSalary = $totalAllowance - $totalDeduction;
                if ($netSalary < 0) {
                    $netSalary = 0; // Gaji tidak boleh negatif
                }

                // 6. Buat atau perbarui transaksi payroll
                $existing = Payroll::where('user_id', $employee->id)
                    ->where('period_month', $period)
                    ->first();

                // Jangan timpa payroll yang sudah lunas atau sedang menunggu persetujuan direktur
                if ($existing && in_array($existing->status, ['paid', 'pending_approval'], true)) {
                    continue;
                }

                $payrollData = [
                    'days_present' => $daysPresent,
                    'days_late' => $daysLate,
                    'days_leave' => $daysLeave,
                    'basic_salary' => $baseBasicSalary,
                    'allowance_meal' => $allowanceMeal,
                    'allowance_transport' => $allowanceTransport,
                    'allowance_fixed' => $allowanceFixed,
                    'allowance_position' => $allowancePosition,
                    'deduction_late' => $deductionLate,
                    'deduction_fixed' => $deductFixed,
                    'deduction_absence' => $deductionAbsence,
                    'net_salary' => $netSalary,
                    'status' => 'draft',
                    'notes' => "Periode: " . $startOfMonth->toDateString() . " s.d " . $endOfMonth->toDateString() . ". Hari kerja: $workingDaysInMonth (Sen–Sab). Hadir: $daysPresent | Telat: $daysLate | Cuti: $daysLeave | Mangkir: $daysAbsent | Libur nasional: $holidaysCount.",
                ];

                Payroll::updateOrCreate(
                    [
                        'user_id' => $employee->id,
                        'period_month' => $period
                    ],
                    $payrollData
                );

                $generatedCount++;
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => "Berhasil memproses gaji untuk $generatedCount karyawan pada periode $period.",
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal men-generate payroll: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Tandai payroll telah dibayar (Paid).
     */
    public function updatePayrollStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string|in:draft,unpaid,paid',
        ]);

        $payroll = Payroll::findOrFail($id);

        if ($request->status === 'paid' && $payroll->status !== 'unpaid') {
            return response()->json([
                'status' => 'error',
                'message' => 'Hanya payroll berstatus Belum Dibayar (unpaid) yang dapat ditandai lunas.'
            ], 422);
        }

        $payroll->status = $request->status;
        
        if ($request->status === 'paid') {
            $payroll->paid_at = Carbon::now();
        } else {
            $payroll->paid_at = null;
        }

        $payroll->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Status pembayaran gaji berhasil diperbarui.',
            'data' => $payroll
        ]);
    }

    /**
     * Penyesuaian gaji secara manual oleh Admin sebelum dibayar.
     */
    public function updatePayrollManual(Request $request, $id)
    {
        $request->validate([
            'basic_salary' => 'required|numeric|min:0',
            'allowance_meal' => 'nullable|numeric|min:0',
            'allowance_transport' => 'nullable|numeric|min:0',
            'allowance_position' => 'nullable|numeric|min:0',
            'allowance_fixed' => 'nullable|numeric|min:0',
            'deduction_late' => 'required|numeric|min:0',
            'deduction_fixed' => 'required|numeric|min:0',
            'deduction_absence' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $payroll = Payroll::findOrFail($id);

        if ($payroll->status === 'paid') {
            return response()->json([
                'status' => 'error',
                'message' => 'Gaji yang sudah dibayar tidak dapat disesuaikan lagi.'
            ], 422);
        }

        $basic = $request->basic_salary;
        $meal = $request->input('allowance_meal', 0);
        $transport = $request->input('allowance_transport', 0);
        $position = $request->input('allowance_position', 0);
        $fixedAllow = $request->input('allowance_fixed', 0);
        $lateDeduct = $request->deduction_late;
        $fixedDeduct = $request->deduction_fixed;
        $absenceDeduct = $request->input('deduction_absence', 0);

        $net = ($basic + $meal + $transport + $position + $fixedAllow) - ($lateDeduct + $fixedDeduct + $absenceDeduct);
        if ($net < 0) {
            $net = 0;
        }

        $payroll->update([
            'basic_salary' => $basic,
            'allowance_meal' => $meal,
            'allowance_transport' => $transport,
            'allowance_position' => $position,
            'allowance_fixed' => $fixedAllow,
            'deduction_late' => $lateDeduct,
            'deduction_fixed' => $fixedDeduct,
            'deduction_absence' => $absenceDeduct,
            'net_salary' => $net,
            'notes' => $request->notes ?: $payroll->notes,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Penyesuaian gaji karyawan berhasil disimpan.',
            'data' => $payroll
        ]);
    }

    /**
     * Hapus transaksi payroll (jika draft/salah generate).
     */
    public function destroyPayroll($id)
    {
        $payroll = Payroll::findOrFail($id);

        if ($payroll->status === 'paid') {
            return response()->json([
                'status' => 'error',
                'message' => 'Gaji yang sudah dibayar tidak dapat dihapus.'
            ], 422);
        }

        $payroll->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Rekam jejak gaji berhasil dihapus.'
        ]);
    }

    /**
     * Dapatkan daftar slip gaji untuk karyawan yang sedang login.
     */
    public function getEmployeePayrolls(Request $request)
    {
        $userId = $request->user()->id;
        $query = Payroll::where('user_id', $userId)
            ->whereIn('status', ['unpaid', 'paid']);

        if ($request->filled('period_month')) {
            $query->where('period_month', $request->period_month);
        }

        $payrolls = $query->orderBy('period_month', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $payrolls
        ]);
    }

    public function approveSalaryConfig($id)
    {
        $config = SalaryConfiguration::findOrFail($id);
        $config->update([
            'basic_salary' => $config->pending_basic_salary ?? $config->basic_salary,
            'allowance_meal_daily' => $config->pending_allowance_meal_daily ?? $config->allowance_meal_daily,
            'allowance_transport_daily' => $config->pending_allowance_transport_daily ?? $config->allowance_transport_daily,
            'allowance_position' => $config->pending_allowance_position ?? $config->allowance_position,
            'deduction_late_daily' => $config->pending_deduction_late_daily ?? $config->deduction_late_daily,
            'deduction_absence_daily' => $config->pending_deduction_absence_daily ?? $config->deduction_absence_daily,
            'deduction_fixed' => $config->pending_deduction_fixed ?? $config->deduction_fixed,
            'pending_basic_salary' => null,
            'pending_allowance_meal_daily' => null,
            'pending_allowance_transport_daily' => null,
            'pending_allowance_position' => null,
            'pending_deduction_late_daily' => null,
            'pending_deduction_absence_daily' => null,
            'pending_deduction_fixed' => null,
            'salary_change_status' => 'approved'
        ]);
        return response()->json(['status' => 'success', 'message' => 'Perubahan gaji berhasil disetujui.']);
    }

    public function rejectSalaryConfig($id)
    {
        $config = SalaryConfiguration::findOrFail($id);
        $config->update([
            'pending_basic_salary' => null,
            'pending_allowance_meal_daily' => null,
            'pending_allowance_transport_daily' => null,
            'pending_allowance_position' => null,
            'pending_deduction_late_daily' => null,
            'pending_deduction_absence_daily' => null,
            'pending_deduction_fixed' => null,
            'salary_change_status' => 'rejected'
        ]);
        return response()->json(['status' => 'success', 'message' => 'Perubahan gaji ditolak.']);
    }

    public function submitPayrollApproval(Request $request, $id)
    {
        $payroll = Payroll::findOrFail($id);
        $payroll->update(['status' => 'pending_approval']);
        return response()->json(['status' => 'success', 'message' => 'Payroll berhasil diajukan ke Direktur untuk disetujui.']);
    }

    public function submitAllPayrollApproval(Request $request)
    {
        $request->validate(['period_month' => 'required|string']);
        Payroll::where('period_month', $request->period_month)
            ->where('status', 'draft')
            ->update(['status' => 'pending_approval']);
        return response()->json(['status' => 'success', 'message' => 'Semua payroll pada periode ini berhasil diajukan ke Direktur.']);
    }

    public function approvePayroll($id)
    {
        $payroll = Payroll::findOrFail($id);
        $payroll->update(['status' => 'unpaid']);
        return response()->json(['status' => 'success', 'message' => 'Payroll disetujui, siap dibayarkan.']);
    }

    public function rejectPayroll($id)
    {
        $payroll = Payroll::findOrFail($id);
        $payroll->update(['status' => 'draft']);
        return response()->json(['status' => 'success', 'message' => 'Payroll ditolak dan dikembalikan sebagai draft.']);
    }

    public function approveAllPayroll(Request $request)
    {
        $request->validate(['period_month' => 'required|string']);
        Payroll::where('period_month', $request->period_month)
            ->where('status', 'pending_approval')
            ->update(['status' => 'unpaid']);
        return response()->json(['status' => 'success', 'message' => 'Semua payroll pada periode ini berhasil disetujui.']);
    }

    public function rejectAllPayroll(Request $request)
    {
        $request->validate(['period_month' => 'required|string']);
        Payroll::where('period_month', $request->period_month)
            ->where('status', 'pending_approval')
            ->update(['status' => 'draft']);
        return response()->json(['status' => 'success', 'message' => 'Semua payroll pada periode ini ditolak dan dikembalikan sebagai draft.']);
    }

    public function indexHolidays(Request $request)
    {
        $holidays = Holiday::orderBy('holiday_date', 'asc')->get();
        return response()->json([
            'status' => 'success',
            'data' => $holidays
        ]);
    }

    public function storeHoliday(Request $request)
    {
        $request->validate([
            'holiday_date' => 'required|date|unique:holidays,holiday_date',
            'name' => 'required|string|max:255',
        ]);

        $holiday = Holiday::create([
            'holiday_date' => $request->holiday_date,
            'name' => $request->name,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Hari libur nasional berhasil ditambahkan.',
            'data' => $holiday
        ]);
    }

    public function destroyHoliday($id)
    {
        $holiday = Holiday::findOrFail($id);
        $holiday->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Hari libur nasional berhasil dihapus.'
        ]);
    }

    public function importHolidays(Request $request)
    {
        $request->validate([
            'year' => 'required|integer|min:2020|max:2035',
        ]);

        $year = $request->year;
        $importedCount = 0;
        $success = false;

        try {
            // Panggil API Hari Libur Nasional & Cuti Bersama Indonesia (timeout 8 detik)
            $response = Http::timeout(8)->get("https://api-hari-libur.vercel.app/api?year={$year}");

            if ($response->successful()) {
                $body = $response->json();
                $holidays = $body['data'] ?? [];

                foreach ($holidays as $holiday) {
                    $date = $holiday['date'] ?? null;
                    $name = $holiday['description'] ?? null;

                    if ($date && $name) {
                        $existing = Holiday::whereDate('holiday_date', $date)->first();
                        if ($existing) {
                            $existing->update(['name' => $name]);
                        } else {
                            Holiday::create([
                                'holiday_date' => $date,
                                'name' => $name
                            ]);
                            $importedCount++;
                        }
                    }
                }
                $success = true;
            }
        } catch (\Exception $e) {
            // Catat error jika API gagal
        }

        if ($success) {
            return response()->json([
                'status' => 'success',
                'message' => "Berhasil mengimpor {$importedCount} Hari Libur Nasional & Cuti Bersama tahun {$year} dari API!"
            ]);
        }

        // Jika API gagal / offline, gunakan fallback hardcoded khusus untuk tahun 2026
        if ($year == 2026) {
            $fallbackHolidays = [
                // Hari Libur Nasional 2026
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

            foreach ($fallbackHolidays as $holiday) {
                $existing = Holiday::whereDate('holiday_date', $holiday['holiday_date'])->first();
                if ($existing) {
                    $existing->update(['name' => $holiday['name']]);
                } else {
                    Holiday::create($holiday);
                    $importedCount++;
                }
            }

            return response()->json([
                'status' => 'success',
                'message' => "Koneksi API gagal. Berhasil mengimpor {$importedCount} Hari Libur tahun 2026 dari data cadangan lokal."
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => "Gagal terhubung ke API Hari Libur Nasional untuk mengambil data tahun {$year}."
        ], 502);
    }
}
