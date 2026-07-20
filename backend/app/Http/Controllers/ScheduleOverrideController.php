<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\EmployeeScheduleOverride;
use App\Models\User;
use Carbon\Carbon;

class ScheduleOverrideController extends Controller
{
    /**
     * Get list of schedule overrides (Admin endpoint).
     */
    public function index(Request $request)
    {
        $query = EmployeeScheduleOverride::with(['user:id,name,email,employee_number,division', 'creator:id,name']);

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('month') && $request->filled('year')) {
            $query->whereMonth('override_date', $request->month)
                  ->whereYear('override_date', $request->year);
        }

        if ($request->filled('date')) {
            $query->where('override_date', $request->date);
        }

        $overrides = $query->orderBy('override_date', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $overrides
        ]);
    }

    /**
     * Create or update a schedule override.
     */
    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'override_date' => 'required|date',
            'status' => 'required|in:work_day,day_off',
            'reason' => 'nullable|string|max:255',
        ]);

        $admin = $request->user();

        $override = EmployeeScheduleOverride::updateOrCreate(
            [
                'user_id' => $request->user_id,
                'override_date' => $request->override_date,
            ],
            [
                'status' => $request->status,
                'reason' => $request->reason,
                'created_by' => $admin->id,
            ]
        );

        $override->load(['user:id,name,email,employee_number,division', 'creator:id,name']);

        return response()->json([
            'status' => 'success',
            'message' => 'Penyesuaian jadwal khusus berhasil disimpan!',
            'data' => $override
        ]);
    }

    /**
     * Delete a schedule override.
     */
    public function destroy($id)
    {
        $override = EmployeeScheduleOverride::find($id);

        if (!$override) {
            return response()->json([
                'status' => 'error',
                'message' => 'Data penyesuaian jadwal tidak ditemukan.'
            ], 404);
        }

        $override->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Penyesuaian jadwal khusus berhasil dihapus.'
        ]);
    }

    /**
     * Get overrides for current authenticated employee.
     */
    public function getMyOverrides(Request $request)
    {
        $userId = $request->user()->id;
        $query = EmployeeScheduleOverride::where('user_id', $userId);

        if ($request->filled('month') && $request->filled('year')) {
            $query->whereMonth('override_date', $request->month)
                  ->whereYear('override_date', $request->year);
        }

        $overrides = $query->orderBy('override_date', 'asc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $overrides
        ]);
    }
}
