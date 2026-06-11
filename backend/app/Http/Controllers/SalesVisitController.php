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

            // Create record
            $visit = SalesVisit::create([
                'user_id' => $user->id,
                'date' => $today,
                'visit_time' => Carbon::now()->format('H:i:s'),
                'client_name' => $request->client_name,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'photo_path' => $photoPath,
                'notes' => $request->notes,
                'visit_type' => $visitType,
            ]);

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

        $visits = SalesVisit::where('user_id', $userId)
            ->whereDate('date', $today)
            ->orderBy('visit_time', 'asc')
            ->get();

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
        $query = SalesVisit::with('user:id,name,email,photo');

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('date')) {
            $query->whereDate('date', $request->date);
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
        $filePath = 'visits/' . $fileName;

        // Ensure directories exist
        Storage::disk('public')->makeDirectory('visits');

        Storage::disk('public')->put($filePath, $image);

        return '/storage/' . $filePath;
    }
}
