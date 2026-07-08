<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\LeaveRequest;
use App\Models\Overtime;
use App\Models\Reimbursement;
use App\Models\Payroll;
use App\Models\SalaryConfiguration;
use App\Models\Bonus;
use App\Models\Inventory;
use App\Models\PermitRequest;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Get pending action counts for the authenticated user based on their role.
     */
    public function getCounts(Request $request)
    {
        $user = Auth::user();
        $counts = [];

        if ($user->role === 'employee') {
            $pendingCuti = LeaveRequest::where('user_id', $user->id)->whereIn('status', ['pending', 'pending_director'])->count();
            $pendingLembur = Overtime::where('user_id', $user->id)->whereIn('status', ['pending', 'pending_director'])->count();
            $pendingReimburse = Reimbursement::where('user_id', $user->id)->whereIn('status', ['pending', 'pending_director'])->count();
            $pendingIzin = PermitRequest::where('user_id', $user->id)->whereIn('status', ['pending', 'pending_director'])->count();
            $unpaidPayroll = Payroll::where('user_id', $user->id)->where('status', 'unpaid')->count();

            $counts = [
                'pendingCutiCount' => $pendingCuti,
                'pendingLemburCount' => $pendingLembur,
                'pendingReimburseCount' => $pendingReimburse,
                'pendingIzinCount' => $pendingIzin,
                'unpaidPayrollCount' => $unpaidPayroll,
                'operasionalCount' => $pendingCuti + $pendingLembur + $pendingReimburse + $pendingIzin,
            ];
        } elseif ($user->role === 'admin') {
            $pendingKaryawan = User::where('role', 'employee')->where('status', 'pending')->count();
            $pendingCuti = LeaveRequest::where('status', 'pending')->count();
            $pendingLembur = Overtime::where('status', 'pending')->count();
            $pendingReimburse = Reimbursement::where('status', 'pending')->count();
            $pendingIzin = PermitRequest::where('status', 'pending')->count();
            $unpaidPayroll = Payroll::where('status', 'unpaid')->count();

            $counts = [
                'pendingKaryawanCount' => $pendingKaryawan,
                'pendingCutiCount' => $pendingCuti,
                'pendingLemburCount' => $pendingLembur,
                'pendingReimburseCount' => $pendingReimburse,
                'pendingIzinCount' => $pendingIzin,
                'unpaidPayrollCount' => $unpaidPayroll,
                'operasionalCount' => $pendingCuti + $pendingLembur + $pendingReimburse + $pendingIzin,
            ];
        } elseif ($user->role === 'director') {
            $pendingKaryawan = User::whereIn('status', ['pending', 'pending_delete'])->count();
            $pendingGaji = SalaryConfiguration::where('salary_change_status', 'pending')->count();
            $pendingPayroll = Payroll::whereIn('status', ['pending_approval', 'unpaid'])->count();

            $opCuti = LeaveRequest::where('status', 'pending_director')->count();
            $opLembur = Overtime::where('status', 'pending_director')->count();
            $opReimburse = Reimbursement::where('status', 'pending_director')->count();
            $opIzin = PermitRequest::where('status', 'pending_director')->count();
            $opBonus = Bonus::where('status', 'pending')->count();
            $opInventory = Inventory::where('status', 'pending')->count();

            $counts = [
                'pendingKaryawanCount' => $pendingKaryawan,
                'pendingGajiCount' => $pendingGaji,
                'pendingPayrollCount' => $pendingPayroll,
                'pendingOperasionalCount' => $opCuti + $opLembur + $opReimburse + $opBonus + $opInventory + $opIzin,
            ];
        }

        return response()->json([
            'status' => 'success',
            'data' => $counts
        ]);
    }
}
