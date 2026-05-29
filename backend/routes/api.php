<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;


use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmployeeController;

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

    // Admin only routes
    Route::middleware('admin')->group(function () {
        Route::get('/employees', [EmployeeController::class, 'index']);
        Route::post('/employees', [EmployeeController::class, 'store']);
        Route::delete('/employees/{id}', [EmployeeController::class, 'destroy']);
    });
});
