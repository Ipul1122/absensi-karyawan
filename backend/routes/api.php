<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;


use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\LeaveController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\ReimbursementController;
use App\Http\Controllers\BonusController;
use App\Http\Controllers\SalesVisitController;
use App\Http\Controllers\OvertimeController;

Route::get('/health-check', function () {
    try {
        DB::connection()->getPdo();
        $dbStatus = 'Connected';
        $dbName = DB::connection()->getDatabaseName();
    } catch (\Exception $e) {
        $dbStatus = 'Disconnected';
        $dbName = 'absen_karyawan';
    }

    return response()->json([
        'status' => 'success',
        'message' => 'Backend Laravel API terhubung dengan sukses!',
        'database' => $dbStatus,
        'database_name' => $dbName
    ]);
});

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/user/change-password', [AuthController::class, 'changePassword']);
    Route::get('/user/profile', [AuthController::class, 'getProfile']);
    Route::post('/user/profile', [AuthController::class, 'updateProfile']);
    Route::get('/user', function (Request $request) {
        return response()->json([
            'status' => 'success',
            'user' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'role' => $request->user()->role,
            ]
        ]);
    });

    // Attendance routes for employee
    Route::get('/attendance/today', [AttendanceController::class, 'getTodayAttendance']);
    Route::post('/attendance/check-in', [AttendanceController::class, 'checkIn']);
    Route::post('/attendance/check-out', [AttendanceController::class, 'checkOut']);
    Route::get('/attendance/history', [AttendanceController::class, 'getHistory']);
    Route::get('/office-setting', [AttendanceController::class, 'getOfficeSetting']);

    // Leave routes for employee
    Route::get('/leaves', [LeaveController::class, 'index']);
    Route::post('/leaves', [LeaveController::class, 'store']);
    Route::delete('/leaves/{id}', [LeaveController::class, 'destroy']);

    // Employee Reimbursement routes
    Route::get('/reimbursements', [ReimbursementController::class, 'index']);
    Route::post('/reimbursements', [ReimbursementController::class, 'store']);
    Route::delete('/reimbursements/{id}', [ReimbursementController::class, 'destroy']);

    // Employee Bonus routes
    Route::get('/bonuses', [BonusController::class, 'index']);

    // Employee Sales Visit routes
    Route::post('/sales-visits', [SalesVisitController::class, 'store']);
    Route::get('/sales-visits/today', [SalesVisitController::class, 'getTodayVisits']);

    // Employee Overtime routes
    Route::get('/overtimes', [OvertimeController::class, 'index']);
    Route::post('/overtimes', [OvertimeController::class, 'store']);
    Route::delete('/overtimes/{id}', [OvertimeController::class, 'destroy']);

    // Admin only routes
    Route::middleware('admin')->group(function () {
        Route::get('/employees', [EmployeeController::class, 'index']);
        Route::post('/employees', [EmployeeController::class, 'store']);
        Route::delete('/employees/{id}', [EmployeeController::class, 'destroy']);
        Route::put('/employees/{id}', [EmployeeController::class, 'update']);
        Route::get('/employees/{id}/profile', [EmployeeController::class, 'getEmployeeProfile']);
        Route::post('/employees/{id}/profile', [EmployeeController::class, 'updateEmployeeProfile']);
        Route::get('/admin/attendances', [AttendanceController::class, 'getAllAttendances']);
        Route::get('/admin/sales-visits', [SalesVisitController::class, 'getAllVisits']);
        Route::post('/admin/attendances', [AttendanceController::class, 'storeManualAttendance']);
        Route::put('/admin/attendances/{id}', [AttendanceController::class, 'updateAttendance']);
        Route::put('/admin/office-setting', [AttendanceController::class, 'updateOfficeSetting']);
        
        // Admin Leave routes
        Route::get('/admin/leaves', [LeaveController::class, 'getAllRequests']);
        Route::put('/admin/leaves/{id}/approve', [LeaveController::class, 'approve']);
        Route::put('/admin/leaves/{id}/reject', [LeaveController::class, 'reject']);

        // Admin Payroll routes
        Route::get('/admin/payroll/configurations', [PayrollController::class, 'indexConfigurations']);
        Route::post('/admin/payroll/configurations', [PayrollController::class, 'updateConfiguration']);
        Route::get('/admin/payroll', [PayrollController::class, 'indexPayrolls']);
        Route::post('/admin/payroll/generate', [PayrollController::class, 'generatePayroll']);
        Route::put('/admin/payroll/{id}/pay', [PayrollController::class, 'updatePayrollStatus']);
        Route::put('/admin/payroll/{id}/update', [PayrollController::class, 'updatePayrollManual']);
        Route::delete('/admin/payroll/{id}', [PayrollController::class, 'destroyPayroll']);

        // Admin Inventory routes
        Route::get('/admin/inventories', [InventoryController::class, 'index']);
        Route::post('/admin/inventories', [InventoryController::class, 'store']);
        Route::get('/admin/inventories/{id}', [InventoryController::class, 'show']);
        Route::post('/admin/inventories/{id}/update', [InventoryController::class, 'update']);
        Route::delete('/admin/inventories/{id}', [InventoryController::class, 'destroy']);

        // Admin Reimbursement routes
        Route::get('/admin/reimbursements', [ReimbursementController::class, 'indexAdmin']);
        Route::get('/admin/reimbursements/summary', [ReimbursementController::class, 'summaryAdmin']);
        Route::put('/admin/reimbursements/{id}/approve', [ReimbursementController::class, 'approve']);
        Route::put('/admin/reimbursements/{id}/reject', [ReimbursementController::class, 'reject']);

        // Admin Bonus routes
        Route::get('/admin/bonuses', [BonusController::class, 'indexAdmin']);
        Route::post('/admin/bonuses', [BonusController::class, 'store']);
        Route::put('/admin/bonuses/{id}', [BonusController::class, 'update']);
        Route::delete('/admin/bonuses/{id}', [BonusController::class, 'destroy']);

        // Admin Overtime routes
        Route::get('/admin/overtimes', [OvertimeController::class, 'indexAdmin']);
        Route::get('/admin/overtimes/recap', [OvertimeController::class, 'recapAdmin']);
        Route::put('/admin/overtimes/{id}/approve', [OvertimeController::class, 'approve']);
        Route::put('/admin/overtimes/{id}/reject', [OvertimeController::class, 'reject']);
    });

    // Employee Payroll routes
    Route::get('/payroll/my-slips', [PayrollController::class, 'getEmployeePayrolls']);
});
