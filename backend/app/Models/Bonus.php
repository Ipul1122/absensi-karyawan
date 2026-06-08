<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'user_id',
    'bonus_amount',
    'bonus_date',
    'description'
])]
class Bonus extends Model
{
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
}
