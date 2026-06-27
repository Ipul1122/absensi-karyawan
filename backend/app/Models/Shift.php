<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'name',
    'start_time',
    'end_time',
    'grace_period'
])]
class Shift extends Model
{
    /**
     * Get the attendances associated with this shift.
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }
}
