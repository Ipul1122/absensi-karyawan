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

class SidebarNotificationController extends Controller
{
    public function getCounts(Request $request)
    {
        $user = $request->user();
        $role = $user->role;

        $data = [];

        if ($role === 'employee') {
            // Employee needs counts of their own pending requests
            $data['pendingCutiCount'] = LeaveRequest::where('user_id', $user->id)
                ->whereIn('status', ['pending', 'pending_director'])
                ->count();

            $data['pendingLemburCount'] = Overtime::where('user_id', $user->id)
                ->whereIn('status', ['pending', 'pending_director'])
                ->count();

            $data['pendingReimburseCount'] = Reimbursement::where('user_id', $user->id)
                ->whereIn('status', ['pending', 'pending_director'])
                ->count();

            // Employee only sees approved bonuses in index, so maybe pending bonuses count is not shown,
            // but let's send 0 or check if they want to see pending bonus. Let's send 0.
            $data['pendingBonusCount'] = 0;

            // Employee unpaid payroll count
            $data['unpaidPayrollCount'] = Payroll::where('user_id', $user->id)
                ->where('status', 'unpaid')
                ->count();

            // Total for parent "Operasional" dropdown
            $data['operasionalCount'] = $data['pendingCutiCount'] + $data['pendingLemburCount'] + $data['pendingReimburseCount'];
        } elseif ($role === 'admin') {
            // Admin needs counts of pending items waiting for Admin action
            $data['pendingCutiCount'] = LeaveRequest::where('status', 'pending')->count();
            $data['pendingReimburseCount'] = Reimbursement::where('status', 'pending')->count();
            $data['pendingLemburCount'] = Overtime::where('status', 'pending')->count();
            
            // Unpaid payroll count for "Bayar Gaji" which admin needs to pay
            $data['unpaidPayrollCount'] = Payroll::where('status', 'unpaid')->count();
            
            // Total for parent "Operasional" dropdown
            $data['operasionalCount'] = $data['pendingCutiCount'] + $data['pendingReimburseCount'] + $data['pendingLemburCount'];
            
            // Pending employees accounts count (pending or pending_delete)
            $data['pendingKaryawanCount'] = User::where('role', 'employee')
                ->whereIn('status', ['pending', 'pending_delete'])
                ->count();
        } elseif ($role === 'director') {
            // Director needs counts of pending items waiting for Director action
            $data['pendingKaryawanCount'] = User::where('role', 'employee')
                ->whereIn('status', ['pending', 'pending_delete'])
                ->count();

            $data['pendingGajiCount'] = SalaryConfiguration::where('salary_change_status', 'pending')->count();

            $data['pendingPayrollCount'] = Payroll::where('status', 'pending_approval')->count();

            // Director's pending operasional count: cuti, lembur, reimburse, bonus, inventaris
            $data['pendingCutiCount'] = LeaveRequest::where('status', 'pending_director')->count();
            $data['pendingLemburCount'] = Overtime::where('status', 'pending_director')->count();
            $data['pendingReimburseCount'] = Reimbursement::where('status', 'pending_director')->count();
            $data['pendingBonusCount'] = Bonus::where('status', 'pending')->count();
            $data['pendingInventoryCount'] = Inventory::where('status', 'pending')->count();

            $data['pendingOperasionalCount'] = $data['pendingCutiCount'] 
                + $data['pendingLemburCount'] 
                + $data['pendingReimburseCount'] 
                + $data['pendingBonusCount'] 
                + $data['pendingInventoryCount'];
        }

        return response()->json([
            'status' => 'success',
            'data' => $data
        ]);
    }
}
