<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PermitRequest;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class PermitController extends Controller
{
    /**
     * Get all permit requests for the logged-in employee.
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;
        $permits = PermitRequest::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $permits
        ]);
    }

    /**
     * Store a new permit request.
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
                $filename = 'permit_' . $user->id . '_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->storeAs('permits', $filename, 'public');
                $imagePath = '/storage/permits/' . $filename;
            } catch (\Exception $e) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Gagal mengunggah gambar bukti: ' . $e->getMessage()
                ], 500);
            }
        }

        try {
            $status = ($user->role === 'admin') ? 'pending_director' : 'pending';
            $message = ($user->role === 'admin') 
                ? 'Pengajuan izin pribadi Admin berhasil dikirim dan diteruskan ke Direktur.' 
                : 'Pengajuan izin berhasil dikirim dan menunggu persetujuan Admin.';

            $permit = PermitRequest::create([
                'user_id' => $user->id,
                'category' => $request->category,
                'custom_category' => $request->category === 'LAINNYA' ? $request->custom_category : null,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'reason' => $request->reason,
                'image' => $imagePath,
                'status' => $status,
                'admin_notes' => ($user->role === 'admin') ? 'Pengajuan oleh Admin sendiri' : null,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => $message,
                'data' => $permit
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menyimpan pengajuan izin: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete/Cancel a pending permit request.
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role === 'admin' || $user->role === 'director') {
            $permit = PermitRequest::findOrFail($id);
        } else {
            $permit = PermitRequest::where('user_id', $user->id)->where('id', $id)->firstOrFail();
            if ($permit->status !== 'pending') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Pengajuan izin yang sudah diproses tidak dapat dibatalkan.'
                ], 422);
            }
        }

        try {
            $permit->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Pengajuan izin berhasil dibatalkan.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal membatalkan pengajuan izin: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all permit requests for admin.
     */
    public function getAllRequests(Request $request)
    {
        $user = auth('sanctum')->user();
        $query = PermitRequest::with('user:id,name,email,company');
        
        if ($user && $user->role !== 'director' && $user->role !== 'admin' && $user->company) {
            $query->whereHas('user', function ($q) use ($user) {
                $q->where('company', $user->company);
            });
        }
        
        $permits = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $permits
        ]);
    }

    /**
     * Verify a permit request (Admin).
     */
    public function approve(Request $request, $id)
    {
        $request->validate([
            'admin_notes' => 'nullable|string',
        ]);

        $permit = PermitRequest::findOrFail($id);

        try {
            $permit->update([
                'status' => 'pending_director',
                'admin_notes' => $request->admin_notes,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Pengajuan izin berhasil diverifikasi Admin. Menunggu persetujuan akhir Direktur.',
                'data' => $permit
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memverifikasi pengajuan izin: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject a permit request (Admin).
     */
    public function reject(Request $request, $id)
    {
        $request->validate([
            'admin_notes' => 'nullable|string',
        ]);

        $permit = PermitRequest::findOrFail($id);

        try {
            $permit->update([
                'status' => 'rejected',
                'admin_notes' => $request->admin_notes,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Pengajuan izin berhasil ditolak oleh Admin.',
                'data' => $permit
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menolak pengajuan izin: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve a permit request (Director).
     */
    public function directorApprove(Request $request, $id)
    {
        $request->validate([
            'admin_notes' => 'nullable|string',
        ]);

        $permit = PermitRequest::findOrFail($id);

        try {
            $permit->update([
                'status' => 'approved',
                'admin_notes' => $request->admin_notes ?: $permit->admin_notes,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Pengajuan izin berhasil disetujui oleh Direktur.',
                'data' => $permit
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menyetujui pengajuan izin: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject a permit request (Director).
     */
    public function directorReject(Request $request, $id)
    {
        $request->validate([
            'admin_notes' => 'nullable|string',
        ]);

        $permit = PermitRequest::findOrFail($id);

        try {
            $permit->update([
                'status' => 'rejected',
                'admin_notes' => $request->admin_notes ?: $permit->admin_notes,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Pengajuan izin berhasil ditolak oleh Direktur.',
                'data' => $permit
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menolak pengajuan izin: ' . $e->getMessage()
            ], 500);
        }
    }
}
