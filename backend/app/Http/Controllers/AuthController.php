<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Kredensial yang diberikan salah atau akun tidak terdaftar.'],
            ]);
        }

        if (isset($user->status) && $user->status === 'pending') {
            throw ValidationException::withMessages([
                'email' => ['Pendaftaran akun Anda masih menunggu persetujuan dari Direktur.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ]
        ]);
    }

    public function logout(Request $request)
    {
        // Delete the current access token
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Berhasil keluar/logout.'
        ]);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6',
        ], [
            'new_password.min' => 'Kata sandi baru minimal harus terdiri dari 6 karakter.'
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Kata sandi saat ini tidak cocok.'
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->new_password),
            'password_plain' => $request->new_password,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Kata sandi Anda berhasil diperbarui.'
        ]);
    }

    public function getProfile(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'status' => 'success',
            'data' => [
                'id'              => $user->id,
                'name'            => $user->name,
                'email'           => $user->email,
                'role'            => $user->role,
                'photo'           => $user->photo ? asset('storage/' . $user->photo) : null,
                'date_of_birth'   => $user->date_of_birth,
                'address'         => $user->address,
                'employee_number' => $user->employee_number,
                'join_date'       => $user->join_date,
                'gender'          => $user->gender,
                'division'        => $user->division,
                'cv'              => $user->cv ? asset('storage/' . $user->cv) : null,
                'no_rekening'     => $user->no_rekening,
                'company'         => $user->company,
            ]
        ]);
    }

    public function updateProfile(Request $request)
    {
        $request->validate([
            'name'            => 'required|string|max:255',
            'email'           => 'required|email|unique:users,email,' . $request->user()->id,
            'date_of_birth'   => 'nullable|date',
            'address'         => 'nullable|string|max:500',
            'employee_number' => 'nullable|string|max:50|unique:users,employee_number,' . $request->user()->id,
            'join_date'       => 'nullable|date',
            'gender'          => 'nullable|in:male,female',
            'division'        => 'nullable|string|max:100',
            'photo'           => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'cv'              => 'nullable|file|mimes:pdf,doc,docx|max:5120',
        ], [
            'email.unique'           => 'Email ini sudah digunakan oleh akun lain.',
            'employee_number.unique' => 'Nomor karyawan sudah digunakan oleh karyawan lain.',
            'photo.image'            => 'File foto harus berupa gambar.',
            'photo.max'              => 'Ukuran foto maksimal 2MB.',
            'cv.file'                => 'File CV harus berupa dokumen.',
            'cv.mimes'               => 'Format CV harus berupa PDF, DOC, atau DOCX.',
            'cv.max'                 => 'Ukuran CV maksimal 5MB.',
        ]);

        $user = $request->user();
        $data = $request->only(['name', 'email', 'date_of_birth', 'address', 'employee_number', 'join_date', 'gender', 'division']);

        // Handle photo upload
        if ($request->hasFile('photo')) {
            // Delete old photo if exists
            if ($user->photo) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($user->photo);
            }
            $path = $request->file('photo')->store('photos', 'public');
            $data['photo'] = $path;
        }

        // Handle CV upload
        if ($request->hasFile('cv')) {
            // Delete old CV if exists
            if ($user->cv) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($user->cv);
            }
            $path = $request->file('cv')->store('cvs', 'public');
            $data['cv'] = $path;
        }

        $user->update($data);

        return response()->json([
            'status'  => 'success',
            'message' => 'Profil berhasil diperbarui.',
            'data'    => [
                'id'              => $user->id,
                'name'            => $user->name,
                'email'           => $user->email,
                'role'            => $user->role,
                'photo'           => $user->photo ? asset('storage/' . $user->photo) : null,
                'date_of_birth'   => $user->date_of_birth,
                'address'         => $user->address,
                'employee_number' => $user->employee_number,
                'join_date'       => $user->join_date,
                'gender'          => $user->gender,
                'division'        => $user->division,
                'cv'              => $user->cv ? asset('storage/' . $user->cv) : null,
            ]
        ]);
    }
}
