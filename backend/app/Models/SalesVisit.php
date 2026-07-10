<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'user_id',
    'date',
    'visit_time',
    'client_name',
    'latitude',
    'longitude',
    'photo_path',
    'notes',
    'visit_type',
    'visit_time_out',
    'latitude_out',
    'longitude_out',
    'photo_path_out',
    'notes_out'
])]
class SalesVisit extends Model
{
    protected $casts = [
        'date' => 'date:Y-m-d',
    ];

    /**
     * Get the user that owns the sales visit record.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
