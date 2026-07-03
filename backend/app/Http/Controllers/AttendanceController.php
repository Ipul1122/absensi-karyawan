<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Attendance;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
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

        $attendance = Attendance::with('shift')->where('user_id', $userId)
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
            'shift_id' => 'nullable|integer',
        ]);

        $user = $request->user();
        $today = Carbon::today()->toDateString();
        $attendanceType = $request->input('attendance_type', 'kantor');

        // Check office setting radius limit
        $office = \App\Models\OfficeSetting::first();
        if ($office && $attendanceType === 'kantor') {
            $officeLat = $office->latitude;
            $officeLng = $office->longitude;
            $officeRad = $office->radius;
            
            if ($user->office_location === 'bogor') {
                $officeLat = $office->bogor_latitude ?? $office->latitude;
                $officeLng = $office->bogor_longitude ?? $office->longitude;
                $officeRad = $office->bogor_radius ?? $office->radius;
            }
            
            $distance = $this->getDistance(
                floatval($request->latitude),
                floatval($request->longitude),
                floatval($officeLat),
                floatval($officeLng)
            );
            
            if ($distance > $officeRad) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Gagal melakukan absen masuk! Anda berada di luar radius lokasi kantor yang diizinkan (Jarak Anda: ' . round($distance) . ' meter, Radius maksimal: ' . $officeRad . ' meter).'
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
            // - Before or equal to 09:00: normal (Normal)
            // - After 09:00: late (Terlambat)
            $shiftId = $request->shift_id;
            $shift = $shiftId ? \App\Models\Shift::find($shiftId) : null;

            $status = 'normal';
            $limitIn = '08:30:00';
            $shiftStart = null;
            $shiftEnd = null;

            if ($shift) {
                $shiftStart = $shift->start_time;
                $shiftEnd = $shift->end_time;
                $limitIn = Carbon::parse($shift->start_time)->addMinutes($shift->grace_period)->format('H:i:s');
            }

            if ($timeStr > $limitIn) {
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
                    'approval_status' => 'approved',
                    'shift_id' => $shiftId,
                    'shift_start_time' => $shiftStart,
                    'shift_end_time' => $shiftEnd,
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
                    'approval_status' => 'approved',
                    'shift_id' => $shiftId,
                    'shift_start_time' => $shiftStart,
                    'shift_end_time' => $shiftEnd,
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
            $officeLat = $office->latitude;
            $officeLng = $office->longitude;
            $officeRad = $office->radius;
            
            if ($user->office_location === 'bogor') {
                $officeLat = $office->bogor_latitude ?? $office->latitude;
                $officeLng = $office->bogor_longitude ?? $office->longitude;
                $officeRad = $office->bogor_radius ?? $office->radius;
            }
            
            $distance = $this->getDistance(
                floatval($request->latitude),
                floatval($request->longitude),
                floatval($officeLat),
                floatval($officeLng)
            );
            
            if ($distance > $officeRad) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Gagal melakukan absen keluar! Anda berada di luar radius lokasi kantor yang diizinkan (Jarak Anda: ' . round($distance) . ' meter, Radius maksimal: ' . $officeRad . ' meter).'
                ], 422);
            }
        }

        try {
            // Save webcam image
            $photoPath = $this->saveBase64Image($request->photo, 'checkout_' . $user->id);

            // Determine status based on server time
            $now = Carbon::now();
            $timeStr = $now->format('H:i:s');
            $isSaturday = $now->isSaturday();
            
            // Rules:
            // - Saturday:
            //   - Before 14:00: early_departure (Pulang Cepat)
            //   - 14:00 - 15:00: normal (Normal)
            //   - After 15:00: overtime (Lembur)
            // - Other days:
            //   - Before 17:30: early_departure (Pulang Cepat)
            //   - 17:30 - 18:30: normal (Normal)
            //   - After 18:30: overtime (Lembur)
            $limitEarly = $isSaturday ? '14:00:00' : '17:30:00';
            $limitOvertime = $isSaturday ? '15:00:00' : '18:30:00';

            $status = 'normal';
            if ($attendance->shift_end_time) {
                $limitEarly = $attendance->shift_end_time;
                $limitOvertime = Carbon::parse($attendance->shift_end_time)->addHour()->format('H:i:s');
            } else {
                $limitEarly = $isSaturday ? '14:00:00' : '17:30:00';
                $limitOvertime = $isSaturday ? '15:00:00' : '18:30:00';
            }

            if ($timeStr < $limitEarly) {
                $status = 'early_departure';
            } elseif ($timeStr > $limitOvertime) {
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
        $query = Attendance::where('user_id', $userId);

        // Filter by specific date if provided
        if ($request->filled('date')) {
            $query->where('date', $request->date);
        }
        // Filter by specific month and year if provided
        elseif ($request->filled('month') && $request->filled('year')) {
            $query->whereMonth('date', $request->month)
                  ->whereYear('date', $request->year);
        }

        $query->orderBy('date', 'desc');

        // If page parameter is present, return server-side paginated results
        if ($request->has('page')) {
            $limit = $request->input('limit', 10);
            $paginated = $query->paginate($limit);

            return response()->json([
                'status' => 'success',
                'data' => $paginated->items(),
                'pagination' => [
                    'current_page' => $paginated->currentPage(),
                    'last_page' => $paginated->lastPage(),
                    'per_page' => $paginated->perPage(),
                    'total' => $paginated->total(),
                ]
            ]);
        }

        // Default: return recent 30 records for dashboard stats compatibility
        $history = $query->with('shift')->limit(30)->get();

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
        $user = auth('sanctum')->user();
        $query = Attendance::with(['user:id,name,email,photo,role,join_date,employee_number,division,company', 'shift']);
        
        if ($user && $user->role !== 'director' && $user->role !== 'admin' && $user->company) {
            $query->whereHas('user', function ($q) use ($user) {
                $q->where('company', $user->company);
            });
        }
        
        $attendances = $query->orderBy('date', 'desc')
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
            'clock_in' => 'required_without:clock_out|nullable|string',
            'clock_out' => 'required_without:clock_in|nullable|string',
            'notes' => 'nullable|string',
            'latitude' => 'nullable|string',
            'longitude' => 'nullable|string',
            'photo' => 'nullable|string',
        ]);

        $userId = $request->user_id;
        $date = Carbon::parse($request->date)->toDateString();

        // Check if employee is active
        $user = \App\Models\User::findOrFail($userId);
        if ($user->status !== 'active') {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak dapat membuat absensi untuk karyawan yang belum aktif atau belum disetujui oleh Direktur!'
            ], 422);
        }

        // Check if attendance already exists for this employee on this date
        $existing = Attendance::where('user_id', $userId)
            ->where('date', $date)
            ->first();

        // Calculate status_in
        $clockIn = null;
        $statusIn = null;
        if ($request->filled('clock_in')) {
            $clockIn = Carbon::parse($request->clock_in)->format('H:i:s');
            $statusIn = 'normal';
            if ($clockIn > '08:30:00') {
                $statusIn = ($request->attendance_type === 'kantor') ? 'late' : 'normal';
            }
        }

        // Calculate status_out
        $clockOut = null;
        $statusOut = null;
        if ($request->filled('clock_out')) {
            $clockOut = Carbon::parse($request->clock_out)->format('H:i:s');
            $isSaturday = Carbon::parse($date)->isSaturday();
            $limitEarly = $isSaturday ? '14:00:00' : '17:30:00';
            $limitOvertime = $isSaturday ? '15:00:00' : '18:30:00';

            $statusOut = 'normal';
            if ($clockOut < $limitEarly) {
                $statusOut = 'early_departure';
            } elseif ($clockOut > $limitOvertime) {
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

        if ($existing) {
            // Update existing record
            $updateData = [
                'attendance_type' => $request->attendance_type,
                'approval_status' => 'approved',
            ];

            if ($clockIn) {
                $updateData['clock_in'] = $clockIn;
                $updateData['status_in'] = $statusIn;
                $updateData['notes_in'] = $notesText;
                $updateData['latitude_in'] = $latitude;
                $updateData['longitude_in'] = $longitude;
                if ($request->photo) {
                    $updateData['photo_in'] = $photoPath;
                }
            }

            if ($clockOut) {
                $updateData['clock_out'] = $clockOut;
                $updateData['status_out'] = $statusOut;
                $updateData['notes_out'] = $notesText;
                $updateData['latitude_out'] = $latitude;
                $updateData['longitude_out'] = $longitude;
                if ($request->photo) {
                    $updateData['photo_out'] = $photoPath;
                }
            }

            $existing->update($updateData);
            $attendance = $existing;
            $msg = 'Absensi manual karyawan berhasil diperbarui!';
        } else {
            // Create new record
            $insertData = [
                'user_id' => $userId,
                'date' => $date,
                'attendance_type' => $request->attendance_type,
                'approval_status' => 'approved',
            ];

            if ($clockIn) {
                $insertData['clock_in'] = $clockIn;
                $insertData['status_in'] = $statusIn;
                $insertData['notes_in'] = $notesText;
                $insertData['latitude_in'] = $latitude;
                $insertData['longitude_in'] = $longitude;
                $insertData['photo_in'] = $photoPath;
            }

            if ($clockOut) {
                $insertData['clock_out'] = $clockOut;
                $insertData['status_out'] = $statusOut;
                $insertData['notes_out'] = $notesText;
                $insertData['latitude_out'] = $latitude;
                $insertData['longitude_out'] = $longitude;
                $insertData['photo_out'] = $photoPath;
            }

            $attendance = Attendance::create($insertData);
            $msg = 'Absensi manual karyawan berhasil dibuat!';
        }

        if ($request->attendance_type === 'kunjungan' || $request->attendance_type === 'client') {
            $clientName = $request->attendance_type === 'client' ? 'Kunjungan Klien Pertama' : 'Kunjungan Lapangan Pertama';
            if ($request->notes) {
                $clientName = $request->notes;
            }
            
            $visitType = $request->attendance_type === 'client' ? 'client' : 'sales';
            
            // Check if there is already a visit log for this date, user, and type
            $existingVisit = \App\Models\SalesVisit::where('user_id', $userId)
                ->where('date', $date)
                ->where('visit_type', $visitType)
                ->first();

            if ($existingVisit) {
                $visitData = [];
                if ($clockIn) {
                    $visitData['visit_time'] = $clockIn;
                    $visitData['client_name'] = $clientName;
                    $visitData['latitude'] = $latitude;
                    $visitData['longitude'] = $longitude;
                    if ($photoPath) {
                        $visitData['photo_path'] = $photoPath;
                    }
                    $visitData['notes'] = $notesText;
                }
                if ($clockOut) {
                    $visitData['visit_time_out'] = $clockOut;
                    $visitData['latitude_out'] = $latitude;
                    $visitData['longitude_out'] = $longitude;
                    if ($photoPath) {
                        $visitData['photo_path_out'] = $photoPath;
                    }
                    $visitData['notes_out'] = $notesText;
                }
                $existingVisit->update($visitData);
            } else {
                $visitData = [
                    'user_id' => $userId,
                    'date' => $date,
                    'visit_type' => $visitType,
                ];

                if ($clockIn) {
                    $visitData['visit_time'] = $clockIn;
                    $visitData['client_name'] = $clientName;
                    $visitData['latitude'] = $latitude;
                    $visitData['longitude'] = $longitude;
                    $visitData['photo_path'] = $photoPath ?: '';
                    $visitData['notes'] = $notesText;
                } else {
                    $visitData['visit_time'] = $clockOut ?: '08:00:00';
                    $visitData['client_name'] = $clientName;
                    $visitData['latitude'] = $latitude;
                    $visitData['longitude'] = $longitude;
                    $visitData['photo_path'] = $photoPath ?: '';
                    $visitData['notes'] = $notesText;
                }

                if ($clockOut) {
                    $visitData['visit_time_out'] = $clockOut;
                    $visitData['latitude_out'] = $latitude;
                    $visitData['longitude_out'] = $longitude;
                    $visitData['photo_path_out'] = $photoPath;
                    $visitData['notes_out'] = $notesText;
                }

                \App\Models\SalesVisit::create($visitData);
            }
        }

        // Load the relationship for response format consistency
        $attendance->load('user:id,name,email');

        return response()->json([
            'status' => 'success',
            'message' => $msg,
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
            $limitIn = $attendance->shift_start_time ?: '09:00:00';
            if ($clockIn > $limitIn) {
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
            if ($attendance->shift_end_time) {
                $limitEarly = $attendance->shift_end_time;
                $limitOvertime = Carbon::parse($attendance->shift_end_time)->addHour()->format('H:i:s');
            } else {
                $isSaturday = Carbon::parse($attendance->date)->isSaturday();
                $limitEarly = $isSaturday ? '14:00:00' : '17:00:00';
                $limitOvertime = $isSaturday ? '15:00:00' : '18:00:00';
            }

            $statusOut = 'normal';
            if ($clockOut < $limitEarly) {
                $statusOut = 'early_departure';
            } elseif ($clockOut > $limitOvertime) {
                $statusOut = 'overtime';
            }
            $attendance->clock_out = $clockOut;
            $attendance->status_out = $statusOut;
        } else {
            $attendance->clock_out = null;
            $attendance->status_out = null;
        }

        $attendance->approval_status = 'approved';
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
        $user = $request->user();
        
        if ($office && $user && $user->role === 'employee' && $user->office_location === 'bogor') {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'id' => $office->id,
                    'latitude' => $office->bogor_latitude ?? $office->latitude,
                    'longitude' => $office->bogor_longitude ?? $office->longitude,
                    'radius' => $office->bogor_radius ?? $office->radius,
                    'bogor_latitude' => $office->bogor_latitude,
                    'bogor_longitude' => $office->bogor_longitude,
                    'bogor_radius' => $office->bogor_radius,
                ]
            ]);
        }
        
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
            'bogor_latitude' => 'required|string',
            'bogor_longitude' => 'required|string',
            'bogor_radius' => 'required|integer|min:1',
        ]);

        $office = \App\Models\OfficeSetting::first();
        if (!$office) {
            $office = new \App\Models\OfficeSetting();
        }

        $office->latitude = $request->latitude;
        $office->longitude = $request->longitude;
        $office->radius = $request->radius;
        $office->bogor_latitude = $request->bogor_latitude;
        $office->bogor_longitude = $request->bogor_longitude;
        $office->bogor_radius = $request->bogor_radius;
        $office->save();

        Cache::forget('office_setting');

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

        if ($attendance->approval_status !== 'pending') {
            return response()->json([
                'status' => 'error',
                'message' => 'Koreksi absensi ini sudah diproses sebelumnya.'
            ], 422);
        }

        $attendance->update(['approval_status' => 'approved']);
        return response()->json(['status' => 'success', 'message' => 'Koreksi absensi berhasil disetujui.']);
    }

    public function directorReject($id)
    {
        $attendance = Attendance::findOrFail($id);

        if ($attendance->approval_status !== 'pending') {
            return response()->json([
                'status' => 'error',
                'message' => 'Koreksi absensi ini sudah diproses sebelumnya.'
            ], 422);
        }

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

            $imageBytes = base64_decode($imageData);

            if ($imageBytes === false) {
                throw new \Exception('Gagal mendecode base64.');
            }
        } else {
            throw new \Exception('Format data URI gambar tidak sesuai.');
        }

        // Tentukan ekstensi dan nama file default (webp jika menggunakan kompresi)
        $useWebp = extension_loaded('gd');
        $extension = $useWebp ? 'webp' : $type;
        $fileName = $prefix . '_' . time() . '_' . uniqid() . '.' . $extension;
        $filePath = 'attendances/' . $fileName;

        // Ensure directories exist
        Storage::disk('public')->makeDirectory('attendances');

        if ($useWebp) {
            try {
                // Buat GD image object dari raw bytes
                $srcImage = imagecreatefromstring($imageBytes);
                if ($srcImage !== false) {
                    $origWidth = imagesx($srcImage);
                    $origHeight = imagesy($srcImage);

                    // Tentukan ukuran baru (maksimal lebar 800px)
                    $maxWidth = 800;
                    $webpData = false;

                    if ($origWidth > $maxWidth) {
                        $newWidth = $maxWidth;
                        $newHeight = (int) (($origHeight / $origWidth) * $maxWidth);

                        // Buat canvas baru
                        $dstImage = imagecreatetruecolor($newWidth, $newHeight);

                        // Tangani transparansi untuk PNG/GIF
                        imagealphablending($dstImage, false);
                        imagesavealpha($dstImage, true);
                        
                        // Lakukan resize
                        imagecopyresampled($dstImage, $srcImage, 0, 0, 0, 0, $newWidth, $newHeight, $origWidth, $origHeight);
                        
                        // Siapkan output buffer untuk menangkap raw webp bytes
                        ob_start();
                        imagewebp($dstImage, null, 75); // kualitas 75%
                        $webpData = ob_get_clean();
                    } else {
                        // Tidak perlu resize, langsung kompres ke WebP
                        ob_start();
                        imagewebp($srcImage, null, 75);
                        $webpData = ob_get_clean();
                    }

                    if ($webpData !== false) {
                        $imageBytes = $webpData;
                    }
                }
            } catch (\Throwable $e) {
                // Fallback ke data asli jika ada error pemrosesan GD
            }
        }

        Storage::disk('public')->put($filePath, $imageBytes);

        return '/storage/' . $filePath;
    }

    /**
     * Get list of all shifts.
     */
    public function getShifts()
    {
        return response()->json([
            'status' => 'success',
            'data' => \App\Models\Shift::orderBy('start_time', 'asc')->get()
        ]);
    }

    /**
     * Store a new shift (Admin only).
     */
    public function storeShift(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'start_time' => 'required|string',
            'end_time' => 'required|string',
            'grace_period' => 'required|integer|min:0'
        ]);

        $shift = \App\Models\Shift::create([
            'name' => $request->name,
            'start_time' => Carbon::parse($request->start_time)->format('H:i:s'),
            'end_time' => Carbon::parse($request->end_time)->format('H:i:s'),
            'grace_period' => $request->grace_period
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Shift berhasil dibuat',
            'data' => $shift
        ]);
    }

    /**
     * Update an existing shift (Admin only).
     */
    public function updateShift(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string',
            'start_time' => 'required|string',
            'end_time' => 'required|string',
            'grace_period' => 'required|integer|min:0'
        ]);

        $shift = \App\Models\Shift::findOrFail($id);
        $shift->update([
            'name' => $request->name,
            'start_time' => Carbon::parse($request->start_time)->format('H:i:s'),
            'end_time' => Carbon::parse($request->end_time)->format('H:i:s'),
            'grace_period' => $request->grace_period
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Shift berhasil diubah',
            'data' => $shift
        ]);
    }

    /**
     * Delete a shift (Admin only).
     */
    public function deleteShift($id)
    {
        $shift = \App\Models\Shift::findOrFail($id);
        
        // Prevent deletion if in use? Better to just set onDelete cascade/set null, which we did.
        $shift->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Shift berhasil dihapus'
        ]);
    }
}
