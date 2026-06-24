<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use App\Mail\ResetPasswordMail;
use Carbon\Carbon;

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
                'id'      => $user->id,
                'name'    => $user->name,
                'email'   => $user->email,
                'role'    => $user->role,
                'company' => $user->company,
                'photo'   => $user->photo ? asset('storage/' . $user->photo) : null,
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
                'whatsapp'        => $user->whatsapp,
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
            'no_rekening'     => 'nullable|string|max:50',
            'whatsapp'        => 'nullable|string|max:30',
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
        $data = $request->only(['name', 'email', 'date_of_birth', 'address', 'employee_number', 'join_date', 'gender', 'division', 'no_rekening', 'whatsapp', 'company']);

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
                'no_rekening'     => $user->no_rekening,
                'company'         => $user->company,
                'whatsapp'        => $user->whatsapp,
            ]
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Alamat email tidak terdaftar di sistem kami.'
            ], 404);
        }

        // Generate 6 digit random OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Store or update OTP in password_reset_tokens table
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            [
                'token' => $otp,
                'created_at' => Carbon::now()
            ]
        );

        try {
            Mail::to($request->email)->send(new ResetPasswordMail($otp));
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengirim email OTP: ' . $e->getMessage()
            ], 500);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Kode OTP berhasil dikirim ke email Anda.'
        ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string|size:6',
            'password' => 'required|string|min:6',
        ], [
            'otp.size' => 'Kode OTP harus terdiri dari 6 karakter.',
            'password.min' => 'Kata sandi baru minimal harus terdiri dari 6 karakter.'
        ]);

        $reset = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('token', $request->otp)
            ->first();

        if (!$reset) {
            return response()->json([
                'status' => 'error',
                'message' => 'Kode OTP salah atau tidak cocok.'
            ], 400);
        }

        // Check if OTP has expired (15 minutes expiration)
        $createdAt = Carbon::parse($reset->created_at);
        if ($createdAt->addMinutes(15)->isPast()) {
            // Delete expired OTP
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json([
                'status' => 'error',
                'message' => 'Kode OTP telah kedaluwarsa. Silakan ajukan ulang.'
            ], 400);
        }

        // Update password in users table
        $user = User::where('email', $request->email)->first();
        if ($user) {
            $user->update([
                'password' => Hash::make($request->password)
            ]);

            // Delete verified OTP token
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Kata sandi Anda berhasil diatur ulang. Silakan masuk kembali.'
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Karyawan tidak ditemukan.'
        ], 404);
    }
}
