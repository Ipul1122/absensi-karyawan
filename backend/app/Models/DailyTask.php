<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Support\Facades\Storage;

#[Fillable([
    'daily_work_report_id',
    'responsibility_id',
    'title',
    'description',
    'image_path',
    'priority',
    'status',
    'completed_at',
    'order_index'
])]
class DailyTask extends Model
{
    protected $casts = [
        'completed_at' => 'datetime',
        'order_index' => 'integer',
    ];

    public function report(): BelongsTo
    {
        return $this->belongsTo(DailyWorkReport::class, 'daily_work_report_id');
    }

    public function responsibility(): BelongsTo
    {
        return $this->belongsTo(EmployeeResponsibility::class, 'responsibility_id');
    }

    protected static function booted(): void
    {
        static::deleted(function ($task) {
            if ($task->image_path) {
                $filePath = str_replace('/storage/', '', $task->image_path);
                Storage::disk('public')->delete($filePath);
            }
        });
    }
}
