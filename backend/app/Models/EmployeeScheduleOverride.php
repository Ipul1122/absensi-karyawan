<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'user_id',
    'override_date',
    'status',
    'reason',
    'created_by'
])]
class EmployeeScheduleOverride extends Model
{
    protected $casts = [
        'override_date' => 'date:Y-m-d',
    ];

    /**
     * Get the user that owns the schedule override.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the admin user who created the schedule override.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
