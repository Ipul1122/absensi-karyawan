<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class EmployeeController extends Controller
{
    public function index()
    {
        $employees = User::where('role', 'employee')->orderBy('id', 'desc')->get();
        
        return response()->json([
            'status' => 'success',
            'data' => $employees
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
        ]);

        $employee = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'password_plain' => $request->password,
            'role' => 'employee',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Akun karyawan berhasil dibuat.',
            'data' => $employee
        ], 201);
    }

    public function destroy($id)
    {
        $employee = User::where('id', $id)->where('role', 'employee')->first();

        if (!$employee) {
            return response()->json([
                'status' => 'error',
                'message' => 'Karyawan tidak ditemukan.'
            ], 404);
        }

        $employee->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Akun karyawan berhasil dihapus.'
        ]);
    }

    public function update(Request $request, $id)
    {
        $employee = User::where('id', $id)->where('role', 'employee')->first();

        if (!$employee) {
            return response()->json([
                'status' => 'error',
                'message' => 'Karyawan tidak ditemukan.'
            ], 404);
        }

        $rules = [
            'name' => 'required|string|max:255',
        ];

        if ($request->filled('password')) {
            $rules['password'] = 'string|min:6';
        }

        $request->validate($rules, [
            'password.min' => 'Kata sandi baru minimal harus terdiri dari 6 karakter.'
        ]);

        $updateData = [
            'name' => $request->name,
        ];

        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
            $updateData['password_plain'] = $request->password;
        }

        $employee->update($updateData);

        return response()->json([
            'status' => 'success',
            'message' => 'Akun karyawan berhasil diperbarui.',
            'data' => $employee
        ]);
    }
}
