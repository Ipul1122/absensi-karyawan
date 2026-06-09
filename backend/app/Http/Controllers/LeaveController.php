<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\LeaveRequest;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class LeaveController extends Controller
{
    /**
     * Get all leave requests for the logged-in employee.
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;
        $leaves = LeaveRequest::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $leaves
        ]);
    }

    /**
     * Store a new leave request.
     */
    public function store(Request $request)
    {
        $request->validate([
            'category' => 'required|string',
            'custom_category' => 'required_if:category,LAINNYA|nullable|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // max 5MB
        ]);

        $user = $request->user();

        $imagePath = null;
        if ($request->hasFile('image')) {
            try {
                $file = $request->file('image');
                $filename = 'leave_' . $user->id . '_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->storeAs('leaves', $filename, 'public');
                $imagePath = '/storage/leaves/' . $filename;
            } catch (\Exception $e) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Gagal mengunggah gambar bukti: ' . $e->getMessage()
                ], 500);
            }
        }

        try {
            $leave = LeaveRequest::create([
                'user_id' => $user->id,
                'category' => $request->category,
                'custom_category' => $request->category === 'LAINNYA' ? $request->custom_category : null,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'reason' => $request->reason,
                'image' => $imagePath,
                'status' => 'pending',
                'admin_notes' => null,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Pengajuan cuti berhasil dikirim dan menunggu persetujuan Admin.',
                'data' => $leave
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menyimpan pengajuan cuti: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete/Cancel a pending leave request.
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $leave = LeaveRequest::where('user_id', $user->id)->where('id', $id)->firstOrFail();

        if ($leave->status !== 'pending') {
            return response()->json([
                'status' => 'error',
                'message' => 'Pengajuan cuti yang sudah diproses tidak dapat dibatalkan.'
            ], 422);
        }

        try {
            // Delete image from storage if exists
            if ($leave->image) {
                $storagePath = str_replace('/storage/', '', $leave->image);
                Storage::disk('public')->delete($storagePath);
            }

            $leave->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Pengajuan cuti berhasil dibatalkan.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal membatalkan pengajuan cuti: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all leave requests for admin.
     */
    public function getAllRequests(Request $request)
    {
        $leaves = LeaveRequest::with('user:id,name,email')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $leaves
        ]);
    }

    /**
     * Verify a leave request (Admin).
     */
    public function approve(Request $request, $id)
    {
        $request->validate([
            'admin_notes' => 'nullable|string',
        ]);

        $leave = LeaveRequest::findOrFail($id);

        if ($leave->status !== 'pending') {
            return response()->json([
                'status' => 'error',
                'message' => 'Pengajuan cuti ini sudah diproses sebelumnya.'
            ], 422);
        }

        try {
            $leave->update([
                'status' => 'pending_director',
                'admin_notes' => $request->admin_notes,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Pengajuan cuti berhasil diverifikasi Admin. Menunggu persetujuan akhir Direktur.',
                'data' => $leave
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memverifikasi pengajuan cuti: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject a leave request (Admin).
     */
    public function reject(Request $request, $id)
    {
        $request->validate([
            'admin_notes' => 'nullable|string',
        ]);

        $leave = LeaveRequest::findOrFail($id);

        if ($leave->status !== 'pending') {
            return response()->json([
                'status' => 'error',
                'message' => 'Pengajuan cuti ini sudah diproses sebelumnya.'
            ], 422);
        }

        try {
            $leave->update([
                'status' => 'rejected',
                'admin_notes' => $request->admin_notes,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Pengajuan cuti berhasil ditolak oleh Admin.',
                'data' => $leave
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menolak pengajuan cuti: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve a leave request (Director).
     */
    public function directorApprove(Request $request, $id)
    {
        $request->validate([
            'admin_notes' => 'nullable|string',
        ]);

        $leave = LeaveRequest::findOrFail($id);

        try {
            $leave->update([
                'status' => 'approved',
                'admin_notes' => $request->admin_notes ?: $leave->admin_notes,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Pengajuan cuti berhasil disetujui oleh Direktur.',
                'data' => $leave
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menyetujui pengajuan cuti: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject a leave request (Director).
     */
    public function directorReject(Request $request, $id)
    {
        $request->validate([
            'admin_notes' => 'nullable|string',
        ]);

        $leave = LeaveRequest::findOrFail($id);

        try {
            $leave->update([
                'status' => 'rejected',
                'admin_notes' => $request->admin_notes ?: $leave->admin_notes,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Pengajuan cuti berhasil ditolak oleh Direktur.',
                'data' => $leave
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menolak pengajuan cuti: ' . $e->getMessage()
            ], 500);
        }
    }
}
