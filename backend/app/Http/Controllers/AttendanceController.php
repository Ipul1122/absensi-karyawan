<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Attendance;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    /**
     * Get employee's attendance status for today.
     */
    public function getTodayAttendance(Request $request)
    {
        $userId = $request->user()->id;
        $today = Carbon::today()->toDateString();

        $attendance = Attendance::where('user_id', $userId)
            ->where('date', $today)
            ->first();

        return response()->json([
            'status' => 'success',
            'data' => $attendance
        ]);
    }

    /**
     * Process clock-in request.
     */
    public function checkIn(Request $request)
    {
        $request->validate([
            'latitude' => 'required|string',
            'longitude' => 'required|string',
            'photo' => 'required|string', // base64 string
            'notes' => 'nullable|string',
            'attendance_type' => 'nullable|string|in:kantor,kunjungan,client',
        ]);

        $user = $request->user();
        $today = Carbon::today()->toDateString();
        $attendanceType = $request->input('attendance_type', 'kantor');

        // Check office setting radius limit
        $office = \App\Models\OfficeSetting::first();
        if ($office && $attendanceType === 'kantor') {
            $distance = $this->getDistance(
                floatval($request->latitude),
                floatval($request->longitude),
                floatval($office->latitude),
                floatval($office->longitude)
            );
            
            if ($distance > $office->radius) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Gagal melakukan absen masuk! Anda berada di luar radius lokasi kantor yang diizinkan (Jarak Anda: ' . round($distance) . ' meter, Radius maksimal: ' . $office->radius . ' meter).'
                ], 422);
            }
        }

        // Check if already checked in today
        $existing = Attendance::where('user_id', $user->id)
            ->where('date', $today)
            ->first();

        if ($existing && $existing->clock_in) {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda sudah melakukan absen masuk (check-in) hari ini.'
            ], 422);
        }

        try {
            // Save webcam image
            $photoPath = $this->saveBase64Image($request->photo, 'checkin_' . $user->id);

            // Determine status based on server time
            $now = Carbon::now();
            $timeStr = $now->format('H:i:s');
            
            // Rules:
            // - Before 08:30: early (Datang Lebih Awal)
            // - 08:30 - 09:00: normal (Normal)
            // - After 09:00: late (Terlambat)
            $status = 'normal';
            if ($timeStr < '08:30:00') {
                $status = 'early';
            } elseif ($timeStr > '09:00:00') {
                $status = ($attendanceType === 'kantor') ? 'late' : 'normal';
            }

            if ($existing) {
                // Record already exists but clock_in is null (should be rare)
                $existing->update([
                    'attendance_type' => $attendanceType,
                    'clock_in' => $timeStr,
                    'latitude_in' => $request->latitude,
                    'longitude_in' => $request->longitude,
                    'photo_in' => $photoPath,
                    'notes_in' => $request->notes,
                    'status_in' => $status,
                ]);
                $attendance = $existing;
            } else {
                $attendance = Attendance::create([
                    'user_id' => $user->id,
                    'date' => $today,
                    'attendance_type' => $attendanceType,
                    'clock_in' => $timeStr,
                    'latitude_in' => $request->latitude,
                    'longitude_in' => $request->longitude,
                    'photo_in' => $photoPath,
                    'notes_in' => $request->notes,
                    'status_in' => $status,
                ]);
            }

            if ($attendanceType === 'kunjungan' || $attendanceType === 'client') {
                $clientName = $attendanceType === 'client' ? 'Kunjungan Klien Pertama' : 'Kunjungan Lapangan Pertama';
                if ($request->notes) {
                    $clientName = $request->notes;
                }
                \App\Models\SalesVisit::create([
                    'user_id' => $user->id,
                    'date' => $today,
                    'visit_time' => $timeStr,
                    'client_name' => $clientName,
                    'latitude' => $request->latitude,
                    'longitude' => $request->longitude,
                    'photo_path' => $photoPath,
                    'notes' => 'Absen Masuk Pertama Kali (' . ($attendanceType === 'client' ? 'Kunjungan Klien' : 'Kunjungan Lapangan') . ')',
                    'visit_type' => $attendanceType === 'client' ? 'client' : 'sales',
                ]);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Absen masuk berhasil dicatat!',
                'data' => $attendance
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memproses absen masuk: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process clock-out request.
     */
    public function checkOut(Request $request)
    {
        $request->validate([
            'latitude' => 'required|string',
            'longitude' => 'required|string',
            'photo' => 'required|string', // base64 string
            'notes' => 'nullable|string',
        ]);

        $user = $request->user();
        $today = Carbon::today()->toDateString();

        // Check check-in existence
        $attendance = Attendance::where('user_id', $user->id)
            ->where('date', $today)
            ->first();

        if (!$attendance || !$attendance->clock_in) {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda belum melakukan absen masuk (check-in) hari ini.'
            ], 422);
        }

        if ($attendance->clock_out) {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda sudah melakukan absen keluar (check-out) hari ini.'
            ], 422);
        }

        // Check office setting radius limit (only if attendance was kantor type)
        $office = \App\Models\OfficeSetting::first();
        if ($office && $attendance->attendance_type === 'kantor') {
            $distance = $this->getDistance(
                floatval($request->latitude),
                floatval($request->longitude),
                floatval($office->latitude),
                floatval($office->longitude)
            );
            
            if ($distance > $office->radius) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Gagal melakukan absen keluar! Anda berada di luar radius lokasi kantor yang diizinkan (Jarak Anda: ' . round($distance) . ' meter, Radius maksimal: ' . $office->radius . ' meter).'
                ], 422);
            }
        }

        try {
            // Save webcam image
            $photoPath = $this->saveBase64Image($request->photo, 'checkout_' . $user->id);

            // Determine status based on server time
            $now = Carbon::now();
            $timeStr = $now->format('H:i:s');
            
            // Rules:
            // - Before 17:00: early_departure (Pulang Cepat)
            // - 17:00 - 18:00: normal (Normal)
            // - After 18:00: overtime (Lembur)
            $status = 'normal';
            if ($timeStr < '17:00:00') {
                $status = 'early_departure';
            } elseif ($timeStr > '18:00:00') {
                $status = 'overtime';
            }

            $attendance->update([
                'clock_out' => $timeStr,
                'latitude_out' => $request->latitude,
                'longitude_out' => $request->longitude,
                'photo_out' => $photoPath,
                'notes_out' => $request->notes,
                'status_out' => $status,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Absen keluar berhasil dicatat!',
                'data' => $attendance
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memproses absen keluar: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get attendance history for the logged-in employee.
     */
    public function getHistory(Request $request)
    {
        $userId = $request->user()->id;

        $history = Attendance::where('user_id', $userId)
            ->orderBy('date', 'desc')
            ->limit(30)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $history
        ]);
    }

    /**
     * Get all attendances for admin.
     */
    public function getAllAttendances(Request $request)
    {
        $attendances = Attendance::with('user:id,name,email,photo')
            ->orderBy('date', 'desc')
            ->orderBy('clock_in', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $attendances
        ]);
    }

    /**
     * Store manual attendance record for an employee (for admin).
     */
    public function storeManualAttendance(Request $request)
    {
        $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'date' => 'required|date',
            'attendance_type' => 'required|string|in:kantor,kunjungan,client',
            'clock_in' => 'required|string',
            'clock_out' => 'nullable|string',
            'notes' => 'nullable|string',
            'latitude' => 'nullable|string',
            'longitude' => 'nullable|string',
            'photo' => 'nullable|string',
        ]);

        $userId = $request->user_id;
        $date = Carbon::parse($request->date)->toDateString();

        // Check if attendance already exists for this employee on this date
        $existing = Attendance::where('user_id', $userId)
            ->where('date', $date)
            ->first();

        if ($existing) {
            return response()->json([
                'status' => 'error',
                'message' => 'Catatan absensi untuk karyawan tersebut pada tanggal yang dipilih sudah ada!'
            ], 422);
        }

        // Calculate status_in
        $clockIn = Carbon::parse($request->clock_in)->format('H:i:s');
        $statusIn = 'normal';
        if ($clockIn < '08:30:00') {
            $statusIn = 'early';
        } elseif ($clockIn > '09:00:00') {
            $statusIn = ($request->attendance_type === 'kantor') ? 'late' : 'normal';
        }

        // Calculate status_out
        $clockOut = null;
        $statusOut = null;
        if ($request->clock_out) {
            $clockOut = Carbon::parse($request->clock_out)->format('H:i:s');
            $statusOut = 'normal';
            if ($clockOut < '17:00:00') {
                $statusOut = 'early_departure';
            } elseif ($clockOut > '18:00:00') {
                $statusOut = 'overtime';
            }
        }

        $notesText = $request->notes ?: 'Absen manual diinput oleh Admin';
        $latitude = $request->input('latitude') ?: '-6.1942189';
        $longitude = $request->input('longitude') ?: '106.815998';

        // Save photo if uploaded
        $photoPath = null;
        if ($request->photo) {
            try {
                $photoPath = $this->saveBase64Image($request->photo, 'manual_checkin_' . $userId);
            } catch (\Exception $e) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Gagal menyimpan foto: ' . $e->getMessage()
                ], 422);
            }
        }

        $attendance = Attendance::create([
            'user_id' => $userId,
            'date' => $date,
            'attendance_type' => $request->attendance_type,
            'clock_in' => $clockIn,
            'status_in' => $statusIn,
            'notes_in' => $notesText,
            'latitude_in' => $latitude,
            'longitude_in' => $longitude,
            'photo_in' => $photoPath,
            'clock_out' => $clockOut,
            'status_out' => $statusOut,
            'notes_out' => $clockOut ? $notesText : null,
            'latitude_out' => $clockOut ? $latitude : null,
            'longitude_out' => $clockOut ? $longitude : null,
            'photo_out' => $clockOut ? $photoPath : null,
            'approval_status' => 'pending',
        ]);

        if ($request->attendance_type === 'kunjungan' || $request->attendance_type === 'client') {
            $clientName = $request->attendance_type === 'client' ? 'Kunjungan Klien Pertama' : 'Kunjungan Lapangan Pertama';
            if ($request->notes) {
                $clientName = $request->notes;
            }
            \App\Models\SalesVisit::create([
                'user_id' => $userId,
                'date' => $date,
                'visit_time' => $clockIn,
                'client_name' => $clientName,
                'latitude' => $latitude,
                'longitude' => $longitude,
                'photo_path' => $photoPath ?: '',
                'notes' => 'Absen Masuk Manual oleh Admin',
                'visit_type' => $request->attendance_type === 'client' ? 'client' : 'sales',
            ]);
        }

        // Load the relationship for response format consistency
        $attendance->load('user:id,name,email');

        return response()->json([
            'status' => 'success',
            'message' => 'Absensi manual karyawan berhasil dibuat!',
            'data' => $attendance
        ]);
    }

    /**
     * Update employee's attendance record (for admin).
     */
    public function updateAttendance(Request $request, $id)
    {
        $request->validate([
            'clock_in' => 'nullable|string',
            'clock_out' => 'nullable|string',
        ]);

        $attendance = Attendance::findOrFail($id);

        $clockIn = $request->clock_in;
        $clockOut = $request->clock_out;

        if ($clockIn) {
            $clockIn = Carbon::parse($clockIn)->format('H:i:s');
            $statusIn = 'normal';
            if ($clockIn < '08:30:00') {
                $statusIn = 'early';
            } elseif ($clockIn > '09:00:00') {
                $statusIn = ($attendance->attendance_type === 'kantor') ? 'late' : 'normal';
            }
            $attendance->clock_in = $clockIn;
            $attendance->status_in = $statusIn;
        } else {
            $attendance->clock_in = null;
            $attendance->status_in = null;
        }

        if ($clockOut) {
            $clockOut = Carbon::parse($clockOut)->format('H:i:s');
            $statusOut = 'normal';
            if ($clockOut < '17:00:00') {
                $statusOut = 'early_departure';
            } elseif ($clockOut > '18:00:00') {
                $statusOut = 'overtime';
            }
            $attendance->clock_out = $clockOut;
            $attendance->status_out = $statusOut;
        } else {
            $attendance->clock_out = null;
            $attendance->status_out = null;
        }

        $attendance->approval_status = 'pending';
        $attendance->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Absensi berhasil diperbarui!',
            'data' => $attendance
        ]);
    }

    /**
     * Get the current office setting coordinates and radius limit.
     */
    public function getOfficeSetting(Request $request)
    {
        $office = \App\Models\OfficeSetting::first();
        return response()->json([
            'status' => 'success',
            'data' => $office
        ]);
    }

    /**
     * Update the office setting coordinates and radius limit.
     */
    public function updateOfficeSetting(Request $request)
    {
        $request->validate([
            'latitude' => 'required|string',
            'longitude' => 'required|string',
            'radius' => 'required|integer|min:1',
        ]);

        $office = \App\Models\OfficeSetting::first();
        if (!$office) {
            $office = new \App\Models\OfficeSetting();
        }

        $office->latitude = $request->latitude;
        $office->longitude = $request->longitude;
        $office->radius = $request->radius;
        $office->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Pengaturan lokasi absensi kantor berhasil disimpan!',
            'data' => $office
        ]);
    }

    /**
     * Helper to calculate distance between two coordinates using Haversine formula (in meters).
     */
    private function getDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371000; // Earth's radius in meters
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat/2) * sin($dLat/2) + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon/2) * sin($dLon/2);
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        return $earthRadius * $c;
    }

    public function directorApprove($id)
    {
        $attendance = Attendance::findOrFail($id);
        $attendance->update(['approval_status' => 'approved']);
        return response()->json(['status' => 'success', 'message' => 'Koreksi absensi berhasil disetujui.']);
    }

    public function directorReject($id)
    {
        $attendance = Attendance::findOrFail($id);
        $attendance->update(['approval_status' => 'rejected']);
        return response()->json(['status' => 'success', 'message' => 'Koreksi absensi ditolak.']);
    }

    /**
     * Helper to decode and save base64 image.
     */
    private function saveBase64Image($base64String, $prefix)
    {
        if (preg_match('/^data:image\/(\w+);base64,/', $base64String, $type)) {
            $imageData = substr($base64String, strpos($base64String, ',') + 1);
            $type = strtolower($type[1]); // jpg, png, etc.

            if (!in_array($type, ['jpg', 'jpeg', 'gif', 'png', 'webp'])) {
                throw new \Exception('Tipe gambar tidak valid.');
            }

            $image = base64_decode($imageData);

            if ($image === false) {
                throw new \Exception('Gagal mendecode base64.');
            }
        } else {
            throw new \Exception('Format data URI gambar tidak sesuai.');
        }

        $fileName = $prefix . '_' . time() . '_' . uniqid() . '.' . $type;
        $filePath = 'attendances/' . $fileName;

        // Ensure directories exist
        Storage::disk('public')->makeDirectory('attendances');

        Storage::disk('public')->put($filePath, $image);

        return '/storage/' . $filePath;
    }
}
