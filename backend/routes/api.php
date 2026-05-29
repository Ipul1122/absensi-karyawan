<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;


use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\AttendanceController;

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

    // Admin only routes
    Route::middleware('admin')->group(function () {
        Route::get('/employees', [EmployeeController::class, 'index']);
        Route::post('/employees', [EmployeeController::class, 'store']);
        Route::delete('/employees/{id}', [EmployeeController::class, 'destroy']);
        Route::get('/admin/attendances', [AttendanceController::class, 'getAllAttendances']);
        Route::put('/admin/attendances/{id}', [AttendanceController::class, 'updateAttendance']);
        Route::put('/admin/office-setting', [AttendanceController::class, 'updateOfficeSetting']);
    });
});
