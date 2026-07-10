<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Holiday extends Model
{
    use HasFactory, \App\Traits\RecycleBinable;

    protected $fillable = [
        'holiday_date',
        'name',
    ];

    protected $casts = [
        'holiday_date' => 'date',
    ];

    /**
     * Get a user-friendly name for this specific record in the Recycle Bin.
     */
    public function getRecycleBinName(): string
    {
        return "Hari Libur: " . $this->name . " (" . ($this->holiday_date ? $this->holiday_date->format('d-m-Y') : '') . ")";
    }
}
