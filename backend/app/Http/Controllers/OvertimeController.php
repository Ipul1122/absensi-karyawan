<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Overtime;
use Carbon\Carbon;

class OvertimeController extends Controller
{
    /**
     * Display a listing of overtime requests for the logged-in employee.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Overtime::where('user_id', $user->id);

        // Filter by status
        if ($request->has('status') && $request->status != 'all') {
            if ($request->status === 'pending') {
                $query->whereIn('status', ['pending', 'pending_director']);
            } else {
                $query->where('status', $request->status);
            }
        }

        // Filter by month (YYYY-MM)
        if ($request->has('month') && !empty($request->month)) {
            $query->where('date', 'like', $request->month . '%');
        }

        // Sort by date and time
        $query->orderBy('date', 'desc')->orderBy('created_at', 'desc');

        // Pagination
        $perPage = $request->input('per_page', 10);
        $overtimes = $query->paginate($perPage);

        // Recap summary stats for the active month (or current month if not specified)
        $activeMonth = $request->input('month', now()->format('Y-m'));

        $totalApprovedHoursThisMonth = Overtime::where('user_id', $user->id)
            ->where('status', 'approved')
            ->where('date', 'like', $activeMonth . '%')
            ->sum('duration');

        $pendingCount = Overtime::where('user_id', $user->id)
            ->whereIn('status', ['pending', 'pending_director'])
            ->count();

        $approvedCount = Overtime::where('user_id', $user->id)
            ->where('status', 'approved')
            ->count();

        $rejectedCount = Overtime::where('user_id', $user->id)
            ->where('status', 'rejected')
            ->count();

        return response()->json([
            'status' => 'success',
            'data' => $overtimes->items(),
            'pagination' => [
                'total' => $overtimes->total(),
                'per_page' => $overtimes->perPage(),
                'current_page' => $overtimes->currentPage(),
                'last_page' => $overtimes->lastPage(),
            ],
            'summary' => [
                'active_month' => $activeMonth,
                'total_approved_hours_this_month' => round($totalApprovedHoursThisMonth, 2),
                'pending_count' => $pendingCount,
                'approved_count' => $approvedCount,
                'rejected_count' => $rejectedCount
            ]
        ]);
    }

    /**
     * Store a newly created overtime request.
     */
    public function store(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'start_time' => 'required|string', // Format e.g., "17:30"
            'end_time' => 'required|string',   // Format e.g., "20:00"
            'reason' => 'required|string|max:1000',
        ]);

        try {
            $start = Carbon::parse($request->start_time);
            $end = Carbon::parse($request->end_time);
            
            // Check if end time is before start time, indicating it crosses midnight
            if ($end->lt($start)) {
                $end->addDay();
            }

            $durationMinutes = $start->diffInMinutes($end);
            $duration = round($durationMinutes / 60, 2);

            if ($duration <= 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Durasi lembur harus lebih besar dari 0 menit.'
                ], 422);
            }

            $overtime = Overtime::create([
                'user_id' => $request->user()->id,
                'date' => $request->date,
                'start_time' => $request->start_time,
                'end_time' => $request->end_time,
                'duration' => $duration,
                'reason' => $request->reason,
                'status' => 'pending',
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Pengajuan lembur berhasil dikirim.',
                'data' => $overtime
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengirim pengajuan lembur: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel/delete a pending overtime request.
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $overtime = Overtime::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        if ($overtime->status !== 'pending') {
            return response()->json([
                'status' => 'error',
                'message' => 'Pengajuan lembur yang sudah diproses tidak dapat dibatalkan.'
            ], 400);
        }

        try {
            $overtime->delete();
            return response()->json([
                'status' => 'success',
                'message' => 'Pengajuan lembur berhasil dibatalkan.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal membatalkan pengajuan lembur: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display all overtime requests for Admin dashboard.
     */
    public function indexAdmin(Request $request)
    {
        $query = Overtime::with('user:id,name,email');

        // Search by employee name or email
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->has('status') && $request->status != 'all') {
            $query->where('status', $request->status);
        }

        // Filter by month
        if ($request->has('month') && !empty($request->month)) {
            $query->where('date', 'like', $request->month . '%');
        }

        $query->orderBy('date', 'desc')->orderBy('created_at', 'desc');

        $perPage = $request->input('per_page', 10);
        $overtimes = $query->paginate($perPage);

        // Summary stats for Admin KPI Cards
        $activeMonth = $request->input('month', now()->format('Y-m'));

        $totalApprovedHoursThisMonth = Overtime::where('status', 'approved')
            ->where('date', 'like', $activeMonth . '%')
            ->sum('duration');

        $pendingCount = Overtime::where('status', 'pending')->count();
        $pendingDirectorCount = Overtime::where('status', 'pending_director')->count();
        $approvedCount = Overtime::where('status', 'approved')->count();
        $rejectedCount = Overtime::where('status', 'rejected')->count();

        return response()->json([
            'status' => 'success',
            'data' => $overtimes->items(),
            'pagination' => [
                'total' => $overtimes->total(),
                'per_page' => $overtimes->perPage(),
                'current_page' => $overtimes->currentPage(),
                'last_page' => $overtimes->lastPage(),
            ],
            'summary' => [
                'active_month' => $activeMonth,
                'total_approved_hours_this_month' => round($totalApprovedHoursThisMonth, 2),
                'pending_count' => $pendingCount,
                'pending_director_count' => $pendingDirectorCount,
                'approved_count' => $approvedCount,
                'rejected_count' => $rejectedCount
            ]
        ]);
    }

    /**
     * Get a consolidated recap of approved hours per employee.
     */
    public function recapAdmin(Request $request)
    {
        $activeMonth = $request->input('month', now()->format('Y-m'));

        // Fetch all employees
        $users = \App\Models\User::where('role', 'employee')->get();

        $recap = $users->map(function ($user) use ($activeMonth) {
            $approvedHours = Overtime::where('user_id', $user->id)
                ->where('status', 'approved')
                ->where('date', 'like', $activeMonth . '%')
                ->sum('duration');

            $pendingHours = Overtime::where('user_id', $user->id)
                ->whereIn('status', ['pending', 'pending_director'])
                ->where('date', 'like', $activeMonth . '%')
                ->sum('duration');

            $requestCount = Overtime::where('user_id', $user->id)
                ->where('date', 'like', $activeMonth . '%')
                ->count();

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'approved_hours' => round($approvedHours, 2),
                'pending_hours' => round($pendingHours, 2),
                'request_count' => $requestCount
            ];
        });

        return response()->json([
            'status' => 'success',
            'month' => $activeMonth,
            'data' => $recap
        ]);
    }

    /**
     * Verify an overtime request (Admin).
     */
    public function approve(Request $request, $id)
    {
        $overtime = Overtime::findOrFail($id);

        if ($overtime->status !== 'pending') {
            return response()->json([
                'status' => 'error',
                'message' => 'Pengajuan lembur ini sudah diproses sebelumnya.'
            ], 400);
        }

        try {
            $overtime->update([
                'status' => 'pending_director',
                'admin_notes' => $request->input('admin_notes', 'Diverifikasi oleh Admin.')
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Pengajuan lembur berhasil diverifikasi Admin. Menunggu persetujuan akhir Direktur.',
                'data' => $overtime
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memverifikasi pengajuan lembur: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject an overtime request (Admin).
     */
    public function reject(Request $request, $id)
    {
        $overtime = Overtime::findOrFail($id);

        if ($overtime->status !== 'pending') {
            return response()->json([
                'status' => 'error',
                'message' => 'Pengajuan lembur ini sudah diproses sebelumnya.'
            ], 400);
        }

        $request->validate([
            'admin_notes' => 'required|string|max:1000'
        ], [
            'admin_notes.required' => 'Alasan penolakan wajib diisi.'
        ]);

        try {
            $overtime->update([
                'status' => 'rejected',
                'admin_notes' => $request->admin_notes
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Pengajuan lembur berhasil ditolak oleh Admin.',
                'data' => $overtime
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menolak pengajuan lembur: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve an overtime request (Director).
     */
    public function directorApprove(Request $request, $id)
    {
        $overtime = Overtime::findOrFail($id);

        if ($overtime->status !== 'pending_director') {
            return response()->json([
                'status' => 'error',
                'message' => 'Pengajuan lembur ini belum diverifikasi oleh Admin atau sudah diproses sebelumnya.'
            ], 400);
        }

        try {
            $overtime->update([
                'status' => 'approved',
                'admin_notes' => $request->input('admin_notes', 'Disetujui oleh Direktur.')
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Pengajuan lembur berhasil disetujui oleh Direktur.',
                'data' => $overtime
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menyetujui pengajuan lembur: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject an overtime request (Director).
     */
    public function directorReject(Request $request, $id)
    {
        $overtime = Overtime::findOrFail($id);

        if ($overtime->status !== 'pending_director') {
            return response()->json([
                'status' => 'error',
                'message' => 'Pengajuan lembur ini belum diverifikasi oleh Admin atau sudah diproses sebelumnya.'
            ], 400);
        }

        $request->validate([
            'admin_notes' => 'required|string|max:1000'
        ], [
            'admin_notes.required' => 'Alasan penolakan wajib diisi.'
        ]);

        try {
            $overtime->update([
                'status' => 'rejected',
                'admin_notes' => $request->admin_notes
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Pengajuan lembur berhasil ditolak oleh Direktur.',
                'data' => $overtime
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menolak pengajuan lembur: ' . $e->getMessage()
            ], 500);
        }
    }
}
