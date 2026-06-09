<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Bonus;
use Illuminate\Support\Facades\Auth;

class BonusController extends Controller
{
    /**
     * Display a listing of bonuses for the logged-in employee.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $bonuses = Bonus::where('user_id', $user->id)
                        ->where('status', 'approved')
                        ->orderBy('bonus_date', 'desc')
                        ->orderBy('created_at', 'desc')
                        ->get();

        return response()->json([
            'status' => 'success',
            'data' => $bonuses
        ]);
    }

    /**
     * Display all bonuses for Admin dashboard.
     */
    public function indexAdmin(Request $request)
    {
        $query = Bonus::with('user:id,name,email');

        if ($request->has('user_id') && $request->user_id != 'all') {
            $query->where('user_id', $request->user_id);
        }

        $bonuses = $query->orderBy('bonus_date', 'desc')
                         ->orderBy('created_at', 'desc')
                         ->get();

        return response()->json([
            'status' => 'success',
            'data' => $bonuses
        ]);
    }

    /**
     * Store a newly created bonus.
     */
    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'bonus_amount' => 'required|numeric|min:1',
            'bonus_date' => 'required|date',
            'description' => 'nullable|string|max:1000',
        ], [
            'user_id.required' => 'Penerima bonus wajib dipilih.',
            'user_id.exists' => 'Karyawan tidak ditemukan.',
            'bonus_amount.required' => 'Jumlah bonus wajib diisi.',
            'bonus_amount.numeric' => 'Jumlah bonus harus berupa angka.',
            'bonus_amount.min' => 'Jumlah bonus minimal Rp 1.',
            'bonus_date.required' => 'Tanggal bonus wajib diisi.',
            'bonus_date.date' => 'Format tanggal bonus tidak valid.'
        ]);

        try {
            $bonus = Bonus::create([
                'user_id' => $request->user_id,
                'bonus_amount' => $request->bonus_amount,
                'bonus_date' => $request->bonus_date,
                'description' => $request->description,
                'status' => 'pending',
            ]);

            // Load user info for response
            $bonus->load('user:id,name,email');

            return response()->json([
                'status' => 'success',
                'message' => 'Bonus berhasil ditambahkan dan menunggu persetujuan Direktur.',
                'data' => $bonus
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menambahkan bonus: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified bonus.
     */
    public function update(Request $request, $id)
    {
        $bonus = Bonus::findOrFail($id);

        $request->validate([
            'bonus_amount' => 'required|numeric|min:1',
            'bonus_date' => 'required|date',
            'description' => 'nullable|string|max:1000',
        ], [
            'bonus_amount.required' => 'Jumlah bonus wajib diisi.',
            'bonus_amount.numeric' => 'Jumlah bonus harus berupa angka.',
            'bonus_amount.min' => 'Jumlah bonus minimal Rp 1.',
            'bonus_date.required' => 'Tanggal bonus wajib diisi.',
            'bonus_date.date' => 'Format tanggal bonus tidak valid.'
        ]);

        try {
            $bonus->update([
                'bonus_amount' => $request->bonus_amount,
                'bonus_date' => $request->bonus_date,
                'description' => $request->description,
            ]);

            $bonus->load('user:id,name,email');

            return response()->json([
                'status' => 'success',
                'message' => 'Data bonus berhasil diperbarui.',
                'data' => $bonus
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memperbarui bonus: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified bonus.
     */
    public function destroy($id)
    {
        $bonus = Bonus::findOrFail($id);

        try {
            $bonus->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Bonus berhasil dihapus.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menghapus bonus: ' . $e->getMessage()
            ], 500);
        }
    }

    public function directorApprove($id)
    {
        $bonus = Bonus::findOrFail($id);
        $bonus->update(['status' => 'approved']);
        return response()->json(['status' => 'success', 'message' => 'Bonus berhasil disetujui.']);
    }

    public function directorReject($id)
    {
        $bonus = Bonus::findOrFail($id);
        $bonus->update(['status' => 'rejected']);
        return response()->json(['status' => 'success', 'message' => 'Bonus ditolak.']);
    }
}
