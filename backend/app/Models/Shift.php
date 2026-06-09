<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'name',
    'clock_in',
    'clock_out',
    'early_checkin_before',
    'late_checkin_after',
    'early_checkout_before',
    'overtime_checkout_after'
])]
class Shift extends Model
{
    /**
     * Get the users assigned to this shift.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
