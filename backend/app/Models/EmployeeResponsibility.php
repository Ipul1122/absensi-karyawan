<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'user_id',
    'created_by',
    'title',
    'description',
    'target_indicator',
    'status'
])]
class EmployeeResponsibility extends Model
{
    use \App\Traits\RecycleBinable;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function dailyTasks(): HasMany
    {
        return $this->hasMany(DailyTask::class, 'responsibility_id');
    }

    public function getRecycleBinName(): string
    {
        $userName = $this->user ? $this->user->name : ('User ID: ' . $this->user_id);
        return "Tanggung Jawab KPI: " . $userName . " - " . $this->title;
    }
}
