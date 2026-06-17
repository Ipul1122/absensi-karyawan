<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\LeaveRequest;
use App\Models\Overtime;
use App\Models\Reimbursement;
use App\Models\Payroll;
use App\Models\SalaryConfiguration;
use App\Models\Bonus;
use App\Models\Inventory;
use Illuminate\Support\Facades\Auth;

class DirectorController extends Controller
{
    /**
     * Get a consolidated dashboard summary for the Director.
     */
    public function getDashboardSummary(Request $request)
    {
        $currentMonthStr = now()->format('Y-m');

        // 1. Fetch data for metrics
        $activeEmployees = User::whereIn('role', ['employee', 'admin'])
            ->where('status', 'active')
            ->select('id', 'name', 'email')
            ->get();

        $payrolls = Payroll::where('period_month', $currentMonthStr)
            ->select('id', 'net_salary', 'status')
            ->get();

        // Get leaves today
        $today = now()->format('Y-m-d');
        $leavesToday = LeaveRequest::with('user:id,name')
            ->where('status', 'approved')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->get()
            ->map(function ($leave) {
                return [
                    'id' => $leave->id,
                    'reason' => $leave->reason,
                    'user' => [
                        'name' => $leave->user ? $leave->user->name : 'Karyawan'
                    ]
                ];
            });

        // 2. Fetch pending items for counting and unified listing
        $pendingEmployees = User::whereIn('role', ['employee', 'admin'])
            ->whereIn('status', ['pending', 'pending_delete'])
            ->get();

        $pendingSalaryConfigs = User::whereIn('role', ['employee', 'admin'])
            ->whereHas('salaryConfiguration', function ($query) {
                $query->where('salary_change_status', 'pending');
            })
            ->with('salaryConfiguration')
            ->get();

        $pendingPayrolls = Payroll::with('user:id,name,email')
            ->where('status', 'pending_approval')
            ->get();

        $pendingLeaves = LeaveRequest::with('user:id,name,email')
            ->where('status', 'pending_director')
            ->get();

        $pendingOvertimes = Overtime::with('user:id,name,email')
            ->where('status', 'pending_director')
            ->get();

        $pendingReimbursements = Reimbursement::with('user:id,name,email')
            ->where('status', 'pending_director')
            ->get();

        $pendingBonuses = Bonus::with('user:id,name,email')
            ->where('status', 'pending')
            ->get();

        $pendingInventories = Inventory::where('status', 'pending')
            ->get();

        // 3. Calculate metrics
        $totalEmployees = $activeEmployees->count();
        $totalProposedPayroll = $payrolls->sum('net_salary');

        $pendingRegister = $pendingEmployees->where('status', 'pending')->count();
        $pendingDelete = $pendingEmployees->where('status', 'pending_delete')->count();
        $pendingSalary = $pendingSalaryConfigs->count();
        $pendingPayroll = $pendingPayrolls->count();

        $pendingLeavesCount = $pendingLeaves->count();
        $pendingOvertimesCount = $pendingOvertimes->count();
        $pendingReimbursementsCount = $pendingReimbursements->count();
        $pendingBonusesCount = $pendingBonuses->count();
        $pendingInventoriesCount = $pendingInventories->count();
        $pendingOperational = $pendingLeavesCount + $pendingOvertimesCount + $pendingReimbursementsCount + $pendingBonusesCount + $pendingInventoriesCount;

        // 4. Build Unified Pending Items list
        $unifiedItems = [];

        // 4.1 New Register Employees
        foreach ($pendingEmployees->where('status', 'pending') as $emp) {
            $unifiedItems[] = [
                'id' => $emp->id,
                'type' => 'employee_new',
                'title' => 'Pendaftaran Karyawan Baru',
                'subtitle' => $emp->email,
                'requesterName' => $emp->name,
                'requesterEmail' => $emp->email,
                'date' => $emp->join_date ?: ($emp->created_at ? $emp->created_at->toISOString() : now()->toISOString()),
                'badgeText' => 'Pendaftaran',
                'details' => 'Tanggal Bergabung: ' . ($emp->join_date ? date('j M Y', strtotime($emp->join_date)) : '-'),
                'originalData' => [
                    'id' => $emp->id,
                    'name' => $emp->name,
                    'email' => $emp->email,
                    'role' => $emp->role,
                    'status' => $emp->status,
                    'join_date' => $emp->join_date
                ]
            ];
        }

        // 4.2 Delete Requests
        foreach ($pendingEmployees->where('status', 'pending_delete') as $emp) {
            $unifiedItems[] = [
                'id' => $emp->id,
                'type' => 'employee_delete',
                'title' => 'Pengajuan Hapus Akun',
                'subtitle' => $emp->email,
                'requesterName' => $emp->name,
                'requesterEmail' => $emp->email,
                'date' => $emp->updated_at ? $emp->updated_at->toISOString() : now()->toISOString(),
                'badgeText' => 'Hapus Akun',
                'details' => 'Meminta persetujuan direktur untuk menghapus akun secara permanen dari sistem.',
                'originalData' => [
                    'id' => $emp->id,
                    'name' => $emp->name,
                    'email' => $emp->email,
                    'role' => $emp->role,
                    'status' => $emp->status,
                    'join_date' => $emp->join_date
                ]
            ];
        }

        // 4.3 Salary Configuration adjustments
        foreach ($pendingSalaryConfigs as $emp) {
            $config = $emp->salaryConfiguration;
            if (!$config) continue;

            $changes = [];

            if ($config->pending_basic_salary !== null && $config->pending_basic_salary != $config->basic_salary) {
                $changes[] = 'Gaji Pokok: ' . number_format($config->basic_salary, 0, ',', '.') . ' → ' . number_format($config->pending_basic_salary, 0, ',', '.');
            }
            if ($config->pending_allowance_meal_daily !== null && $config->pending_allowance_meal_daily != $config->allowance_meal_daily) {
                $changes[] = 'Tunj. Makan: ' . number_format($config->allowance_meal_daily, 0, ',', '.') . ' → ' . number_format($config->pending_allowance_meal_daily, 0, ',', '.');
            }
            if ($config->pending_allowance_transport_daily !== null && $config->pending_allowance_transport_daily != $config->allowance_transport_daily) {
                $changes[] = 'Tunj. Transport: ' . number_format($config->allowance_transport_daily, 0, ',', '.') . ' → ' . number_format($config->pending_allowance_transport_daily, 0, ',', '.');
            }
            if ($config->pending_allowance_position !== null && $config->pending_allowance_position != $config->allowance_position) {
                $changes[] = 'Tunj. Jabatan: ' . number_format($config->allowance_position, 0, ',', '.') . ' → ' . number_format($config->pending_allowance_position, 0, ',', '.');
            }

            $unifiedItems[] = [
                'id' => $config->id,
                'type' => 'salary_config',
                'title' => 'Penyesuaian Gaji Karyawan',
                'subtitle' => $emp->email,
                'requesterName' => $emp->name,
                'requesterEmail' => $emp->email,
                'date' => $config->updated_at ? $config->updated_at->toISOString() : now()->toISOString(),
                'badgeText' => 'Gaji',
                'details' => count($changes) > 0 ? implode(' | ', $changes) : 'Mengajukan nilai gaji baru',
                'originalData' => [
                    'id' => $config->id,
                    'basic_salary' => $config->basic_salary,
                    'allowance_meal_daily' => $config->allowance_meal_daily,
                    'allowance_transport_daily' => $config->allowance_transport_daily,
                    'allowance_position' => $config->allowance_position,
                    'pending_basic_salary' => $config->pending_basic_salary,
                    'pending_allowance_meal_daily' => $config->pending_allowance_meal_daily,
                    'pending_allowance_transport_daily' => $config->pending_allowance_transport_daily,
                    'pending_allowance_position' => $config->pending_allowance_position,
                    'employeeName' => $emp->name
                ]
            ];
        }

        // 4.4 Payroll Requests
        foreach ($pendingPayrolls as $record) {
            $unifiedItems[] = [
                'id' => $record->id,
                'type' => 'payroll',
                'title' => 'Proposal Slip Gaji Bulanan',
                'subtitle' => 'Periode: ' . $record->period_month,
                'requesterName' => $record->user ? $record->user->name : 'Karyawan',
                'requesterEmail' => $record->user ? $record->user->email : null,
                'date' => $record->created_at ? $record->created_at->toISOString() : now()->toISOString(),
                'amount' => $record->net_salary,
                'badgeText' => 'Payroll',
                'details' => 'Total Transfer Bersih: Rp ' . number_format($record->net_salary, 0, ',', '.') . ' (' . $record->days_present . 'H hadir, ' . $record->days_late . 'T telat)',
                'originalData' => $record
            ];
        }

        // 4.5 Leaves
        foreach ($pendingLeaves as $r) {
            $categoryLabel = $r->category === 'LAINNYA' ? $r->custom_category : $r->category;
            $unifiedItems[] = [
                'id' => $r->id,
                'type' => 'leave',
                'title' => 'Pengajuan Cuti (' . $categoryLabel . ')',
                'subtitle' => 'Alasan: ' . $r->reason,
                'requesterName' => $r->user ? $r->user->name : 'Karyawan',
                'requesterEmail' => $r->user ? $r->user->email : null,
                'date' => $r->start_date ?: now()->toDateString(),
                'badgeText' => 'Cuti',
                'details' => ($r->start_date && $r->end_date) ? (date('j M', strtotime($r->start_date)) . ' s/d ' . date('j M Y', strtotime($r->end_date))) : '-',
                'originalData' => $r
            ];
        }

        // 4.6 Overtimes
        foreach ($pendingOvertimes as $r) {
            $unifiedItems[] = [
                'id' => $r->id,
                'type' => 'overtime',
                'title' => 'Pengajuan Lembur (' . $r->duration . ' Jam)',
                'subtitle' => 'Alasan: ' . $r->reason,
                'requesterName' => $r->user ? $r->user->name : 'Karyawan',
                'requesterEmail' => $r->user ? $r->user->email : null,
                'date' => $r->date ?: now()->toDateString(),
                'badgeText' => 'Lembur',
                'details' => $r->date ? (date('j M Y', strtotime($r->date)) . ' · ' . substr($r->start_time, 0, 5) . ' - ' . substr($r->end_time, 0, 5)) : '-',
                'originalData' => $r
            ];
        }

        // 4.7 Reimbursements
        foreach ($pendingReimbursements as $r) {
            $unifiedItems[] = [
                'id' => $r->id,
                'type' => 'reimbursement',
                'title' => 'Klaim Reimbursement: ' . $r->title,
                'subtitle' => 'Kategori: ' . $r->category . ' · Nominal: Rp ' . number_format($r->amount, 0, ',', '.'),
                'requesterName' => $r->user ? $r->user->name : 'Karyawan',
                'requesterEmail' => $r->user ? $r->user->email : null,
                'date' => $r->expense_date ?: now()->toDateString(),
                'amount' => $r->amount,
                'badgeText' => 'Klaim Biaya',
                'details' => 'Keterangan: ' . ($r->description ?: '-'),
                'originalData' => $r
            ];
        }

        // 4.8 Bonuses
        foreach ($pendingBonuses as $r) {
            $unifiedItems[] = [
                'id' => $r->id,
                'type' => 'bonus',
                'title' => 'Pengajuan Bonus Tambahan',
                'subtitle' => 'Nominal: Rp ' . number_format($r->bonus_amount, 0, ',', '.'),
                'requesterName' => $r->user ? $r->user->name : 'Karyawan',
                'requesterEmail' => $r->user ? $r->user->email : null,
                'date' => $r->bonus_date ?: now()->toDateString(),
                'amount' => $r->bonus_amount,
                'badgeText' => 'Bonus',
                'details' => 'Keterangan: ' . ($r->description ?: '-') . ($r->bonus_date ? (' · Tanggal: ' . date('j M', strtotime($r->bonus_date))) : ''),
                'originalData' => $r
            ];
        }

        // 4.9 Inventories
        foreach ($pendingInventories as $r) {
            $unifiedItems[] = [
                'id' => $r->id,
                'type' => 'inventory',
                'title' => 'Pengadaan Barang: ' . $r->nama_barang,
                'subtitle' => 'Kondisi: ' . strtoupper($r->kondisi_barang) . ' · Lokasi: ' . $r->lokasi,
                'requesterName' => $r->pemakai_barang ?: 'Kantor Utama',
                'date' => $r->tanggal_pembelian ?: now()->toDateString(),
                'amount' => $r->harga,
                'badgeText' => 'Inventaris',
                'details' => 'Estimasi Harga: Rp ' . number_format($r->harga, 0, ',', '.') . ($r->tanggal_pembelian ? (' · Tanggal: ' . date('j M', strtotime($r->tanggal_pembelian))) : ''),
                'originalData' => $r
            ];
        }

        // Sort items by date descending
        usort($unifiedItems, function ($a, $b) {
            return strtotime($b['date']) - strtotime($a['date']);
        });

        // Calculate total overall tasks for mockup progress bar
        $totalOverallTasksCount = User::whereIn('role', ['employee', 'admin'])->count() +
            SalaryConfiguration::count() +
            Payroll::count() +
            LeaveRequest::count() +
            Overtime::count() +
            Reimbursement::count() +
            Bonus::count() +
            Inventory::count();

        // 5. Send aggregated response
        return response()->json([
            'status' => 'success',
            'data' => [
                'totalEmployees' => $totalEmployees,
                'totalProposedPayroll' => $totalProposedPayroll,
                'activeLeavesToday' => $leavesToday,
                'totalOverallTasksCount' => $totalOverallTasksCount,
                'stats' => [
                    'pendingRegister' => $pendingRegister,
                    'pendingDelete' => $pendingDelete,
                    'pendingSalary' => $pendingSalary,
                    'pendingPayroll' => $pendingPayroll,
                    'pendingOperational' => $pendingOperational,
                ],
                'unifiedPendingItems' => $unifiedItems
            ]
        ]);
    }
}
