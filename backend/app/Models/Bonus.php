<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'user_id',
    'bonus_amount',
    'bonus_date',
    'description',
    'status'
])]
class Bonus extends Model
{
    use \App\Traits\RecycleBinable;

    protected $casts = [
        'bonus_amount' => 'double',
        'bonus_date' => 'date',
    ];

    /**
     * Get the user that owns the bonus.
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
        return "Tunjangan/Bonus: " . $userName . " - " . ($this->description ?: 'Tanpa keterangan') . " (Rp " . number_format($this->bonus_amount, 0, ',', '.') . ")";
    }
}
