<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'user_id',
    'category',
    'custom_category',
    'start_date',
    'end_date',
    'reason',
    'image',
    'status',
    'admin_notes',
])]
class LeaveRequest extends Model
{
    /**
     * Get the user that owns the leave request.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
