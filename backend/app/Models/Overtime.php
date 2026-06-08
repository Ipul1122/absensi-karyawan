<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'user_id',
    'date',
    'start_time',
    'end_time',
    'duration',
    'reason',
    'status',
    'admin_notes'
])]
class Overtime extends Model
{
    protected $casts = [
        'duration' => 'double',
        'date' => 'date',
    ];

    /**
     * Get the user that owns the overtime request.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
