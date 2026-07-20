<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SalesVisit;
use App\Models\Attendance;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class SalesVisitController extends Controller
{
    /**
     * Store a new sales visit log.
     */
    public function store(Request $request)
    {
        $request->validate([
            'client_name' => 'required|string|max:255',
            'latitude' => 'required|string',
            'longitude' => 'required|string',
            'photo' => 'required|string', // base64 string
            'notes' => 'nullable|string',
            'visit_type' => 'nullable|string|in:sales,client',
        ]);

        $user = $request->user();
        $today = Carbon::today()->toDateString();
        $visitType = $request->input('visit_type', 'sales');

        try {
            // Save photo
            $photoPath = $this->saveBase64Image($request->photo, 'visit_' . $user->id);
            $visitTime = Carbon::now()->format('H:i:s');

            // Create record
            $visit = SalesVisit::create([
                'user_id' => $user->id,
                'date' => $today,
                'visit_time' => $visitTime,
                'client_name' => $request->client_name,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'photo_path' => $photoPath,
                'notes' => $request->notes,
                'visit_type' => $visitType,
            ]);

            // Sync with attendance log: if this is the first visit of the day, create a Check-In record.
            $existingAttendance = Attendance::where('user_id', $user->id)
                ->where('date', $today)
                ->first();

            if (!$existingAttendance) {
                $attType = ($visitType === 'client') ? 'client' : 'kunjungan';
                $defaultNote = ($visitType === 'client') ? 'Absen Masuk Klien: ' : 'Absen Masuk via Kunjungan: ';
                Attendance::create([
                    'user_id' => $user->id,
                    'date' => $today,
                    'attendance_type' => $attType,
                    'clock_in' => $visitTime,
                    'latitude_in' => $request->latitude,
                    'longitude_in' => $request->longitude,
                    'photo_in' => $photoPath,
                    'notes_in' => $request->notes ?: ($defaultNote . $request->client_name),
                    'status_in' => 'normal',
                    'approval_status' => 'approved',
                ]);
            } else {
                if ($visitType === 'client' && $existingAttendance->attendance_type !== 'client') {
                    $existingAttendance->update([
                        'attendance_type' => 'client',
                        'notes_in' => $request->notes ?: ('Absen Masuk Klien: ' . $request->client_name)
                    ]);
                }
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Kunjungan berhasil dilaporkan!',
                'data' => $visit
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memproses laporan kunjungan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get employee's logged visits for today.
     */
    public function getTodayVisits(Request $request)
    {
        $userId = $request->user()->id;
        $today = Carbon::today()->toDateString();

        $query = SalesVisit::where('user_id', $userId)
            ->where('date', $today);

        // Filter berdasarkan visit_type jika diberikan (sales atau client)
        if ($request->has('visit_type') && in_array($request->visit_type, ['sales', 'client'])) {
            $query->where('visit_type', $request->visit_type);
        }

        $visits = $query->orderBy('visit_time', 'asc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $visits
        ]);
    }

    /**
     * Get all sales visits for admin.
     */
    public function getAllVisits(Request $request)
    {
        $query = SalesVisit::with('user:id,name,email,photo,company');

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('date')) {
            $query->where('date', $request->date);
        }

        $visits = $query->orderBy('date', 'desc')
            ->orderBy('visit_time', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $visits
        ]);
    }

    /**
     * Process checkout for a sales/client visit.
     */
    public function checkout(Request $request, $id)
    {
        $request->validate([
            'latitude' => 'required|string',
            'longitude' => 'required|string',
            'photo' => 'required|string', // base64 string
            'notes' => 'nullable|string',
        ]);

        $user = $request->user();
        $today = Carbon::today()->toDateString();

        try {
            $visit = SalesVisit::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$visit) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Laporan kunjungan tidak ditemukan.'
                ], 404);
            }

            if ($visit->visit_time_out) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Anda sudah melakukan absen keluar dari kunjungan ini.'
                ], 422);
            }

            // Save photo
            $photoPath = $this->saveBase64Image($request->photo, 'visit_out_' . $user->id);
            $visitTimeOut = Carbon::now()->format('H:i:s');

            // Update record
            $visit->update([
                'visit_time_out' => $visitTimeOut,
                'latitude_out' => $request->latitude,
                'longitude_out' => $request->longitude,
                'photo_path_out' => $photoPath,
                'notes_out' => $request->notes,
            ]);

            // Sync with main attendance log: update check-out for today
            $attendance = Attendance::where('user_id', $user->id)
                ->where('date', $today)
                ->first();

            if ($attendance) {
                // Determine checkout status (early departure vs normal vs overtime)
                $now = Carbon::now();
                $isSaturday = $now->isSaturday();
                
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

                if ($visitTimeOut < $limitEarly) {
                    $status = 'early_departure';
                } elseif ($visitTimeOut > $limitOvertime) {
                    $status = 'overtime';
                }

                $attendance->update([
                    'clock_out' => $visitTimeOut,
                    'latitude_out' => $request->latitude,
                    'longitude_out' => $request->longitude,
                    'photo_out' => $photoPath,
                    'notes_out' => $request->notes ?: 'Absen Keluar via Kunjungan: ' . $visit->client_name,
                    'status_out' => $status,
                ]);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Absen keluar kunjungan berhasil dicatat!',
                'data' => $visit
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memproses absen keluar kunjungan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a sales/client visit (for admin).
     */
    public function updateVisit(Request $request, $id)
    {
        $request->validate([
            'client_name' => 'required|string|max:255',
            'date' => 'required|date',
            'visit_time' => 'required|string',
            'visit_time_out' => 'nullable|string',
            'notes' => 'nullable|string',
            'notes_out' => 'nullable|string',
        ]);

        try {
            $visit = SalesVisit::findOrFail($id);
            $oldVisitTime = $visit->visit_time;
            $oldVisitTimeOut = $visit->visit_time_out;

            $visitTime = Carbon::parse($request->visit_time)->format('H:i:s');
            $visitTimeOut = null;
            if ($request->visit_time_out) {
                $visitTimeOut = Carbon::parse($request->visit_time_out)->format('H:i:s');
            }

            $visit->update([
                'client_name' => $request->client_name,
                'date' => Carbon::parse($request->date)->toDateString(),
                'visit_time' => $visitTime,
                'visit_time_out' => $visitTimeOut,
                'notes' => $request->notes,
                'notes_out' => $request->notes_out,
            ]);

            // Sync with attendance log: if there is an attendance record for this user and date
            $attendance = Attendance::where('user_id', $visit->user_id)
                ->where('date', $visit->date)
                ->first();

            if ($attendance) {
                $attUpdate = [];
                // If the old visit_time matches clock_in, update it
                if ($attendance->clock_in === $oldVisitTime) {
                    $attUpdate['clock_in'] = $visitTime;
                }
                // If the old visit_time_out matches clock_out, update it
                if ($oldVisitTimeOut && $attendance->clock_out === $oldVisitTimeOut) {
                    $attUpdate['clock_out'] = $visitTimeOut;
                }
                if (!empty($attUpdate)) {
                    $attendance->update($attUpdate);
                }
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Laporan kunjungan berhasil diperbarui!',
                'data' => $visit
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memperbarui laporan kunjungan: ' . $e->getMessage()
            ], 500);
        }
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
        $filePath = 'visits/' . $fileName;

        // Ensure directories exist
        Storage::disk('public')->makeDirectory('visits');

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
}
