<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use App\Helpers\ImageHelper;

class EmployeeController extends Controller
{

    public function index()
    {
        $user = auth('sanctum')->user();
        $query = User::where('role', 'employee');
        if ($user && $user->company && $user->role !== 'director') {
            $query->where('company', $user->company);
        }
        $employees = $query->orderBy('id', 'desc')->get();

        $data = $employees->map(function (User $emp) {
            if (empty($emp->password_plain)) {
                $possiblePasswords = [
                    'password',
                    '123456',
                    '12345678',
                    'admin123',
                    'karyawan123',
                ];
                
                $emailPrefix = explode('@', $emp->email)[0] ?? '';
                if ($emailPrefix) {
                    $possiblePasswords[] = $emailPrefix;
                    $possiblePasswords[] = $emailPrefix . '123';
                }
                $nameClean = str_replace(' ', '', strtolower($emp->name));
                if ($nameClean) {
                    $possiblePasswords[] = $nameClean;
                    $possiblePasswords[] = $nameClean . '123';
                }

                $possiblePasswords = array_unique($possiblePasswords);

                foreach ($possiblePasswords as $possible) {
                    if (Hash::check($possible, $emp->password)) {
                        $emp->password_plain = $possible;
                        $emp->save();
                        break;
                    }
                }
            }

            return [
                'id'              => $emp->id,
                'name'            => $emp->name,
                'email'           => $emp->email,
                'role'            => $emp->role,
                'status'          => $emp->status,
                'photo'           => $emp->photo ? asset('storage/' . $emp->photo) : null,
                'employee_number' => $emp->employee_number,
                'division'        => $emp->division,
                'gender'          => $emp->gender,
                'join_date'       => $emp->join_date,
                'no_rekening'     => $emp->no_rekening,
                'company'         => $emp->company,
                'whatsapp'        => $emp->whatsapp,
                'password_plain'  => $emp->password_plain,
                'saturday_off'    => (bool)$emp->saturday_off,
                'sunday_off'      => (bool)$emp->sunday_off,
                'created_at'      => $emp->created_at,
                'updated_at'      => $emp->updated_at,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data'   => $data
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'            => 'required|string|max:255',
            'email'           => 'required|string|email|max:255|unique:users',
            'password'        => 'required|string|min:6',
            'date_of_birth'   => 'nullable|date',
            'address'         => 'nullable|string|max:500',
            'employee_number' => 'nullable|string|max:50|unique:users,employee_number',
            'join_date'       => 'nullable|date',
            'gender'          => 'nullable|in:male,female',
            'division'        => 'nullable|string|max:100',
            'photo'           => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'cv'              => 'nullable|file|mimes:pdf,doc,docx|max:5120',
            'no_rekening'     => 'nullable|string|max:50',
            'company'         => 'nullable|in:PT Cakrawala Parama Internasional,PT Yasodana Parvez Internasional',
            'whatsapp'        => 'nullable|string|max:30',
            'saturday_off'    => 'nullable',
            'sunday_off'      => 'nullable',
        ], [
            'email.unique'           => 'Email ini sudah digunakan oleh akun lain.',
            'employee_number.unique' => 'Nomor karyawan sudah digunakan oleh karyawan lain.',
            'cv.file'                => 'File CV harus berupa dokumen.',
            'cv.mimes'               => 'Format CV harus berupa PDF, DOC, atau DOCX.',
            'cv.max'                 => 'Ukuran CV maksimal 5MB.',
            'company.in'             => 'Perusahaan tidak valid.',
        ]);

        $data = [
            'name'            => $request->name,
            'email'           => $request->email,
            'password'        => Hash::make($request->password),
            'password_plain'  => $request->password,
            'role'            => 'employee',
            'status'          => 'pending',
            'employee_number' => $request->employee_number,
            'gender'          => $request->gender,
            'division'        => $request->division,
            'date_of_birth'   => $request->date_of_birth,
            'join_date'       => $request->join_date,
            'address'         => $request->address,
            'no_rekening'     => $request->no_rekening,
            'company'         => $request->company,
            'whatsapp'        => $request->whatsapp,
            'saturday_off'    => $request->has('saturday_off') ? filter_var($request->saturday_off, FILTER_VALIDATE_BOOLEAN) : false,
            'sunday_off'      => $request->has('sunday_off') ? filter_var($request->sunday_off, FILTER_VALIDATE_BOOLEAN) : true,
        ];

        if ($request->hasFile('photo')) {
            $path = ImageHelper::compressAndSaveWebp($request->file('photo'), 'photos');
            $data['photo'] = $path;
        }

        if ($request->hasFile('cv')) {
            $path = $request->file('cv')->store('cvs', 'public');
            $data['cv'] = $path;
        }

        $employee = User::create($data);

        return response()->json([
            'status' => 'success',
            'message' => 'Akun karyawan berhasil dibuat dan menunggu persetujuan Direktur.',
            'data' => $employee
        ], 201);
    }

    public function destroy($id)
    {
        $employee = $this->getEmployeeById($id);

        if (!$employee) {
            return response()->json([
                'status' => 'error',
                'message' => 'Karyawan tidak ditemukan.'
            ], 404);
        }

        if ($employee->status === 'pending') {
            $employee->delete();
            return response()->json([
                'status' => 'success',
                'message' => 'Pendaftaran karyawan yang tertunda berhasil dihapus.'
            ]);
        }

        $employee->update(['status' => 'pending_delete']);

        return response()->json([
            'status' => 'success',
            'message' => 'Pengajuan penghapusan karyawan berhasil dikirim ke Direktur.'
        ]);
    }

    public function approveEmployee($id)
    {
        $employee = $this->getEmployeeById($id);
        if (!$employee) {
            return response()->json(['status' => 'error', 'message' => 'Karyawan tidak ditemukan.'], 404);
        }
        $employee->update(['status' => 'active']);
        return response()->json(['status' => 'success', 'message' => 'Karyawan berhasil disetujui.']);
    }

    public function rejectEmployee($id)
    {
        $employee = $this->getEmployeeById($id);
        if (!$employee) {
            return response()->json(['status' => 'error', 'message' => 'Karyawan tidak ditemukan.'], 404);
        }
        $employee->delete();
        return response()->json(['status' => 'success', 'message' => 'Karyawan berhasil ditolak (dihapus).']);
    }

    public function approveDeleteEmployee($id)
    {
        $employee = $this->getEmployeeById($id);
        if (!$employee) {
            return response()->json(['status' => 'error', 'message' => 'Karyawan tidak ditemukan.'], 404);
        }
        $employee->delete();
        return response()->json(['status' => 'success', 'message' => 'Penghapusan karyawan berhasil disetujui.']);
    }

    public function rejectDeleteEmployee($id)
    {
        $employee = $this->getEmployeeById($id);
        if (!$employee) {
            return response()->json(['status' => 'error', 'message' => 'Karyawan tidak ditemukan.'], 404);
        }
        $employee->update(['status' => 'active']);
        return response()->json(['status' => 'success', 'message' => 'Penghapusan karyawan ditolak, status kembali aktif.']);
    }

    public function update(Request $request, $id)
    {
        $employee = $this->getEmployeeById($id);

        if (!$employee) {
            return response()->json([
                'status' => 'error',
                'message' => 'Karyawan tidak ditemukan.'
            ], 404);
        }

        $rules = [
            'name' => 'required|string|max:255',
            'no_rekening' => 'nullable|string|max:50',
            'company' => 'nullable|in:PT Cakrawala Parama Internasional,PT Yasodana Parvez Internasional',
            'whatsapp' => 'nullable|string|max:30',
            'saturday_off' => 'nullable',
            'sunday_off' => 'nullable',
        ];

        if ($request->filled('password')) {
            $rules['password'] = 'string|min:6';
        }

        $request->validate($rules, [
            'password.min' => 'Kata sandi baru minimal harus terdiri dari 6 karakter.',
            'company.in' => 'Perusahaan tidak valid.',
        ]);

        $updateData = [
            'name'        => $request->name,
            'no_rekening' => $request->no_rekening ?: null,
            'company'     => $request->company ?: null,
            'whatsapp'    => $request->whatsapp ?: null,
            'saturday_off' => $request->has('saturday_off') ? filter_var($request->saturday_off, FILTER_VALIDATE_BOOLEAN) : false,
            'sunday_off' => $request->has('sunday_off') ? filter_var($request->sunday_off, FILTER_VALIDATE_BOOLEAN) : true,
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

    /**
     * Admin: Get full profile/biodata of a specific employee
     */
    public function getEmployeeProfile($id)
    {
        $employee = $this->getEmployeeById($id);

        if (!$employee) {
            return response()->json([
                'status' => 'error',
                'message' => 'Karyawan tidak ditemukan.'
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'id'              => $employee->id,
                'name'            => $employee->name,
                'email'           => $employee->email,
                'photo'           => $employee->photo ? asset('storage/' . $employee->photo) : null,
                'date_of_birth'   => $employee->date_of_birth,
                'address'         => $employee->address,
                'employee_number' => $employee->employee_number,
                'join_date'       => $employee->join_date,
                'gender'          => $employee->gender,
                'division'        => $employee->division,
                'cv'              => $employee->cv ? asset('storage/' . $employee->cv) : null,
                'no_rekening'     => $employee->no_rekening,
                'company'         => $employee->company,
                'whatsapp'        => $employee->whatsapp,
                'saturday_off'    => (bool)$employee->saturday_off,
                'sunday_off'      => (bool)$employee->sunday_off,
                'created_at'      => $employee->created_at,
            ]
        ]);
    }

    /**
     * Admin: Update full profile/biodata of a specific employee
     */
    public function updateEmployeeProfile(Request $request, $id)
    {
        $employee = $this->getEmployeeById($id);

        if (!$employee) {
            return response()->json([
                'status' => 'error',
                'message' => 'Karyawan tidak ditemukan.'
            ], 404);
        }

        $request->validate([
            'name'            => 'required|string|max:255',
            'email'           => 'required|email|unique:users,email,' . $id,
            'date_of_birth'   => 'nullable|date',
            'address'         => 'nullable|string|max:500',
            'employee_number' => 'nullable|string|max:50|unique:users,employee_number,' . $id,
            'join_date'       => 'nullable|date',
            'gender'          => 'nullable|in:male,female',
            'division'        => 'nullable|string|max:100',
            'photo'           => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'cv'              => 'nullable|file|mimes:pdf,doc,docx|max:5120',
            'no_rekening'     => 'nullable|string|max:50',
            'company'         => 'nullable|in:PT Cakrawala Parama Internasional,PT Yasodana Parvez Internasional',
            'whatsapp'        => 'nullable|string|max:30',
            'saturday_off'    => 'nullable',
            'sunday_off'      => 'nullable',
        ], [
            'email.unique'           => 'Email ini sudah digunakan oleh akun lain.',
            'employee_number.unique' => 'Nomor karyawan sudah digunakan oleh karyawan lain.',
            'cv.file'                => 'File CV harus berupa dokumen.',
            'cv.mimes'               => 'Format CV harus berupa PDF, DOC, atau DOCX.',
            'cv.max'                 => 'Ukuran CV maksimal 5MB.',
            'company.in'             => 'Perusahaan tidak valid.',
        ]);

        $data = [
            'name'            => $request->name,
            'email'           => $request->email,
            'date_of_birth'   => $request->date_of_birth ?: null,
            'address'         => $request->address ?: null,
            'employee_number' => $request->employee_number ?: null,
            'join_date'       => $request->join_date ?: null,
            'gender'          => $request->gender ?: null,
            'division'        => $request->division ?: null,
            'no_rekening'     => $request->no_rekening ?: null,
            'company'         => $request->company ?: null,
            'whatsapp'        => $request->whatsapp ?: null,
            'saturday_off'    => $request->has('saturday_off') ? filter_var($request->saturday_off, FILTER_VALIDATE_BOOLEAN) : false,
            'sunday_off'      => $request->has('sunday_off') ? filter_var($request->sunday_off, FILTER_VALIDATE_BOOLEAN) : true,
        ];

        $employee->update($data);

        if ($request->hasFile('photo')) {
            if ($employee->photo) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($employee->photo);
            }
            $path = ImageHelper::compressAndSaveWebp($request->file('photo'), 'photos');
            $employee->update(['photo' => $path]);
        }

        if ($request->hasFile('cv')) {
            if ($employee->cv) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($employee->cv);
            }
            $path = $request->file('cv')->store('cvs', 'public');
            $employee->update(['cv' => $path]);
        }

        $employee->refresh();

        return response()->json([
            'status'  => 'success',
            'message' => 'Biodata karyawan berhasil diperbarui.',
            'data'    => [
                'id'              => $employee->id,
                'name'            => $employee->name,
                'email'           => $employee->email,
                'photo'           => $employee->photo ? asset('storage/' . $employee->photo) : null,
                'date_of_birth'   => $employee->date_of_birth,
                'address'         => $employee->address,
                'employee_number' => $employee->employee_number,
                'join_date'       => $employee->join_date,
                'gender'          => $employee->gender,
                'division'        => $employee->division,
                'cv'              => $employee->cv ? asset('storage/' . $employee->cv) : null,
                'no_rekening'     => $employee->no_rekening,
                'company'         => $employee->company,
                'whatsapp'        => $employee->whatsapp,
                'saturday_off'    => (bool)$employee->saturday_off,
                'sunday_off'      => (bool)$employee->sunday_off,
            ]
        ]);
    }

    private function getEmployeeById($id)
    {
        $user = auth('sanctum')->user();
        $query = User::where('id', $id)->where('role', 'employee');
        if ($user && $user->company && $user->role !== 'director') {
            $query->where('company', $user->company);
        }
        return $query->first();
    }

    public function getDirectorsList()
    {
        $directors = User::where('role', 'director')->get(['id', 'name', 'email', 'company', 'whatsapp']);
        return response()->json([
            'status' => 'success',
            'data' => $directors
        ]);
    }
}

