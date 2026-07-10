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
    use \App\Traits\RecycleBinable;

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

    /**
     * Get a user-friendly name for this specific record in the Recycle Bin.
     */
    public function getRecycleBinName(): string
    {
        $userName = $this->user ? $this->user->name : ('User ID: ' . $this->user_id);
        return "Lembur: " . $userName . " - Tanggal " . ($this->date ? $this->date->format('d-m-Y') : '') . " (" . $this->duration . " jam)";
    }
}
