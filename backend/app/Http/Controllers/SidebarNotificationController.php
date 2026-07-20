<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\LeaveRequest;
use App\Models\Overtime;
use App\Models\Reimbursement;
use App\Models\Bonus;
use App\Models\Inventory;
use App\Models\Payroll;
use App\Models\SalaryConfiguration;
use App\Models\PermitRequest;
use Illuminate\Support\Facades\Auth;

class SidebarNotificationController extends Controller
{
    public function getCounts(Request $request)
    {
        try {
            $user = $request->user() ?: Auth::user();
            if (!$user) {
                return response()->json([
                    'status' => 'success',
                    'data' => []
                ]);
            }

            $role = $user->role;
            $data = [];

            if ($role === 'employee') {
                $data['pendingCutiCount'] = LeaveRequest::where('user_id', $user->id)
                    ->whereIn('status', ['pending', 'pending_director'])
                    ->count();

                $data['pendingLemburCount'] = Overtime::where('user_id', $user->id)
                    ->whereIn('status', ['pending', 'pending_director'])
                    ->count();

                $data['pendingReimburseCount'] = Reimbursement::where('user_id', $user->id)
                    ->whereIn('status', ['pending', 'pending_director'])
                    ->count();

                $data['pendingIzinCount'] = PermitRequest::where('user_id', $user->id)
                    ->whereIn('status', ['pending', 'pending_director'])
                    ->count();

                $data['pendingBonusCount'] = 0;

                $data['unpaidPayrollCount'] = Payroll::where('user_id', $user->id)
                    ->where('status', 'unpaid')
                    ->count();

                $data['operasionalCount'] = $data['pendingCutiCount'] + $data['pendingLemburCount'] + $data['pendingReimburseCount'] + $data['pendingIzinCount'];
            } elseif ($role === 'admin') {
                $data['pendingKaryawanCount'] = User::where('role', 'employee')
                    ->where('status', 'pending')
                    ->count();

                $data['pendingCutiCount'] = LeaveRequest::where('status', 'pending')->count();
                $data['pendingIzinCount'] = PermitRequest::where('status', 'pending')->count();
                $data['pendingReimburseCount'] = Reimbursement::where('status', 'pending')->count();
                $data['pendingLemburCount'] = Overtime::where('status', 'pending')->count();
                $data['unpaidPayrollCount'] = Payroll::where('status', 'unpaid')->count();

                $data['operasionalCount'] = $data['pendingCutiCount'] + $data['pendingIzinCount'] + $data['pendingReimburseCount'] + $data['pendingLemburCount'];
            } elseif ($role === 'director') {
                $data['pendingKaryawanCount'] = User::whereIn('status', ['pending', 'pending_delete'])->count();
                $data['pendingGajiCount'] = SalaryConfiguration::where('salary_change_status', 'pending')->count();
                $data['pendingPayrollCount'] = Payroll::whereIn('status', ['pending_approval', 'unpaid'])->count();

                $opCuti = LeaveRequest::where('status', 'pending_director')->count();
                $opLembur = Overtime::where('status', 'pending_director')->count();
                $opReimburse = Reimbursement::where('status', 'pending_director')->count();
                $opIzin = PermitRequest::where('status', 'pending_director')->count();
                $opBonus = Bonus::where('status', 'pending')->count();
                $opInventory = Inventory::where('status', 'pending')->count();

                $data['pendingOperasionalCount'] = $opCuti + $opLembur + $opReimburse + $opBonus + $opInventory + $opIzin;
            }

            return response()->json([
                'status' => 'success',
                'data' => $data
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'success',
                'data' => []
            ]);
        }
    }
}
