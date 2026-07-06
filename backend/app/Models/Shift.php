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
    use \App\Traits\RecycleBinable;

    /**
     * Get the attendances associated with this shift.
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    /**
     * Get a user-friendly name for this specific record in the Recycle Bin.
     */
    public function getRecycleBinName(): string
    {
        return "Shift Kerja: " . $this->name . " (" . substr($this->start_time, 0, 5) . " - " . substr($this->end_time, 0, 5) . ")";
    }
}
