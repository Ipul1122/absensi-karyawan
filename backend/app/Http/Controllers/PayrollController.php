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

class PayrollController extends Controller
{
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
            ]
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Pengaturan gaji karyawan berhasil disimpan.',
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
        
        // Dapatkan range tanggal awal & akhir bulan berjalan
        $startOfMonth = Carbon::parse($period . '-01')->startOfMonth();
        $endOfMonth = Carbon::parse($period . '-01')->endOfMonth();

        // Get all national holidays in this month
        $holidayDates = Holiday::whereBetween('date', [$startOfMonth->toDateString(), $endOfMonth->toDateString()])
            ->pluck('date')
            ->toArray();

        $employees = User::where('role', 'employee')->get();

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
                // 1. Hitung total kehadiran (clock_in tidak null) di bulan tersebut
                $daysPresent = Attendance::where('user_id', $employee->id)
                    ->whereBetween('date', [$startOfMonth->toDateString(), $endOfMonth->toDateString()])
                    ->whereNotNull('clock_in')
                    ->count();

                // 2. Hitung total keterlambatan (status_in = 'late')
                $daysLate = Attendance::where('user_id', $employee->id)
                    ->whereBetween('date', [$startOfMonth->toDateString(), $endOfMonth->toDateString()])
                    ->where('status_in', 'late')
                    ->count();

                // 3. Hitung total hari cuti yang disetujui
                // Mengambil cuti yang disetujui yang beririsan dengan bulan terpilih
                $leaves = LeaveRequest::where('user_id', $employee->id)
                    ->where('status', 'approved')
                    ->where(function($query) use ($startOfMonth, $endOfMonth) {
                        $query->whereBetween('start_date', [$startOfMonth->toDateString(), $endOfMonth->toDateString()])
                              ->orWhereBetween('end_date', [$startOfMonth->toDateString(), $endOfMonth->toDateString()])
                              ->orWhere(function($subQuery) use ($startOfMonth, $endOfMonth) {
                                  $subQuery->where('start_date', '<=', $startOfMonth->toDateString())
                                           ->where('end_date', '>=', $endOfMonth->toDateString());
                              });
                    })
                    ->get();

                $daysLeave = 0;
                foreach ($leaves as $leave) {
                    $leaveStart = Carbon::parse($leave->start_date);
                    $leaveEnd = Carbon::parse($leave->end_date);
                    
                    // Batasi start & end date pada rentang bulan terpilih
                    $overlapStart = $leaveStart->max($startOfMonth);
                    $overlapEnd = $leaveEnd->min($endOfMonth);
                    
                    if ($overlapStart <= $overlapEnd) {
                        $daysLeave += $overlapStart->diffInDays($overlapEnd) + 1;
                    }
                }

                // 4. Ambil konfigurasi gaji karyawan
                $config = SalaryConfiguration::where('user_id', $employee->id)->first();
                
                // Jika setelan gaji belum diatur, default ke 4.500.000
                $baseBasicSalary = $config ? $config->basic_salary : 4500000;
                $deductDailyLate = $config ? $config->deduction_late_daily : 0;
                $deductFixed = $config ? $config->deduction_fixed : 0;

                // Hitung total hari kerja efektif (Senin - Sabtu, dikurangi Hari Libur) di bulan tersebut
                $workingDaysInMonth = 0;
                $tempDate = $startOfMonth->copy();
                while ($tempDate->lte($endOfMonth)) {
                    $isSunday = $tempDate->dayOfWeek === Carbon::SUNDAY;
                    $isHoliday = in_array($tempDate->toDateString(), $holidayDates);
                    if (!$isSunday && !$isHoliday) {
                        $workingDaysInMonth++;
                    }
                    $tempDate->addDay();
                }

                // Gaji Pokok dihitung prorata: (days_present / workingDaysInMonth) * Gaji Pokok
                $proratedBasicSalary = 0;
                if ($workingDaysInMonth > 0) {
                    $proratedBasicSalary = ($daysPresent / $workingDaysInMonth) * $baseBasicSalary;
                }

                // 5. Hitung total tunjangan & potongan
                $allowanceMeal = $config ? ($daysPresent * $config->allowance_meal_daily) : 0;
                $allowanceTransport = $config ? ($daysPresent * $config->allowance_transport_daily) : 0;
                $allowancePosition = $config ? $config->allowance_position : 0;
                $allowanceFixed = $config ? $config->allowance_fixed : 0;
                $deductionLate = $daysLate * $deductDailyLate;
                
                // Hitung total potongan tidak masuk
                $daysAbsent = max(0, $workingDaysInMonth - $daysPresent - $daysLeave);
                $deductionAbsence = $config ? ($daysAbsent * $config->deduction_absence_daily) : 0;
                
                // Total Gaji Bersih = Gaji Pokok Prorata + Makan + Transport + Jabatan + Tetap - Potongan Telat - Potongan Tetap - Potongan Tidak Masuk
                $netSalary = $proratedBasicSalary + $allowanceMeal + $allowanceTransport + $allowancePosition + $allowanceFixed - $deductionLate - $deductFixed - $deductionAbsence;
                if ($netSalary < 0) {
                    $netSalary = 0; // Gaji tidak boleh negatif
                }

                // 6. Buat atau perbarui transaksi payroll
                Payroll::updateOrCreate(
                    [
                        'user_id' => $employee->id,
                        'period_month' => $period
                    ],
                    [
                        'days_present' => $daysPresent,
                        'days_late' => $daysLate,
                        'days_leave' => $daysLeave,
                        'basic_salary' => $proratedBasicSalary,
                        'allowance_meal' => $allowanceMeal,
                        'allowance_transport' => $allowanceTransport,
                        'allowance_fixed' => $allowanceFixed,
                        'allowance_position' => $allowancePosition,
                        'deduction_late' => $deductionLate,
                        'deduction_fixed' => $deductFixed,
                        'deduction_absence' => $deductionAbsence,
                        'net_salary' => $netSalary,
                        'status' => 'draft', // default ke draft
                        'notes' => "Kalkulasi otomatis. Hari kerja efektif bulan ini: $workingDaysInMonth hari. Potongan tidak masuk: $daysAbsent hari."
                    ]
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
        $query = Payroll::where('user_id', $userId);

        if ($request->filled('period_month')) {
            $query->where('period_month', $request->period_month);
        }

        $payrolls = $query->orderBy('period_month', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $payrolls
        ]);
    }
}
