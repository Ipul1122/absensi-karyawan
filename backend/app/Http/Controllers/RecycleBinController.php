<?php

namespace App\Http\Controllers;

use App\Models\RecycleBin;
use Illuminate\Http\Request;
use Carbon\Carbon;

class RecycleBinController extends Controller
{
    /**
     * Display a paginated listing of recycle bin items with filters.
     */
    public function index(Request $request)
    {
        // 1. Auto cleanup expired items (older than 30 days) on access as fallback
        $this->cleanupExpiredItems();

        $query = RecycleBin::query();

        // 2. Filter by Date (Exact Day)
        if ($request->filled('date')) {
            $query->whereDate('deleted_at', $request->date);
        }

        // 3. Filter by Month (1-12)
        if ($request->filled('month')) {
            $query->whereMonth('deleted_at', $request->month);
        }

        // 4. Filter by Year (YYYY)
        if ($request->filled('year')) {
            $query->whereYear('deleted_at', $request->year);
        }

        // 5. Paginate results (> 10 items, default 15)
        $limit = $request->input('limit', 15);
        $items = $query->orderBy('deleted_at', 'desc')->paginate($limit);

        // 6. Map model types to user-friendly modules names
        $items->getCollection()->transform(function ($item) {
            $item->module_name = $this->getFriendlyModuleName($item->model_type);
            return $item;
        });

        return response()->json([
            'status' => 'success',
            'data' => $items
        ]);
    }

    /**
     * Restore the soft-deleted record.
     */
    public function restore(int $id)
    {
        $item = RecycleBin::findOrFail($id);
        $modelClass = $item->model_type;

        if (!class_exists($modelClass)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tipe data model tidak didukung.'
            ], 400);
        }

        // Find the soft deleted model instance
        $model = $modelClass::onlyTrashed()->find($item->model_id);

        if (!$model) {
            return response()->json([
                'status' => 'error',
                'message' => 'Data asli tidak ditemukan di tempat sampah.'
            ], 404);
        }

        // Restore the model. Trait's static::restored event will delete the RecycleBin record.
        $model->restore();

        return response()->json([
            'status' => 'success',
            'message' => 'Data berhasil dipulihkan.'
        ]);
    }

    /**
     * Permanently delete the soft-deleted record.
     */
    public function destroy(int $id)
    {
        $item = RecycleBin::findOrFail($id);
        $modelClass = $item->model_type;

        if (!class_exists($modelClass)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tipe data model tidak didukung.'
            ], 400);
        }

        // Find the soft deleted model instance
        $model = $modelClass::onlyTrashed()->find($item->model_id);

        if ($model) {
            // Force delete the model. Trait's static::forceDeleted event will delete the RecycleBin record.
            $model->forceDelete();
        } else {
            // Fallback: If original model is already gone, just delete the bin record
            $item->delete();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Data berhasil dihapus secara permanen.'
        ]);
    }

    /**
     * Helper to automatically delete items in the recycle bin for over 30 days.
     */
    private function cleanupExpiredItems(): void
    {
        $expired = RecycleBin::where('deleted_at', '<', now()->subDays(30))->get();
        foreach ($expired as $item) {
            $modelClass = $item->model_type;
            try {
                if (class_exists($modelClass)) {
                    $model = $modelClass::onlyTrashed()->find($item->model_id);
                    if ($model) {
                        $model->forceDelete();
                    }
                }
            } catch (\Exception $e) {
                // Ignore or log error
            }
            $item->delete();
        }
    }

    /**
     * Helper to map Eloquent model names to Indonesian human-friendly module names.
     */
    private function getFriendlyModuleName(string $modelType): string
    {
        $map = [
            'App\Models\User' => 'Karyawan',
            'App\Models\Holiday' => 'Hari Libur',
            'App\Models\Shift' => 'Shift Kerja',
            'App\Models\Inventory' => 'Inventaris',
            'App\Models\LeaveRequest' => 'Cuti',
            'App\Models\PermitRequest' => 'Izin Karyawan',
            'App\Models\Reimbursement' => 'Reimbursement',
            'App\Models\Bonus' => 'Tunjangan & Bonus',
            'App\Models\Overtime' => 'Lembur',
            'App\Models\Payroll' => 'Gaji / Payroll',
        ];

        return $map[$modelType] ?? 'Lain-lain';
    }
}
