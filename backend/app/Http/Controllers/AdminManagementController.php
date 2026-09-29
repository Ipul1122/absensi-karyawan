<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Helpers\ImageHelper;
use Illuminate\Validation\Rule;

class AdminManagementController extends Controller
{
    /**
     * Get list of all Admin HR accounts.
     * Accessible by Admin and Director.
     */
    public function index(Request $request)
    {
        $admins = User::where('role', 'admin')
            ->orderBy('id', 'desc')
            ->get();

        $data = $admins->map(function ($admin) {
            return [
                'id'              => $admin->id,
                'name'            => $admin->name,
                'email'           => $admin->email,
                'role'            => $admin->role,
                'status'          => $admin->status ?? 'active',
                'photo'           => $admin->photo ? asset('storage/' . $admin->photo) : null,
                'whatsapp'        => $admin->whatsapp,
                'company'         => $admin->company,
                'division'        => $admin->division ?? 'Human Resources',
                'office_location' => $admin->office_location ?? 'jakarta',
                'password_plain'  => $admin->password_plain,
                'employee_number' => $admin->employee_number,
                'created_at'      => $admin->created_at,
                'last_seen_at'    => $admin->last_seen_at,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data'   => $data
        ]);
    }

    /**
     * Create a new Admin HR account.
     * Restricted to Director only.
     */
    public function store(Request $request)
    {
        if ($request->user() && $request->user()->role !== 'director') {
            return response()->json([
                'status'  => 'error',
                'message' => 'Hanya Direktur yang memiliki izin untuk mendaftarkan akun Admin HR baru.'
            ], 403);
        }

        $request->validate([
            'name'            => 'required|string|max:255',
            'email'           => 'required|string|email|max:255|unique:users,email',
            'password'        => 'required|string|min:6',
            'whatsapp'        => 'nullable|string|max:30',
            'company'         => 'nullable|in:PT Cakrawala Parama Internasional,PT Yasodana Parvez Internasional',
            'division'        => 'nullable|string|max:100',
            'office_location' => 'nullable|in:jakarta,bogor',
            'photo'           => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ], [
            'email.unique' => 'Email ini sudah digunakan oleh akun lain.',
            'password.min' => 'Kata sandi minimal harus terdiri dari 6 karakter.',
            'company.in'   => 'Perusahaan tidak valid.',
        ]);

        $data = [
            'name'            => $request->name,
            'email'           => $request->email,
            'password'        => Hash::make($request->password),
            'password_plain'  => $request->password,
            'role'            => 'admin',
            'status'          => 'active',
            'whatsapp'        => $request->whatsapp,
            'company'         => $request->company,
            'division'        => $request->division ?: 'Human Resources',
            'office_location' => $request->office_location ?: 'jakarta',
            'saturday_off'    => false,
            'sunday_off'      => true,
        ];

        if ($request->hasFile('photo')) {
            $data['photo'] = ImageHelper::compressAndSaveWebp($request->file('photo'), 'photos');
        }

        $admin = User::create($data);

        return response()->json([
            'status'  => 'success',
            'message' => 'Akun Admin HR baru berhasil dibuat.',
            'data'    => [
                'id'              => $admin->id,
                'name'            => $admin->name,
                'email'           => $admin->email,
                'role'            => $admin->role,
                'status'          => $admin->status,
                'photo'           => $admin->photo ? asset('storage/' . $admin->photo) : null,
                'whatsapp'        => $admin->whatsapp,
                'company'         => $admin->company,
                'division'        => $admin->division,
                'office_location' => $admin->office_location,
                'password_plain'  => $admin->password_plain,
                'created_at'      => $admin->created_at,
            ]
        ], 201);
    }

    /**
     * Update an Admin HR account.
     * Restricted to Director only.
     */
    public function update(Request $request, int|string $id)
    {
        $admin = User::where('id', $id)->where('role', 'admin')->first();

        if (!$admin) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Akun Admin HR tidak ditemukan.'
            ], 404);
        }

        $rules = [
            'name'            => 'required|string|max:255',
            'email'           => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($admin->id)],
            'whatsapp'        => 'nullable|string|max:30',
            'company'         => 'nullable|in:PT Cakrawala Parama Internasional,PT Yasodana Parvez Internasional',
            'division'        => 'nullable|string|max:100',
            'office_location' => 'nullable|in:jakarta,bogor',
            'status'          => 'nullable|in:active,inactive',
            'photo'           => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ];

        if ($request->filled('password')) {
            $rules['password'] = 'string|min:6';
        }

        $request->validate($rules, [
            'email.unique' => 'Email ini sudah digunakan oleh akun lain.',
            'password.min' => 'Kata sandi baru minimal harus terdiri dari 6 karakter.',
            'company.in'   => 'Perusahaan tidak valid.',
        ]);

        $updateData = [
            'name'            => $request->name,
            'email'           => $request->email,
            'whatsapp'        => $request->whatsapp,
            'company'         => $request->company,
            'division'        => $request->division ?: 'Human Resources',
            'office_location' => $request->office_location ?: 'jakarta',
        ];

        if ($request->filled('status')) {
            $updateData['status'] = $request->status;
        }

        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
            $updateData['password_plain'] = $request->password;
        }

        if ($request->hasFile('photo')) {
            $updateData['photo'] = ImageHelper::compressAndSaveWebp($request->file('photo'), 'photos');
        }

        $admin->update($updateData);

        return response()->json([
            'status'  => 'success',
            'message' => 'Data Akun Admin HR berhasil diperbarui.',
            'data'    => [
                'id'              => $admin->id,
                'name'            => $admin->name,
                'email'           => $admin->email,
                'role'            => $admin->role,
                'status'          => $admin->status,
                'photo'           => $admin->photo ? asset('storage/' . $admin->photo) : null,
                'whatsapp'        => $admin->whatsapp,
                'company'         => $admin->company,
                'division'        => $admin->division,
                'office_location' => $admin->office_location,
                'password_plain'  => $admin->password_plain,
                'created_at'      => $admin->created_at,
            ]
        ]);
    }

    /**
     * Delete an Admin HR account.
     * Restricted to Director only.
     */
    public function destroy(Request $request, int|string $id)
    {
        $admin = User::where('id', $id)->where('role', 'admin')->first();

        if (!$admin) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Akun Admin HR tidak ditemukan.'
            ], 404);
        }

        // Safety check: Don't allow deleting the last remaining active admin
        $activeAdminCount = User::where('role', 'admin')->where('status', 'active')->count();
        if ($activeAdminCount <= 1 && $admin->status === 'active') {
            return response()->json([
                'status'  => 'error',
                'message' => 'Tidak dapat menghapus Admin HR terakhir yang aktif. Sistem membutuhkan minimal satu Admin HR aktif.'
            ], 422);
        }

        $admin->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Akun Admin HR berhasil dihapus.'
        ]);
    }
}
