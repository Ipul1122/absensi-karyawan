<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'user_id',
    'date',
    'attendance_type',
    'clock_in',
    'latitude_in',
    'longitude_in',
    'photo_in',
    'notes_in',
    'status_in',
    'clock_out',
    'latitude_out',
    'longitude_out',
    'photo_out',
    'notes_out',
    'status_out',
    'approval_status'
])]
class Attendance extends Model
{
    /**
     * Get the user that owns the attendance record.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
