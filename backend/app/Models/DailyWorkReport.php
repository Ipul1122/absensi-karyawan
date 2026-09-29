<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Carbon\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property int|null $attendance_id
 * @property \Carbon\Carbon|\Illuminate\Support\Carbon|null $date
 * @property string|null $summary
 * @property string $status
 * @property float $completion_rate
 * @property string|null $admin_notes
 * @property int|null $admin_rating
 * @property int|null $reviewed_by_admin_id
 * @property string|null $director_notes
 * @property int|null $director_rating
 * @property int|null $reviewed_by_director_id
 * @property \Carbon\Carbon|\Illuminate\Support\Carbon|null $created_at
 * @property \Carbon\Carbon|\Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\User|null $user
 * @property-read \App\Models\Attendance|null $attendance
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\DailyTask> $tasks
 * @property-read \App\Models\User|null $reviewedByAdmin
 * @property-read \App\Models\User|null $reviewedByDirector
 */
#[Fillable([
    'user_id',
    'attendance_id',
    'date',
    'summary',
    'status',
    'completion_rate',
    'admin_notes',
    'admin_rating',
    'reviewed_by_admin_id',
    'director_notes',
    'director_rating',
    'reviewed_by_director_id'
])]
class DailyWorkReport extends Model
{
    use \App\Traits\RecycleBinable;

    protected $casts = [
        'date' => 'date',
        'completion_rate' => 'float',
        'admin_rating' => 'integer',
        'director_rating' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function attendance(): BelongsTo
    {
        return $this->belongsTo(Attendance::class, 'attendance_id');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(DailyTask::class, 'daily_work_report_id')->orderBy('order_index')->orderBy('id');
    }

    public function reviewedByAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_admin_id');
    }

    public function reviewedByDirector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_director_id');
    }

    /**
     * Recalculate completion rate based on tasks status.
     */
    public function recalculateCompletionRate(): float
    {
        $total = $this->tasks()->count();
        if ($total === 0) {
            $rate = 0.00;
        } else {
            $completed = $this->tasks()->where('status', 'completed')->count();
            $rate = round(($completed / $total) * 100, 2);
        }

        $this->update(['completion_rate' => $rate]);
        return $rate;
    }

    public function getRecycleBinName(): string
    {
        $userName = $this->user ? $this->user->name : ('User ID: ' . $this->user_id);
        $dateStr = $this->date ? Carbon::parse($this->date)->format('d-m-Y') : '';
        return "Laporan Kerja Harian: " . $userName . " (" . $dateStr . ")";
    }
}
