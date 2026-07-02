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
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\DirectorController;
use App\Http\Controllers\PushNotificationController;
use App\Http\Controllers\BackupController;


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
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

Route::get('/payroll/verify/{id}/{hash}', [PayrollController::class, 'verifySlip']);

Route::middleware(['auth:sanctum', 'last_seen'])->group(function () {
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
    Route::get('/holidays/upcoming', [PayrollController::class, 'getUpcomingHolidays']);
    Route::get('/shifts', [AttendanceController::class, 'getShifts']);

    // Public contact info (admin WhatsApp) - accessible by all roles
    Route::get('/admin-contact', function (Request $request) {
        $admin = \App\Models\User::where('role', 'admin')
            ->whereNotNull('whatsapp')
            ->where('status', 'active')
            ->first(['name', 'whatsapp']);
        return response()->json([
            'status' => 'success',
            'data'   => $admin ? ['name' => $admin->name, 'whatsapp' => $admin->whatsapp] : null
        ]);
    });

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
    Route::put('/sales-visits/{id}/checkout', [SalesVisitController::class, 'checkout']);

    // Employee Overtime routes
    Route::get('/overtimes', [OvertimeController::class, 'index']);
    Route::post('/overtimes', [OvertimeController::class, 'store']);
    Route::delete('/overtimes/{id}', [OvertimeController::class, 'destroy']);

    // Admin or Director routes (Read only for Director)
    Route::middleware('admin_or_director')->group(function () {
        Route::get('/admin/employees/backup', [BackupController::class, 'backup']);
        Route::get('/employees', [EmployeeController::class, 'index']);
        Route::get('/employees/{id}/profile', [EmployeeController::class, 'getEmployeeProfile']);
        Route::get('/admin/attendances', [AttendanceController::class, 'getAllAttendances']);
        Route::get('/admin/sales-visits', [SalesVisitController::class, 'getAllVisits']);
        Route::get('/admin/leaves', [LeaveController::class, 'getAllRequests']);
        Route::get('/admin/payroll/configurations', [PayrollController::class, 'indexConfigurations']);
        Route::get('/admin/directors', [EmployeeController::class, 'getDirectorsList']);
        Route::get('/admin/payroll', [PayrollController::class, 'indexPayrolls']);
        Route::get('/admin/inventories', [InventoryController::class, 'index']);
        Route::get('/admin/inventories/{id}', [InventoryController::class, 'show']);
        Route::get('/admin/reimbursements', [ReimbursementController::class, 'indexAdmin']);
        Route::get('/admin/reimbursements/summary', [ReimbursementController::class, 'summaryAdmin']);
        Route::get('/admin/bonuses', [BonusController::class, 'indexAdmin']);
        Route::get('/admin/overtimes', [OvertimeController::class, 'indexAdmin']);
        Route::get('/admin/overtimes/recap', [OvertimeController::class, 'recapAdmin']);
        Route::get('/admin/holidays', [PayrollController::class, 'indexHolidays']);
    });

    // Admin only modifying routes
    Route::middleware('admin')->group(function () {
        Route::post('/employees', [EmployeeController::class, 'store']);
        Route::delete('/employees/{id}', [EmployeeController::class, 'destroy']);
        Route::put('/employees/{id}', [EmployeeController::class, 'update']);
        Route::post('/employees/{id}/profile', [EmployeeController::class, 'updateEmployeeProfile']);
        Route::post('/admin/attendances', [AttendanceController::class, 'storeManualAttendance']);
        Route::put('/admin/attendances/{id}', [AttendanceController::class, 'updateAttendance']);
        Route::put('/admin/office-setting', [AttendanceController::class, 'updateOfficeSetting']);
        
        // Admin Leave routes
        Route::put('/admin/leaves/{id}/approve', [LeaveController::class, 'approve']);
        Route::put('/admin/leaves/{id}/reject', [LeaveController::class, 'reject']);

        // Admin Payroll routes
        Route::post('/admin/payroll/configurations', [PayrollController::class, 'updateConfiguration']);
        Route::post('/admin/payroll/generate', [PayrollController::class, 'generatePayroll']);
        Route::put('/admin/payroll/{id}/update', [PayrollController::class, 'updatePayrollManual']);
        Route::delete('/admin/payroll/{id}', [PayrollController::class, 'destroyPayroll']);
        Route::post('/admin/payroll/{id}/submit-approval', [PayrollController::class, 'submitPayrollApproval']);
        Route::post('/admin/payroll/submit-all-approval', [PayrollController::class, 'submitAllPayrollApproval']);
        Route::post('/admin/holidays', [PayrollController::class, 'storeHoliday']);
        Route::post('/admin/holidays/import', [PayrollController::class, 'importHolidays']);
        Route::delete('/admin/holidays/{id}', [PayrollController::class, 'destroyHoliday']);

        // Admin Inventory routes
        Route::post('/admin/inventories', [InventoryController::class, 'store']);
        Route::post('/admin/inventories/{id}/update', [InventoryController::class, 'update']);
        Route::delete('/admin/inventories/{id}', [InventoryController::class, 'destroy']);

        // Admin Reimbursement routes
        Route::put('/admin/reimbursements/{id}/approve', [ReimbursementController::class, 'approve']);
        Route::put('/admin/reimbursements/{id}/reject', [ReimbursementController::class, 'reject']);

        // Admin Bonus routes
        Route::post('/admin/bonuses', [BonusController::class, 'store']);
        Route::put('/admin/bonuses/{id}', [BonusController::class, 'update']);
        Route::delete('/admin/bonuses/{id}', [BonusController::class, 'destroy']);

        // Admin Overtime routes
        Route::put('/admin/overtimes/{id}/approve', [OvertimeController::class, 'approve']);
        Route::put('/admin/overtimes/{id}/reject', [OvertimeController::class, 'reject']);

        // Admin Shift routes
        Route::post('/admin/shifts', [AttendanceController::class, 'storeShift']);
        Route::put('/admin/shifts/{id}', [AttendanceController::class, 'updateShift']);
        Route::delete('/admin/shifts/{id}', [AttendanceController::class, 'deleteShift']);

        // Admin Backup routes
        Route::get('/admin/backup/export', [BackupController::class, 'exportDatabase']);
        Route::post('/admin/backup/import', [BackupController::class, 'importDatabase']);
    });

    // Director only approval routes
    Route::middleware('director')->group(function () {
        Route::get('/director/dashboard-summary', [DirectorController::class, 'getDashboardSummary']);
        // Employee approvals
        Route::put('/director/employees/{id}/approve', [EmployeeController::class, 'approveEmployee']);
        Route::put('/director/employees/{id}/reject', [EmployeeController::class, 'rejectEmployee']);
        Route::put('/director/employees/{id}/approve-delete', [EmployeeController::class, 'approveDeleteEmployee']);
        Route::put('/director/employees/{id}/reject-delete', [EmployeeController::class, 'rejectDeleteEmployee']);

        // Salary configuration approvals
        Route::post('/director/payroll/configurations', [PayrollController::class, 'updateConfiguration']);
        Route::put('/director/payroll/configurations/{id}/approve', [PayrollController::class, 'approveSalaryConfig']);
        Route::put('/director/payroll/configurations/{id}/reject', [PayrollController::class, 'rejectSalaryConfig']);

        // Payroll approvals
        Route::put('/director/payroll/{id}/approve', [PayrollController::class, 'approvePayroll']);
        Route::put('/director/payroll/{id}/reject', [PayrollController::class, 'rejectPayroll']);
        Route::post('/director/payroll/approve-all', [PayrollController::class, 'approveAllPayroll']);
        Route::post('/director/payroll/reject-all', [PayrollController::class, 'rejectAllPayroll']);
        Route::put('/director/payroll/{id}/pay', [PayrollController::class, 'updatePayrollStatus']);

        // Leave approvals
        Route::put('/director/leaves/{id}/approve', [LeaveController::class, 'directorApprove']);
        Route::put('/director/leaves/{id}/reject', [LeaveController::class, 'directorReject']);

        // Overtime approvals
        Route::put('/director/overtimes/{id}/approve', [OvertimeController::class, 'directorApprove']);
        Route::put('/director/overtimes/{id}/reject', [OvertimeController::class, 'directorReject']);

        // Reimbursement approvals
        Route::put('/director/reimbursements/{id}/approve', [ReimbursementController::class, 'directorApprove']);
        Route::put('/director/reimbursements/{id}/reject', [ReimbursementController::class, 'directorReject']);

        // Bonus approvals
        Route::put('/director/bonuses/{id}/approve', [BonusController::class, 'directorApprove']);
        Route::put('/director/bonuses/{id}/reject', [BonusController::class, 'directorReject']);

        // Attendance corrections approvals
        Route::put('/director/attendances/{id}/approve', [AttendanceController::class, 'directorApprove']);
        Route::put('/director/attendances/{id}/reject', [AttendanceController::class, 'directorReject']);

        // Inventory approvals
        Route::put('/director/inventories/{id}/approve', [InventoryController::class, 'directorApprove']);
        Route::put('/director/inventories/{id}/reject', [InventoryController::class, 'directorReject']);
    });

    // Employee Payroll routes
    Route::get('/payroll/my-slips', [PayrollController::class, 'getEmployeePayrolls']);

    // Sidebar Notification routes
    Route::get('/sidebar/notification-counts', [NotificationController::class, 'getCounts']);

    // Push Notification routes
    Route::post('/push-subscriptions', [PushNotificationController::class, 'subscribe']);
    Route::post('/push-subscriptions/unsubscribe', [PushNotificationController::class, 'unsubscribe']);
    Route::post('/push-subscriptions/test', [PushNotificationController::class, 'sendTestNotification']);
});
