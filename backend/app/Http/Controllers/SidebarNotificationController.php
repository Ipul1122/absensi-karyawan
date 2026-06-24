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
            $company = $user->company;

            $pendingCutiQuery = LeaveRequest::where('status', 'pending');
            $pendingReimburseQuery = Reimbursement::where('status', 'pending');
            $pendingLemburQuery = Overtime::where('status', 'pending');
            $unpaidPayrollQuery = Payroll::where('status', 'unpaid');
            $pendingKaryawanQuery = User::where('role', 'employee')->whereIn('status', ['pending', 'pending_delete']);

            if ($company) {
                $pendingCutiQuery->whereHas('user', function ($q) use ($company) {
                    $q->where('company', $company);
                });
                $pendingReimburseQuery->whereHas('user', function ($q) use ($company) {
                    $q->where('company', $company);
                });
                $pendingLemburQuery->whereHas('user', function ($q) use ($company) {
                    $q->where('company', $company);
                });
                $unpaidPayrollQuery->whereHas('user', function ($q) use ($company) {
                    $q->where('company', $company);
                });
                $pendingKaryawanQuery->where('company', $company);
            }

            $data['pendingCutiCount'] = $pendingCutiQuery->count();
            $data['pendingReimburseCount'] = $pendingReimburseQuery->count();
            $data['pendingLemburCount'] = $pendingLemburQuery->count();
            $data['unpaidPayrollCount'] = $unpaidPayrollQuery->count();
            $data['pendingKaryawanCount'] = $pendingKaryawanQuery->count();
            
            // Total for parent "Operasional" dropdown
            $data['operasionalCount'] = $data['pendingCutiCount'] + $data['pendingReimburseCount'] + $data['pendingLemburCount'];
        } elseif ($role === 'director') {
            // Director needs counts of pending items waiting for Director action
            $company = $user->company;

            $pendingKaryawanQuery = User::where('role', 'employee')->whereIn('status', ['pending', 'pending_delete']);
            $pendingGajiQuery = SalaryConfiguration::where('salary_change_status', 'pending');
            $pendingPayrollQuery = Payroll::whereIn('status', ['pending_approval', 'unpaid']);
            
            // Director's pending operasional count: cuti, lembur, reimburse, bonus, inventaris
            $pendingCutiQuery = LeaveRequest::where('status', 'pending_director');
            $pendingLemburQuery = Overtime::where('status', 'pending_director');
            $pendingReimburseQuery = Reimbursement::where('status', 'pending_director');
            $pendingBonusQuery = Bonus::where('status', 'pending');
            $pendingInventoryQuery = Inventory::where('status', 'pending');

            if ($company) {
                $pendingKaryawanQuery->where('company', $company);
                $pendingGajiQuery->whereHas('user', function ($q) use ($company) {
                    $q->where('company', $company);
                });
                $pendingPayrollQuery->whereHas('user', function ($q) use ($company) {
                    $q->where('company', $company);
                });
                $pendingCutiQuery->whereHas('user', function ($q) use ($company) {
                    $q->where('company', $company);
                });
                $pendingLemburQuery->whereHas('user', function ($q) use ($company) {
                    $q->where('company', $company);
                });
                $pendingReimburseQuery->whereHas('user', function ($q) use ($company) {
                    $q->where('company', $company);
                });
                $pendingBonusQuery->whereHas('user', function ($q) use ($company) {
                    $q->where('company', $company);
                });
                // Note: Inventory does not have a user relationship, counted as-is
            }

            $data['pendingKaryawanCount'] = $pendingKaryawanQuery->count();
            $data['pendingGajiCount'] = $pendingGajiQuery->count();
            $data['pendingPayrollCount'] = $pendingPayrollQuery->count();
            $data['pendingCutiCount'] = $pendingCutiQuery->count();
            $data['pendingLemburCount'] = $pendingLemburQuery->count();
            $data['pendingReimburseCount'] = $pendingReimburseQuery->count();
            $data['pendingBonusCount'] = $pendingBonusQuery->count();
            $data['pendingInventoryCount'] = $pendingInventoryQuery->count();

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
