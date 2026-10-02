<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\EmployeeResponsibility;
use App\Models\DailyWorkReport;
use App\Models\DailyTask;
use App\Models\Attendance;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class KpiController extends Controller
{
    // =========================================================================
    // 1. MASTER TANGGUNG JAWAB & TARGET KPI (Admin & Direktur kelola, Karyawan read-only)
    // =========================================================================

    /**
     * Ambil daftar tanggung jawab karyawan (Admin & Direktur).
     */
    public function getResponsibilities(Request $request)
    {
        $query = EmployeeResponsibility::with(['user:id,name,email,division,role,photo', 'creator:id,name']);

        if ($request->has('user_id') && !empty($request->user_id)) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('status') && !empty($request->status)) {
            $query->where('status', $request->status);
        }

        $responsibilities = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $responsibilities
        ]);
    }

    /**
     * Ambil daftar tanggung jawab untuk diri sendiri (Karyawan & Admin).
     */
    public function getMyResponsibilities(Request $request)
    {
        $userId = $request->user()->id;

        $responsibilities = EmployeeResponsibility::where('user_id', $userId)
            ->where('status', 'active')
            ->orderBy('id', 'asc')
            ->get(['id', 'title', 'description', 'target_indicator', 'created_at']);

        return response()->json([
            'status' => 'success',
            'data' => $responsibilities
        ]);
    }

    /**
     * Tambah tanggung jawab baru untuk seorang karyawan (Admin & Direktur).
     */
    public function storeResponsibility(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'target_indicator' => 'nullable|string|max:255',
        ], [
            'user_id.required' => 'Karyawan wajib dipilih.',
            'title.required' => 'Judul tanggung jawab wajib diisi.',
        ]);

        $responsibility = EmployeeResponsibility::create([
            'user_id' => $request->user_id,
            'created_by' => $request->user()->id,
            'title' => $request->title,
            'description' => $request->description,
            'target_indicator' => $request->target_indicator,
            'status' => 'active'
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Tanggung jawab KPI berhasil ditambahkan.',
            'data' => $responsibility->load('user:id,name,division')
        ]);
    }

    /**
     * Edit tanggung jawab (Admin & Direktur).
     */
    public function updateResponsibility(Request $request, int|string $id)
    {
        $responsibility = EmployeeResponsibility::findOrFail($id);

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'target_indicator' => 'nullable|string|max:255',
            'status' => 'nullable|in:active,inactive'
        ]);

        $responsibility->update($request->only(['title', 'description', 'target_indicator', 'status']));

        return response()->json([
            'status' => 'success',
            'message' => 'Tanggung jawab KPI berhasil diperbarui.',
            'data' => $responsibility
        ]);
    }

    /**
     * Hapus tanggung jawab (Admin & Direktur).
     */
    public function destroyResponsibility(int|string $id)
    {
        $responsibility = EmployeeResponsibility::findOrFail($id);
        $responsibility->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Tanggung jawab KPI berhasil dihapus.'
        ]);
    }

    // =========================================================================
    // 2. DAILY WORK REPORT & TO-DO LIST (Karyawan & Admin Pribadi)
    // =========================================================================

    /**
     * Dapatkan laporan & to-do list harian berdasarkan tanggal tertentu (termasuk tanggal lupa).
     */
    public function getReportByDate(Request $request)
    {
        $user = $request->user();
        $date = $request->input('date', Carbon::today()->toDateString());

        // Cek apakah ada catatan absensi masuk pada tanggal tersebut
        $attendance = Attendance::where('user_id', $user->id)
            ->where('date', $date)
            ->first();

        $isAdminOrDirector = in_array($user->role, ['admin', 'director']);
        $hasClockIn = ($attendance && !empty($attendance->clock_in)) || $isAdminOrDirector;

        // Ambil laporan kerja harian untuk tanggal ini
        $report = DailyWorkReport::with([
            'tasks.responsibility:id,title',
            'reviewedByAdmin:id,name',
            'reviewedByDirector:id,name'
        ])
        ->where('user_id', $user->id)
        ->where('date', $date)
        ->first();

        // Ambil daftar tanggung jawab aktif untuk dropdown pilihan
        $myResponsibilities = EmployeeResponsibility::where('user_id', $user->id)
            ->where('status', 'active')
            ->get(['id', 'title']);

        return response()->json([
            'status' => 'success',
            'data' => [
                'date' => $date,
                'has_attendance' => $hasClockIn,
                'attendance' => $attendance ? [
                    'id' => $attendance->id,
                    'clock_in' => $attendance->clock_in,
                    'clock_out' => $attendance->clock_out,
                    'attendance_type' => $attendance->attendance_type,
                ] : null,
                'report' => $report,
                'responsibilities' => $myResponsibilities
            ]
        ]);
    }

    /**
     * Cek status apakah user sudah mengisi To-Do List / KPI untuk hari ini atau tanggal tertentu.
     */
    public function checkTodayKpiStatus(Request $request)
    {
        $user = $request->user();
        $targetDate = $request->input('date') ? Carbon::parse($request->input('date'))->toDateString() : Carbon::today()->toDateString();

        $report = DailyWorkReport::where('user_id', $user->id)
            ->where('date', $targetDate)
            ->withCount('tasks')
            ->first();

        $hasKpi = $report && $report->tasks_count > 0;

        return response()->json([
            'status' => 'success',
            'has_kpi' => $hasKpi,
            'tasks_count' => $report ? (int)$report->tasks_count : 0,
            'report_status' => $report ? $report->status : null,
            'date' => $targetDate,
        ]);
    }

    /**
     * Helper internal: Pastikan sesi DailyWorkReport tersedia untuk user & tanggal.
     */
    private function getOrCreateReport(User $user, string $date): DailyWorkReport
    {
        // Validasi presensi masuk
        $attendance = Attendance::where('user_id', $user->id)
            ->where('date', $date)
            ->first();

        $isAdminOrDirector = in_array($user->role, ['admin', 'director']);
        if (!$isAdminOrDirector && (!$attendance || empty($attendance->clock_in))) {
            abort(422, "Anda belum tercatat melakukan Absen Masuk pada tanggal {$date}. Silakan lakukan absen masuk terlebih dahulu.");
        }

        return DailyWorkReport::firstOrCreate(
            ['user_id' => $user->id, 'date' => $date],
            [
                'attendance_id' => $attendance?->id,
                'status' => 'submitted',
                'completion_rate' => 0.00
            ]
        );
    }

    /**
     * Tambah satu butir tugas (To-Do Item) dengan opsional foto (< 2MB).
     */
    public function addTask(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'nullable|string',
            'status' => 'nullable|string',
            'responsibility_id' => 'nullable|exists:employee_responsibilities,id',
            'image' => 'nullable|image|max:2048' // Maksimal 2MB (2048 KB)
        ], [
            'title.required' => 'Nama tugas wajib diisi.',
            'image.max' => 'Ukuran foto bukti kerja tidak boleh melebihi 2MB.',
            'image.image' => 'File harus berupa gambar (JPG, PNG, WebP).'
        ]);

        $user = $request->user();
        $date = $request->date;

        $report = $this->getOrCreateReport($user, $date);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = 'task_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('daily_tasks', $filename, 'public');
            $imagePath = '/storage/' . $path;
        }

        $orderIndex = $report->tasks()->count();

        $rawStatus = strtolower($request->status ?? 'in_progress');
        if (in_array($rawStatus, ['completed', 'selesai'])) {
            $taskStatus = 'completed';
            $completedAt = now();
        } elseif (in_array($rawStatus, ['revision', 'revisi'])) {
            $taskStatus = 'revision';
            $completedAt = null;
        } else {
            $taskStatus = 'in_progress';
            $completedAt = null;
        }

        $task = DailyTask::create([
            'daily_work_report_id' => $report->id,
            'responsibility_id' => $request->responsibility_id,
            'title' => $request->title,
            'description' => $request->description,
            'image_path' => $imagePath,
            'priority' => $request->priority ?? 'medium',
            'status' => $taskStatus,
            'completed_at' => $completedAt,
            'order_index' => $orderIndex
        ]);

        $report->status = 'submitted';
        $report->save();
        $report->recalculateCompletionRate();

        return response()->json([
            'status' => 'success',
            'message' => 'Tugas berhasil ditambahkan ke to-do list.',
            'data' => $task->load('responsibility:id,title'),
            'completion_rate' => $report->completion_rate
        ]);
    }

    /**
     * Bulk Add: Tambah beberapa butir tugas sekaligus dalam satu kali kirim.
     */
    public function bulkAddTasks(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'tasks' => 'required|array|min:1',
            'tasks.*.title' => 'required|string|max:255',
            'tasks.*.description' => 'nullable|string',
            'tasks.*.priority' => 'nullable|string',
            'tasks.*.status' => 'nullable|string',
            'tasks.*.responsibility_id' => 'nullable|exists:employee_responsibilities,id',
            'tasks.*.image' => 'nullable|image|max:2048',
        ], [
            'tasks.required' => 'Daftar tugas tidak boleh kosong.',
            'tasks.*.title.required' => 'Judul setiap tugas wajib diisi.',
            'tasks.*.image.image' => 'File bukti tugas harus berupa format gambar.',
            'tasks.*.image.max' => 'Ukuran foto bukti tidak boleh lebih dari 2MB.'
        ]);

        $user = $request->user();
        $date = $request->date;

        $report = $this->getOrCreateReport($user, $date);

        $createdTasks = [];
        $startIndex = $report->tasks()->count();

        DB::beginTransaction();
        try {
            foreach ($request->tasks as $idx => $t) {
                $imagePath = null;
                $file = null;

                if ($request->hasFile("tasks.$idx.image")) {
                    $file = $request->file("tasks.$idx.image");
                } elseif ($request->hasFile("task_image_$idx")) {
                    $file = $request->file("task_image_$idx");
                } elseif (isset($t['image']) && $t['image'] instanceof \Illuminate\Http\UploadedFile) {
                    $file = $t['image'];
                }

                if ($file && $file->isValid()) {
                    $filename = 'task_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                    $path = $file->storeAs('daily_tasks', $filename, 'public');
                    $imagePath = '/storage/' . $path;
                }

                $rawStatus = strtolower($t['status'] ?? 'in_progress');
                if (in_array($rawStatus, ['completed', 'selesai'])) {
                    $itemStatus = 'completed';
                    $completedAt = now();
                } elseif (in_array($rawStatus, ['revision', 'revisi'])) {
                    $itemStatus = 'revision';
                    $completedAt = null;
                } else {
                    $itemStatus = 'in_progress';
                    $completedAt = null;
                }

                $createdTasks[] = DailyTask::create([
                    'daily_work_report_id' => $report->id,
                    'responsibility_id' => $t['responsibility_id'] ?? null,
                    'title' => $t['title'],
                    'description' => $t['description'] ?? null,
                    'image_path' => $imagePath,
                    'priority' => $t['priority'] ?? 'medium',
                    'status' => $itemStatus,
                    'completed_at' => $completedAt,
                    'order_index' => $startIndex + $idx
                ]);
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menambahkan tugas secara masal: ' . $e->getMessage()
            ], 500);
        }

        $report->status = 'submitted';
        $report->save();
        $report->recalculateCompletionRate();

        return response()->json([
            'status' => 'success',
            'message' => count($createdTasks) . ' tugas berhasil ditambahkan.',
            'data' => $report->load('tasks.responsibility:id,title')
        ]);
    }

    /**
     * Upload / Ganti foto bukti kerja pada tugas tertentu (< 2MB).
     */
    public function uploadTaskPhoto(Request $request, int|string $id)
    {
        $request->validate([
            'image' => 'required|image|max:2048' // Maksimal 2MB
        ], [
            'image.required' => 'Foto bukti kerja wajib dipilih.',
            'image.max' => 'Ukuran foto tidak boleh lebih dari 2MB.',
            'image.image' => 'File harus berupa format gambar.'
        ]);

        $user = $request->user();
        $task = DailyTask::whereHas('report', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->findOrFail($id);

        // Hapus foto lama jika ada
        if ($task->image_path) {
            $oldPath = str_replace('/storage/', '', $task->image_path);
            Storage::disk('public')->delete($oldPath);
        }

        $file = $request->file('image');
        $filename = 'task_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('daily_tasks', $filename, 'public');
        $imagePath = '/storage/' . $path;

        $task->update(['image_path' => $imagePath]);

        return response()->json([
            'status' => 'success',
            'message' => 'Foto bukti kerja berhasil diunggah.',
            'data' => [
                'task_id' => $task->id,
                'image_path' => $imagePath
            ]
        ]);
    }

    /**
     * Hapus foto bukti kerja pada tugas tertentu.
     */
    public function deleteTaskPhoto(Request $request, int|string $id)
    {
        $user = $request->user();
        $task = DailyTask::whereHas('report', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->findOrFail($id);

        if ($task->image_path) {
            $oldPath = str_replace('/storage/', '', $task->image_path);
            Storage::disk('public')->delete($oldPath);
            $task->update(['image_path' => null]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Foto bukti kerja berhasil dihapus.'
        ]);
    }

    /**
     * Edit judul, prioritas, atau deskripsi tugas.
     */
    public function updateTask(Request $request, int|string $id)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'nullable|in:low,medium,high',
            'responsibility_id' => 'nullable|exists:employee_responsibilities,id',
        ]);

        $user = $request->user();
        $task = DailyTask::whereHas('report', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->findOrFail($id);

        $task->update([
            'title' => $request->title,
            'description' => $request->description,
            'priority' => $request->priority ?? $task->priority,
            'responsibility_id' => $request->responsibility_id,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Tugas berhasil diperbarui.',
            'data' => $task->load('responsibility:id,title')
        ]);
    }

    /**
     * Toggle / Perbarui status checklist tugas:
     * 🟢 Selesai (completed)
     * 🟡 Revisi (revision)
     * 🔴 Proses (in_progress)
     */
    public function updateTaskStatus(Request $request, int|string $id)
    {
        $request->validate([
            'status' => 'required|string|in:pending,in_progress,completed,cancelled,revision,revisi,proses,selesai'
        ]);

        $user = $request->user();
        $taskQuery = DailyTask::query();
        if (!in_array($user->role, ['direktur', 'admin'])) {
            $taskQuery->whereHas('report', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }
        $task = $taskQuery->findOrFail($id);

        $rawStatus = strtolower($request->status);
        if (in_array($rawStatus, ['completed', 'selesai'])) {
            $status = 'completed';
            $completedAt = now();
        } elseif (in_array($rawStatus, ['revision', 'revisi'])) {
            $status = 'revision';
            $completedAt = null;
        } else {
            $status = 'in_progress';
            $completedAt = null;
        }

        $task->update([
            'status' => $status,
            'completed_at' => $completedAt
        ]);

        $report = $task->report;
        $newRate = $report->recalculateCompletionRate();

        return response()->json([
            'status' => 'success',
            'message' => 'Status tugas berhasil diperbarui.',
            'data' => $task,
            'completion_rate' => $newRate
        ]);
    }

    /**
     * Hapus butir tugas.
     */
    public function deleteTask(Request $request, int|string $id)
    {
        $user = $request->user();
        $task = DailyTask::whereHas('report', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->findOrFail($id);

        $report = $task->report;
        $task->delete();

        $newRate = $report->recalculateCompletionRate();

        return response()->json([
            'status' => 'success',
            'message' => 'Tugas berhasil dihapus.',
            'completion_rate' => $newRate
        ]);
    }

    /**
     * Submit Laporan Harian (Finalisasi hari tersebut).
     */
    public function submitDailyReport(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'summary' => 'nullable|string'
        ]);

        $user = $request->user();
        $date = $request->date;

        $report = DailyWorkReport::where('user_id', $user->id)
            ->where('date', $date)
            ->firstOrFail();

        $report->recalculateCompletionRate();

        $report->update([
            'summary' => $request->summary,
            'status' => 'submitted'
        ]);

        $message = $user->role === 'admin'
            ? 'Laporan kerja Admin HR berhasil dikirim langsung ke meja Direktur Utama untuk dievaluasi.'
            : 'Laporan kerja harian berhasil dikirim untuk dievaluasi.';

        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $report
        ]);
    }

    /**
     * Carry-Over: Tarik sisa tugas yang belum selesai dari hari sebelumnya.
     */
    public function carryOverTasks(Request $request)
    {
        $request->validate([
            'target_date' => 'required|date'
        ]);

        $user = $request->user();
        $targetDate = $request->target_date;

        // Cari laporan sebelumnya yang memiliki tugas belum selesai
        $previousReport = DailyWorkReport::where('user_id', $user->id)
            ->where('date', '<', $targetDate)
            ->orderBy('date', 'desc')
            ->first();

        if (!$previousReport) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak ditemukan riwayat tugas dari hari sebelumnya.'
            ], 404);
        }

        $unfinishedTasks = $previousReport->tasks()
            ->where('status', '!=', 'completed')
            ->get();

        if ($unfinishedTasks->isEmpty()) {
            return response()->json([
                'status' => 'info',
                'message' => 'Semua tugas dari hari sebelumnya sudah berstatus selesai atau tidak ada tugas tertunda.'
            ]);
        }

        $targetReport = $this->getOrCreateReport($user, $targetDate);
        $startIndex = $targetReport->tasks()->count();

        $carriedCount = 0;
        foreach ($unfinishedTasks as $idx => $task) {
            // Hindari duplikasi jika nama tugas sama persis sudah ada di target_date
            $exists = $targetReport->tasks()->where('title', $task->title)->exists();
            if (!$exists) {
                $carryDateStr = $previousReport->date ? Carbon::parse($previousReport->date)->format('d/m') : '';
                $suffix = $carryDateStr ? " (Lanjutan dari {$carryDateStr})" : " (Lanjutan)";
                DailyTask::create([
                    'daily_work_report_id' => $targetReport->id,
                    'responsibility_id' => $task->responsibility_id,
                    'title' => $task->title,
                    'description' => $task->description ? ($task->description . $suffix) : ($carryDateStr ? 'Lanjutan dari ' . $carryDateStr : 'Lanjutan tugas sebelumnya'),
                    'priority' => $task->priority,
                    'status' => $task->status === 'revision' ? 'revision' : 'in_progress',
                    'order_index' => $startIndex + $carriedCount
                ]);
                $carriedCount++;
            }
        }

        $targetReport->recalculateCompletionRate();

        return response()->json([
            'status' => 'success',
            'message' => "{$carriedCount} tugas yang belum selesai berhasil dipindahkan ke tanggal {$targetDate}.",
            'data' => $targetReport->load('tasks.responsibility:id,title')
        ]);
    }

    /**
     * Riwayat Laporan Kerja Karyawan itu sendiri.
     */
    public function getHistory(Request $request)
    {
        $user = $request->user();
        $query = DailyWorkReport::with([
            'tasks.responsibility:id,title',
            'reviewedByAdmin:id,name',
            'reviewedByDirector:id,name'
        ])
        ->where('user_id', $user->id);

        if ($request->has('month') && !empty($request->month)) {
            $query->where('date', 'like', $request->month . '%');
        }

        $reports = $query->orderBy('date', 'desc')->paginate(15);

        return response()->json([
            'status' => 'success',
            'data' => $reports
        ]);
    }

    // =========================================================================
    // 3. MONITORING & REVIEW ADMIN
    // =========================================================================

    /**
     * Monitoring seluruh laporan kerja karyawan untuk Admin.
     */
    public function getAdminReports(Request $request)
    {
        $date = $request->input('date', Carbon::today()->toDateString());
        $division = $request->input('division');
        $status = $request->input('status');

        $query = DailyWorkReport::with([
            'user:id,name,email,division,role,photo',
            'tasks.responsibility:id,title',
            'attendance:id,clock_in,clock_out,attendance_type',
            'reviewedByAdmin:id,name'
        ])
        ->whereHas('user', function ($q) {
            // Hanya tampilkan role employee di panel review reguler Admin
            $q->where('role', 'employee');
        })
        ->where('date', $date);

        if ($division && $division !== 'all') {
            $query->whereHas('user', function ($q) use ($division) {
                $q->where('division', $division);
            });
        }

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        $reports = $query->orderBy('created_at', 'desc')->get();

        // Rekap ringkas hari ini
        $totalEmployees = User::where('role', 'employee')->where('status', 'active')->count();
        $attendedEmployees = Attendance::where('date', $date)->whereNotNull('clock_in')->whereHas('user', fn($q) => $q->where('role', 'employee'))->count();
        $submittedReports = $reports->whereIn('status', ['submitted', 'reviewed_admin', 'reviewed_director'])->count();
        $avgRate = $reports->count() > 0 ? round($reports->avg('completion_rate'), 1) : 0;

        return response()->json([
            'status' => 'success',
            'data' => $reports,
            'summary' => [
                'date' => $date,
                'total_employees' => $totalEmployees,
                'attended_employees' => $attendedEmployees,
                'submitted_reports' => $submittedReports,
                'average_completion_rate' => $avgRate
            ]
        ]);
    }

    /**
     * Admin memberikan review, feedback, dan rating bintang (1-5) ke laporan karyawan.
     */
    public function reviewReportAdmin(Request $request, int|string $id)
    {
        $request->validate([
            'admin_rating' => 'required|integer|min:1|max:5',
            'admin_notes' => 'nullable|string|max:1000'
        ], [
            'admin_rating.required' => 'Rating bintang (1-5) wajib dipilih.'
        ]);

        $report = DailyWorkReport::findOrFail($id);

        $report->update([
            'admin_rating' => $request->admin_rating,
            'admin_notes' => $request->admin_notes,
            'reviewed_by_admin_id' => $request->user()->id,
            'status' => 'reviewed_admin'
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Review dan rating berhasil disimpan.',
            'data' => $report->load(['reviewedByAdmin:id,name', 'user:id,name'])
        ]);
    }

    // =========================================================================
    // 4. MONITORING & REVIEW DIREKTUR
    // =========================================================================

    /**
     * Laporan kerja staf ADMIN khusus untuk Direktur (Bypass Admin -> Langsung Direktur).
     */
    public function getAdminReportsForDirector(Request $request)
    {
        $date = $request->input('date');
        $status = $request->input('status');

        $query = DailyWorkReport::with([
            'user:id,name,email,division,role,photo',
            'tasks.responsibility:id,title',
            'attendance:id,clock_in,clock_out',
            'reviewedByDirector:id,name'
        ])
        ->whereHas('user', function ($q) {
            $q->where('role', 'admin');
        });

        if ($request->filled('date') && $request->date !== 'all') {
            $query->where('date', $request->date);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $reports = $query->orderBy('date', 'desc')->orderBy('created_at', 'desc')->get();

        // Rekap ringkas status laporan Admin untuk Direktur
        $allAdminReports = DailyWorkReport::whereHas('user', fn($q) => $q->where('role', 'admin'));
        $totalCount = (clone $allAdminReports)->count();
        $pendingCount = (clone $allAdminReports)->where('status', 'submitted')->count();
        $reviewedCount = (clone $allAdminReports)->where('status', 'reviewed_director')->count();

        return response()->json([
            'status' => 'success',
            'data' => $reports,
            'summary' => [
                'total_admin_reports' => $totalCount,
                'pending_review_count' => $pendingCount,
                'reviewed_count' => $reviewedCount
            ]
        ]);
    }

    /**
     * Overview Direktur: Rekap seluruh performa karyawan & staf admin.
     */
    public function getDirectorOverview(Request $request)
    {
        $date = $request->input('date', Carbon::today()->toDateString());

        $reports = DailyWorkReport::with([
            'user:id,name,email,division,role,photo',
            'tasks.responsibility:id,title',
            'reviewedByAdmin:id,name',
            'reviewedByDirector:id,name'
        ])
        ->where('date', $date)
        ->get();

        $totalTasks = DailyTask::whereHas('report', fn($q) => $q->where('date', $date))->count();
        $completedTasks = DailyTask::whereHas('report', fn($q) => $q->where('date', $date))->where('status', 'completed')->count();
        $adminReportsCount = $reports->where('user.role', 'admin')->count();

        return response()->json([
            'status' => 'success',
            'data' => [
                'date' => $date,
                'reports' => $reports,
                'metrics' => [
                    'total_reports' => $reports->count(),
                    'total_tasks' => $totalTasks,
                    'completed_tasks' => $completedTasks,
                    'company_completion_rate' => $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 1) : 0,
                    'admin_reports_count' => $adminReportsCount
                ]
            ]
        ]);
    }

    /**
     * Direktur memberikan penilaian/review langsung (termasuk untuk staf Admin atau Karyawan).
     */
    public function reviewReportDirector(Request $request, int|string $id)
    {
        $request->validate([
            'director_rating' => 'required|integer|min:1|max:5',
            'director_notes' => 'nullable|string|max:1000'
        ], [
            'director_rating.required' => 'Rating bintang (1-5) wajib dipilih.'
        ]);

        $report = DailyWorkReport::findOrFail($id);

        $report->update([
            'director_rating' => $request->director_rating,
            'director_notes' => $request->director_notes,
            'reviewed_by_director_id' => $request->user()->id,
            'status' => 'reviewed_director'
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Penilaian Direktur berhasil disimpan.',
            'data' => $report->load(['reviewedByDirector:id,name', 'user:id,name'])
        ]);
    }
}
