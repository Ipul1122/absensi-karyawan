<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Reimbursement;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class ReimbursementController extends Controller
{
    /**
     * Display a listing of reimbursements for the logged-in employee.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Reimbursement::where('user_id', $user->id);

        if ($request->has('status') && $request->status != 'all') {
            $query->where('status', $request->status);
        }

        $reimbursements = $query->orderBy('expense_date', 'desc')
                               ->orderBy('created_at', 'desc')
                               ->get();

        return response()->json([
            'status' => 'success',
            'data' => $reimbursements
        ]);
    }

    /**
     * Store a newly created reimbursement request.
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string|in:Transportasi,Konsumsi,Medis,Operasional Kantor,Lainnya',
            'amount' => 'required|numeric|min:1',
            'expense_date' => 'required|date',
            'description' => 'nullable|string',
            'receipt' => 'required|file|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // maks 5MB
        ], [
            'receipt.required' => 'Bukti nota/struk belanja wajib diunggah.',
            'receipt.image' => 'Bukti nota harus berupa gambar.',
            'receipt.max' => 'Ukuran berkas bukti nota tidak boleh lebih dari 5MB.',
        ]);

        $receiptPath = null;
        if ($request->hasFile('receipt')) {
            try {
                $file = $request->file('receipt');
                $filename = 'reimb_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->storeAs('reimbursements/receipts', $filename, 'public');
                $receiptPath = '/storage/reimbursements/receipts/' . $filename;
            } catch (\Exception $e) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Gagal mengunggah bukti nota: ' . $e->getMessage()
                ], 500);
            }
        }

        try {
            $reimbursement = Reimbursement::create([
                'user_id' => Auth::id(),
                'title' => $request->title,
                'category' => $request->category,
                'amount' => $request->amount,
                'expense_date' => $request->expense_date,
                'description' => $request->description,
                'receipt_path' => $receiptPath,
                'status' => 'pending'
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Pengajuan reimbursement berhasil dikirim.',
                'data' => $reimbursement
            ], 201);
        } catch (\Exception $e) {
            // Hapus file jika database gagal menyimpan
            if ($receiptPath) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $receiptPath));
            }
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menyimpan pengajuan reimbursement: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel/delete a pending reimbursement request.
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $reimbursement = Reimbursement::where('id', $id)
                                      ->where('user_id', $user->id)
                                      ->firstOrFail();

        if ($reimbursement->status !== 'pending') {
            return response()->json([
                'status' => 'error',
                'message' => 'Pengajuan yang sudah diproses oleh Admin tidak dapat dibatalkan.'
            ], 400);
        }

        try {
            // Hapus file nota dari storage
            if ($reimbursement->receipt_path) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $reimbursement->receipt_path));
            }

            $reimbursement->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Pengajuan reimbursement berhasil dibatalkan.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal membatalkan pengajuan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display all reimbursements for Admin dashboard.
     */
    public function indexAdmin(Request $request)
    {
        $query = Reimbursement::with('user:id,name,email');

        if ($request->has('status') && $request->status != 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('category') && $request->category != 'all') {
            $query->where('category', $request->category);
        }

        $reimbursements = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $reimbursements
        ]);
    }

    /**
     * Approve a reimbursement claim.
     */
    public function approve($id)
    {
        $reimbursement = Reimbursement::findOrFail($id);

        if ($reimbursement->status !== 'pending') {
            return response()->json([
                'status' => 'error',
                'message' => 'Pengajuan ini sudah selesai diproses sebelumnya.'
            ], 400);
        }

        try {
            $reimbursement->update([
                'status' => 'approved',
                'admin_notes' => 'Disetujui oleh Admin.'
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Pengajuan reimbursement berhasil disetujui.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menyetujui pengajuan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject a reimbursement claim with reason.
     */
    public function reject(Request $request, $id)
    {
        $reimbursement = Reimbursement::findOrFail($id);

        if ($reimbursement->status !== 'pending') {
            return response()->json([
                'status' => 'error',
                'message' => 'Pengajuan ini sudah selesai diproses sebelumnya.'
            ], 400);
        }

        $request->validate([
            'admin_notes' => 'required|string|max:1000'
        ], [
            'admin_notes.required' => 'Alasan penolakan wajib diisi.'
        ]);

        try {
            $reimbursement->update([
                'status' => 'rejected',
                'admin_notes' => $request->admin_notes
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Pengajuan reimbursement berhasil ditolak.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menolak pengajuan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get summary analytics of reimbursements for Admin dashboard.
     */
    public function summaryAdmin()
    {
        $thisMonth = now()->month;
        $thisYear = now()->year;

        $totalApprovedThisMonth = Reimbursement::where('status', 'approved')
            ->whereMonth('expense_date', $thisMonth)
            ->whereYear('expense_date', $thisYear)
            ->sum('amount');

        $pendingCount = Reimbursement::where('status', 'pending')->count();
        $approvedCount = Reimbursement::where('status', 'approved')->count();
        $rejectedCount = Reimbursement::where('status', 'rejected')->count();

        // Ambil pengeluaran per kategori
        $categoryBreakdown = Reimbursement::where('status', 'approved')
            ->selectRaw('category, sum(amount) as total')
            ->groupBy('category')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_approved_this_month' => $totalApprovedThisMonth,
                'pending_count' => $pendingCount,
                'approved_count' => $approvedCount,
                'rejected_count' => $rejectedCount,
                'category_breakdown' => $categoryBreakdown
            ]
        ]);
    }
}
